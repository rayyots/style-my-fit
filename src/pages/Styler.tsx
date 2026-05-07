import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  AvatarConfig,
  bodyScaleFromHeight,
  defaultAvatar,
  fetchAvatar,
  fetchAvatarGlbUrl,
  upsertAvatar,
} from "@/lib/avatar";
import { Avatar3D } from "@/components/Avatar3D";
import { OutfitBuilder } from "@/components/OutfitBuilder";
import { OutfitItem, OutfitTab, VibeId } from "@/lib/outfits";
import { AvatarCustomizer, BODY_TYPES, BodyType } from "@/components/AvatarCustomizer";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNavTrigger } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUserContext } from "@/hooks/useUserContext";
import { Sliders } from "lucide-react";

/** Render an outfit item as a colored mesh layer wrapping the avatar. */
const OutfitMeshes = ({
  selection,
  avatar,
}: {
  selection: Partial<Record<OutfitTab, OutfitItem>>;
  avatar: AvatarConfig;
}) => {
  return (
    <>
      {/* Top — torso cylinder */}
      {selection.top && (
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry
            args={[
              0.42 * avatar.shoulders + 0.07,
              0.38 * avatar.waist + 0.07,
              1.05,
              48,
              6,
              true,
            ]}
          />
          <meshStandardMaterial color={colorFor(selection.top!.product_id, "#6B7280")} roughness={0.85} />
        </mesh>
      )}
      {/* Jacket — slightly larger torso shell + sleeves */}
      {selection.jacket && (
        <group>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry
              args={[
                0.46 * avatar.shoulders + 0.11,
                0.44 * avatar.waist + 0.11,
                1.1,
                48,
                6,
                true,
              ]}
            />
            <meshStandardMaterial color={colorFor(selection.jacket!.product_id, "#1f2937")} roughness={0.7} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * (0.42 * avatar.shoulders + 0.06), 0.35, 0]}
              rotation={[0, 0, side * 0.05]}
              castShadow
            >
              <cylinderGeometry args={[0.14, 0.11, 0.65, 18, 1, true]} />
              <meshStandardMaterial color={colorFor(selection.jacket!.product_id, "#1f2937")} roughness={0.7} />
            </mesh>
          ))}
        </group>
      )}
      {/* Bottom — leg cylinders + waistband */}
      {selection.bottom && (
        <group position={[0, -0.35, 0]}>
          <mesh>
            <cylinderGeometry
              args={[0.44 * avatar.hips + 0.07, 0.40 * avatar.hips + 0.07, 0.20, 32, 1, true]}
            />
            <meshStandardMaterial color={colorFor(selection.bottom!.product_id, "#1c2a55")} roughness={0.8} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.16 * avatar.hips, -0.62, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.16, 1.20, 28, 1, true]} />
              <meshStandardMaterial color={colorFor(selection.bottom!.product_id, "#1c2a55")} roughness={0.8} />
            </mesh>
          ))}
        </group>
      )}
      {/* Shoes — boxes over feet */}
      {selection.shoes && (
        <group position={[0, -1.21, 0.07]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.16 * avatar.hips, 0, 0]} castShadow>
              <boxGeometry args={[0.20, 0.10, 0.40]} />
              <meshStandardMaterial color={colorFor(selection.shoes!.product_id, "#0f172a")} roughness={0.5} />
            </mesh>
          ))}
        </group>
      )}
      {/* Accessory — small floating panel at chest */}
      {selection.accessory && (
        <mesh position={[0, 0.55, 0.5]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.04]} />
          <meshStandardMaterial color={colorFor(selection.accessory!.product_id, "#C9A84C")} metalness={0.4} roughness={0.4} />
        </mesh>
      )}
    </>
  );
};

/** Stable HSL color from the product id so each outfit looks distinct. */
function colorFor(seed: string, fallback: string): string {
  if (!seed) return fallback;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const sat = 28 + (h % 35);
  const lit = 30 + ((h >> 8) % 28);
  return `hsl(${hue} ${sat}% ${lit}%)`;
}

const Styler = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile } = useUserContext();

  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [bodyType, setBodyType] = useState<BodyType>("regular");
  const [height, setHeight] = useState<number>(170);
  const [gender, setGender] = useState<string>("nonbinary");
  const [selection, setSelection] = useState<Partial<Record<OutfitTab, OutfitItem>>>({});
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const [a, g, { data: prof }, { data: avRow }] = await Promise.all([
        fetchAvatar(user.id),
        fetchAvatarGlbUrl(user.id),
        supabase.from("profiles").select("gender,height_cm,style_vibe").eq("id", user.id).maybeSingle(),
        supabase.from("avatars").select("body_type,height_cm").eq("user_id", user.id).maybeSingle(),
      ]);
      setAvatar(a ?? defaultAvatar);
      setGlbUrl(g);
      const bt = (avRow?.body_type as BodyType) || "regular";
      if (BODY_TYPES.includes(bt as any)) setBodyType(bt);
      setHeight(Number(avRow?.height_cm ?? prof?.height_cm ?? 170));
      setGender(prof?.gender ?? "nonbinary");
    })();
  }, [user, loading, navigate]);

  const bodyScale = useMemo(() => bodyScaleFromHeight(height), [height]);

  const avatarSnapshot = useMemo(() => {
    if (!avatar) return {};
    return {
      ...avatar,
      body_type: bodyType,
      height_cm: height,
      gender,
      glb_url: glbUrl,
    };
  }, [avatar, bodyType, height, gender, glbUrl]);

  const persist = async () => {
    if (!user || !avatar) return;
    try {
      await Promise.all([
        upsertAvatar(user.id, avatar),
        supabase.from("avatars").update({ body_type: bodyType, height_cm: height }).eq("user_id", user.id),
        supabase.from("profiles").update({ height_cm: height, gender }).eq("id", user.id),
      ]);
      toast.success("Avatar saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    }
  };

  if (!avatar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="font-mono-ed text-xs tracking-[0.3em] animate-shimmer">PREPARING STYLER…</span>
      </div>
    );
  }

  const defaultVibe = (profile as any)?.style_vibe ?? null;

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b border-foreground/10 px-3 sm:px-6 py-3 flex items-center justify-between bg-background/95 backdrop-blur z-10 gap-3">
        <div className="flex items-center gap-2">
          <MobileNavTrigger />
          <button
            onClick={() => navigate("/showroom")}
            className="hidden sm:inline font-mono-ed text-xs tracking-[0.3em] hover:text-gold transition-colors"
          >
            ← SHOWROOM
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Logo to="/showroom" />
          <span className="hidden md:inline font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">· STYLER</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCustomizer((s) => !s)}
            className="font-mono-ed text-[10px] tracking-[0.3em] hover:text-gold inline-flex items-center gap-1"
          >
            <Sliders size={13} /> AVATAR
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-[1fr_400px] grid-rows-[1fr] overflow-hidden">
        {/* Avatar canvas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative min-h-0"
          style={{ background: "linear-gradient(180deg, #f8f6f0 0%, #e8e4dc 100%)" }}
        >
          <Canvas shadows camera={{ position: [0, 1.4, 4], fov: 42 }} dpr={[1, 1.75]}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 6, 4]} intensity={1.1} castShadow />
            <directionalLight position={[-3, 4, -2]} intensity={0.45} color="#d4a85a" />
            <Suspense fallback={null}>
              <Avatar3D cfg={avatar} bodyScale={bodyScale} gender={gender} glbUrl={glbUrl} />
              <OutfitMeshes selection={selection} avatar={avatar} />
              <ContactShadows position={[0, -1.21, 0]} opacity={0.55} scale={6} blur={2.5} />
              <Environment preset="studio" />
            </Suspense>
            <OrbitControls
              enablePan={false}
              minDistance={1.8}
              maxDistance={6}
              target={[0, 0.6, 0]}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2}
              enableDamping
              dampingFactor={0.08}
              rotateSpeed={0.7}
              touches={{ ONE: 0, TWO: 2 }}
            />
          </Canvas>

          {/* Customizer overlay (toggleable) */}
          {showCustomizer && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-background/95 backdrop-blur border border-gold/40 p-4 z-10 shadow-luxe"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono-ed text-[10px] tracking-[0.3em] text-gold">CUSTOMIZE AVATAR</p>
                <button
                  onClick={() => setShowCustomizer(false)}
                  className="font-mono-ed text-[10px] tracking-[0.3em] hover:text-gold"
                >
                  CLOSE
                </button>
              </div>
              <AvatarCustomizer
                cfg={avatar}
                bodyType={bodyType}
                height={height}
                gender={gender}
                onChange={({ cfg, bodyType, height, gender }) => {
                  setAvatar(cfg);
                  setBodyType(bodyType);
                  setHeight(height);
                  setGender(gender);
                }}
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="rounded-none h-9 font-mono-ed text-[10px] tracking-[0.3em]"
                  onClick={() => navigate("/onboarding?edit=1")}
                >
                  RPM IFRAME
                </Button>
                <Button
                  className="rounded-none h-9 bg-gradient-gold text-gold-foreground font-mono-ed text-[10px] tracking-[0.3em]"
                  onClick={persist}
                >
                  SAVE
                </Button>
              </div>
            </motion.div>
          )}

          {/* Hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono-ed text-[9px] sm:text-[10px] tracking-[0.3em] bg-background/85 backdrop-blur px-3 py-1.5 border border-gold/30 text-muted-foreground">
            <span className="hidden md:inline">DRAG · SCROLL · STYLE YOUR LOOK</span>
            <span className="md:hidden">SWIPE · PINCH · TAP STYLE</span>
          </div>
        </motion.div>

        {/* Outfit builder */}
        <OutfitBuilder
          selection={selection}
          onSelectionChange={setSelection}
          avatarSnapshot={avatarSnapshot}
          defaultVibe={defaultVibe as VibeId | null}
        />
      </div>
    </div>
  );
};

export default Styler;