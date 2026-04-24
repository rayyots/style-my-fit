import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchAvatar, AvatarConfig, bodyScaleFromHeight } from "@/lib/avatar";
import { TryOnScene, OverlayCfg, GarmentKind, guessGarment } from "@/components/TryOnScene";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { addToCart, formatPrice } from "@/lib/cart";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Product {
  id: string; name: string; category: string; description: string | null;
  gender: string; sizes: string[]; images: string[]; price_cents: number; currency: string;
}

// Snap presets per garment kind
const PRESETS: Record<GarmentKind, Record<string, { y: number; z: number; scale: number }>> = {
  top:       { front: { y: 0.0, z: 0.0, scale: 1.0 },  center: { y: -0.05, z: 0.02, scale: 1.05 }, accurate: { y: 0.02, z: 0.04, scale: 1.0 } },
  jacket:    { front: { y: 0.05, z: 0.0, scale: 1.05 },center: { y: 0.0, z: 0.03, scale: 1.1 }, accurate: { y: 0.04, z: 0.05, scale: 1.05 } },
  bottom:    { front: { y: 0.0, z: 0.0, scale: 1.0 },  center: { y: -0.05, z: 0.02, scale: 1.05 }, accurate: { y: 0.0, z: 0.04, scale: 1.05 } },
  dress:     { front: { y: 0.0, z: 0.0, scale: 1.0 },  center: { y: 0.0, z: 0.02, scale: 1.05 }, accurate: { y: 0.05, z: 0.04, scale: 1.05 } },
  shoes:     { front: { y: 0.0, z: 0.0, scale: 1.0 },  center: { y: 0.0, z: 0.0, scale: 1.05 },  accurate: { y: 0.0, z: 0.0, scale: 1.0 } },
  hat:       { front: { y: 0.5, z: 0.0, scale: 1.0 },  center: { y: 0.55, z: 0.0, scale: 1.05 }, accurate: { y: 0.6, z: 0.0, scale: 1.0 } },
  accessory: { front: { y: 0.0, z: 0.0, scale: 1.0 },  center: { y: 0.05, z: 0.0, scale: 1.05 }, accurate: { y: 0.1, z: 0.0, scale: 1.0 } },
};

const TryOn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [bodyScale, setBodyScale] = useState(1);
  const [gender, setGender] = useState<string | undefined>();
  const [imageIdx, setImageIdx] = useState(0);
  const [size, setSize] = useState<string>("");

  // Overlay alignment (relative to category default)
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [z, setZ] = useState(0.02);
  const [scale, setScale] = useState(1.05);
  const [rot, setRot] = useState(0);
  const [mode, setMode] = useState<"wrap" | "flat">("wrap");

  const garment: GarmentKind = product ? guessGarment(product.category) : "top";

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const [{ data: p }, av, { data: prof }] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).maybeSingle(),
        fetchAvatar(user.id),
        supabase.from("profiles").select("height_cm,gender").eq("id", user.id).maybeSingle(),
      ]);
      setProduct(p as any);
      setAvatar(av);
      setBodyScale(bodyScaleFromHeight(prof?.height_cm ? Number(prof.height_cm) : null));
      setGender(prof?.gender ?? undefined);
      if (p?.sizes?.length) setSize(p.sizes[0]);
      if (p) {
        const def = PRESETS[guessGarment(p.category)].center;
        setY(def.y); setZ(def.z); setScale(def.scale);
      }
    })();
  }, [id, user, authLoading, navigate]);

  const overlayUrl = product?.images[imageIdx];

  const overlay: OverlayCfg | null = useMemo(() => {
    if (!overlayUrl) return null;
    return { url: overlayUrl, x, y, z, scale, rotation: rot, mode, garment };
  }, [overlayUrl, x, y, z, scale, rot, mode, garment]);

  const applyPreset = (key: "front" | "center" | "accurate") => {
    const p = PRESETS[garment][key];
    setX(0); setRot(0);
    setY(p.y); setZ(p.z); setScale(p.scale);
  };

  if (!product || !avatar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="font-mono-ed text-xs tracking-[0.3em] animate-shimmer">PREPARING TRY-ON…</span>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!user || !size) return;
    try {
      await addToCart(user.id, product.id, size, 1);
      toast.success("Added to cart");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleBuy = async () => {
    await handleAddToCart();
    navigate("/checkout");
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b border-foreground/10 px-4 sm:px-6 py-3 flex items-center justify-between bg-background/95 backdrop-blur z-10">
        <button onClick={() => navigate(-1)} className="font-mono-ed text-[10px] sm:text-xs tracking-[0.3em] hover:text-gold transition-colors">← BACK</button>
        <div className="flex items-center gap-3">
          <Logo to="/showroom" />
          <span className="hidden md:inline font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">· TRY-ON</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/cart")} className="font-mono-ed text-[10px] tracking-[0.3em] hover:text-gold">CART →</button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-[1fr_380px] grid-rows-[1fr_auto] lg:grid-rows-1 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative min-h-0"
        >
          <TryOnScene avatar={avatar} overlay={overlay} bodyScale={bodyScale} gender={gender} />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono-ed text-[9px] sm:text-[10px] tracking-[0.3em] bg-background/85 backdrop-blur px-3 py-1.5 border border-gold/30 text-muted-foreground">
            <span className="hidden md:inline">DRAG TO ROTATE · SCROLL TO ZOOM</span>
            <span className="md:hidden">SWIPE · PINCH</span>
          </div>
        </motion.div>

        <aside className="border-t lg:border-t-0 lg:border-l border-foreground/10 overflow-y-auto p-5 sm:p-6 space-y-5 max-h-[55vh] lg:max-h-none">
          <div>
            <p className="font-mono-ed text-[10px] tracking-[0.3em] text-gold">{product.category.toUpperCase()}</p>
            <h1 className="font-display text-2xl sm:text-3xl leading-tight mt-1">{product.name}</h1>
            <p className="text-lg mt-2">{formatPrice(product.price_cents, product.currency)}</p>
            {product.description && <p className="text-sm text-muted-foreground mt-3">{product.description}</p>}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((src, i) => (
                <button key={i} onClick={() => setImageIdx(i)} className={`w-14 h-14 border ${i===imageIdx?"border-gold":"border-foreground/20 hover:border-gold/60"}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div>
            <Label className="text-[10px] uppercase tracking-widest mb-2 block">Size</Label>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button key={s} onClick={() => setSize(s)}
                  className={`min-w-12 h-10 px-3 border text-[11px] tracking-widest transition-colors ${size===s?"bg-foreground text-background border-foreground":"border-foreground/20 hover:border-gold"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-widest mb-2 block">Render</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["wrap","flat"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`h-10 border text-[10px] tracking-[0.2em] uppercase transition-colors ${mode===m?"bg-foreground text-background border-foreground":"border-foreground/20 hover:border-gold"}`}>
                  {m === "wrap" ? "3D Wrap" : "Flat overlay"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-widest mb-2 block">Quick fit · {garment}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["front","center","accurate"] as const).map((p) => (
                <button key={p} onClick={() => applyPreset(p)}
                  className="h-10 border border-foreground/20 hover:border-gold text-[10px] tracking-[0.2em] uppercase transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>

          <details className="border-t border-foreground/10 pt-4">
            <summary className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground cursor-pointer">FINE · ALIGNMENT</summary>
            <div className="space-y-3 mt-3">
              {[
                { label: "Horizontal", v: x, set: setX, min: -1, max: 1, step: 0.01 },
                { label: "Vertical",   v: y, set: setY, min: -0.5, max: 1, step: 0.01 },
                { label: "Inflation",  v: z, set: setZ, min: 0, max: 0.3, step: 0.005 },
                { label: "Scale",      v: scale, set: setScale, min: 0.4, max: 2, step: 0.01 },
                { label: "Rotation",   v: rot, set: setRot, min: -1, max: 1, step: 0.01 },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between mb-1">
                    <Label className="text-[10px] uppercase tracking-widest">{s.label}</Label>
                    <span className="font-mono-ed text-[10px] text-muted-foreground">{s.v.toFixed(2)}</span>
                  </div>
                  <Slider value={[s.v]} onValueChange={([v]) => s.set(v)} min={s.min} max={s.max} step={s.step} />
                </div>
              ))}
            </div>
          </details>

          <div className="border-t border-gold/30 pt-4 space-y-2">
            <Button
              onClick={handleBuy}
              disabled={!size}
              className="w-full rounded-none h-12 font-mono-ed text-xs tracking-[0.3em] bg-gradient-gold text-gold-foreground hover:opacity-90 border-0"
            >
              BUY NOW
            </Button>
            <Button
              variant="outline"
              onClick={handleAddToCart}
              disabled={!size}
              className="w-full rounded-none h-12 font-mono-ed text-xs tracking-[0.3em]"
            >
              ADD TO CART
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TryOn;
