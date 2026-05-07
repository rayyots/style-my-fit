import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Heart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchAvatar,
  AvatarConfig,
  bodyScaleFromHeight,
  fetchAvatarGlbUrl,
} from "@/lib/avatar";
import {
  TryOnScene,
  OverlayCfg,
  GarmentKind,
  guessGarment,
} from "@/components/TryOnScene";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { addToCart, formatPrice } from "@/lib/cart";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNavTrigger } from "@/components/MobileNav";
import { useUserContext } from "@/hooks/useUserContext";
import { fitScore, fitVerdict, suggestBetterSize, SizeTier } from "@/lib/sizing";
import {
  addToWishlist,
  listWishlistIds,
  removeFromWishlist,
} from "@/lib/wishlist";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  gender: string;
  sizes: string[];
  images: string[];
  price_cents: number;
  currency: string;
}

const PRESETS: Record<
  GarmentKind,
  Record<string, { y: number; z: number; scale: number }>
> = {
  top:       { front: { y: 0.0,  z: 0.0,  scale: 1.0  }, center: { y: -0.05, z: 0.02, scale: 1.05 }, accurate: { y: 0.02, z: 0.04, scale: 1.0  } },
  jacket:    { front: { y: 0.05, z: 0.0,  scale: 1.05 }, center: { y: 0.0,   z: 0.03, scale: 1.1  }, accurate: { y: 0.04, z: 0.05, scale: 1.05 } },
  bottom:    { front: { y: 0.0,  z: 0.0,  scale: 1.0  }, center: { y: -0.05, z: 0.02, scale: 1.05 }, accurate: { y: 0.0,  z: 0.04, scale: 1.05 } },
  dress:     { front: { y: 0.0,  z: 0.0,  scale: 1.0  }, center: { y: 0.0,   z: 0.02, scale: 1.05 }, accurate: { y: 0.05, z: 0.04, scale: 1.05 } },
  shoes:     { front: { y: 0.0,  z: 0.0,  scale: 1.0  }, center: { y: 0.0,   z: 0.0,  scale: 1.05 }, accurate: { y: 0.0,  z: 0.0,  scale: 1.0  } },
  hat:       { front: { y: 0.5,  z: 0.0,  scale: 1.0  }, center: { y: 0.55,  z: 0.0,  scale: 1.05 }, accurate: { y: 0.6,  z: 0.0,  scale: 1.0  } },
  accessory: { front: { y: 0.0,  z: 0.0,  scale: 1.0  }, center: { y: 0.05,  z: 0.0,  scale: 1.05 }, accurate: { y: 0.1,  z: 0.0,  scale: 1.0  } },
};

const LAYER_OPTIONS: { k: GarmentKind; l: string }[] = [
  { k: "top", l: "Top" },
  { k: "jacket", l: "Jacket" },
  { k: "bottom", l: "Trouser" },
  { k: "dress", l: "Dress" },
  { k: "shoes", l: "Shoes" },
  { k: "hat", l: "Hat" },
  { k: "accessory", l: "Acc" },
];

const TryOn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { sizeTier } = useUserContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [bodyScale, setBodyScale] = useState(1);
  const [gender, setGender] = useState<string | undefined>();
  const [imageIdx, setImageIdx] = useState(0);
  const [size, setSize] = useState<string>("");
  const [wished, setWished] = useState(false);

  // Overlay alignment
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [z, setZ] = useState(0.02);
  const [scale, setScale] = useState(1.05);
  const [rot, setRot] = useState(0);
  const [mode, setMode] = useState<"wrap" | "flat">("wrap");

  // Garment layer (auto-detected from category, user can override)
  const detected: GarmentKind = product ? guessGarment(product.category) : "top";
  const [layer, setLayer] = useState<GarmentKind>("top");

  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const [{ data: p }, av, { data: prof }, glb, wish] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).maybeSingle(),
        fetchAvatar(user.id),
        supabase.from("profiles").select("height_cm,gender").eq("id", user.id).maybeSingle(),
        fetchAvatarGlbUrl(user.id),
        listWishlistIds(user.id),
      ]);
      setProduct(p as any);
      setAvatar(av);
      setGlbUrl(glb);
      setBodyScale(bodyScaleFromHeight(prof?.height_cm ? Number(prof.height_cm) : null));
      setGender(prof?.gender ?? undefined);
      if (p?.sizes?.length) setSize(p.sizes[0]);
      if (p) {
        const det = guessGarment(p.category);
        setLayer(det);
        const def = PRESETS[det].center;
        setY(def.y);
        setZ(def.z);
        setScale(def.scale);
        setWished(wish.has(p.id));
      }
    })();
  }, [id, user, authLoading, navigate]);

  const overlayUrl = product?.images[imageIdx];
  const overlay: OverlayCfg | null = useMemo(() => {
    if (!overlayUrl) return null;
    return {
      url: overlayUrl,
      x,
      y,
      z,
      scale,
      rotation: rot,
      mode,
      garment: layer,
    };
  }, [overlayUrl, x, y, z, scale, rot, mode, layer]);

  const applyPreset = (key: "front" | "center" | "accurate") => {
    const p = PRESETS[layer][key];
    setX(0);
    setRot(0);
    setY(p.y);
    setZ(p.z);
    setScale(p.scale);
  };

  const switchLayer = (k: GarmentKind) => {
    setLayer(k);
    const def = PRESETS[k].center;
    setX(0);
    setRot(0);
    setY(def.y);
    setZ(def.z);
    setScale(def.scale);
  };

  // ── Fit diagnostics ──
  const score = product ? fitScore(size, sizeTier) : 0;
  const verdict = fitVerdict(score);
  const better = product ? suggestBetterSize(product.sizes, sizeTier) : null;
  const showSuggestion = better && better !== size && score < 85 && sizeTier;

  if (!product || !avatar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="font-mono-ed text-xs tracking-[0.3em] animate-shimmer">
          PREPARING TRY-ON…
        </span>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!user || !size) return;
    try {
      await addToCart(user.id, product.id, size, 1);
      toast.success("Added to cart");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBuy = async () => {
    await handleAddToCart();
    navigate("/checkout");
  };

  const toggleWish = async () => {
    if (!user) return;
    const next = !wished;
    setWished(next);
    try {
      if (next) await addToWishlist(user.id, product.id);
      else await removeFromWishlist(user.id, product.id);
    } catch {
      setWished(!next);
      toast.error("Could not update wishlist");
    }
  };

  // Imperative camera helpers driving OrbitControls
  const rotateBy = (deg: number) => {
    const c = controlsRef.current;
    if (!c) return;
    // Rotate around Y by spinning the azimuthal angle
    const az = c.getAzimuthalAngle();
    c.setAzimuthalAngle(az + (deg * Math.PI) / 180);
    c.update();
  };
  const zoomBy = (factor: number) => {
    const c = controlsRef.current;
    if (!c) return;
    if (factor < 1) c.dollyIn?.(1 / factor) ?? null;
    else c.dollyOut?.(factor);
    c.update();
  };
  const resetView = () => {
    const c = controlsRef.current;
    if (!c) return;
    c.reset();
  };

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b border-foreground/10 px-3 sm:px-6 py-3 flex items-center justify-between bg-background/95 backdrop-blur z-10 gap-3">
        <div className="flex items-center gap-2">
          <MobileNavTrigger />
          <button
            onClick={() => navigate(-1)}
            className="hidden sm:inline font-mono-ed text-xs tracking-[0.3em] hover:text-gold transition-colors"
          >
            ← BACK
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Logo to="/showroom" />
          <span className="hidden md:inline font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">
            · TRY-ON
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/cart")}
            className="hidden sm:inline font-mono-ed text-[10px] tracking-[0.3em] hover:text-gold"
          >
            CART →
          </button>
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
          <TryOnScene
            avatar={avatar}
            overlay={overlay}
            bodyScale={bodyScale}
            gender={gender}
            glbUrl={glbUrl}
            controlsRef={controlsRef}
          />

          {/* Layer pills (top) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 max-w-[92%] overflow-x-auto no-scrollbar">
            <div className="flex gap-2 bg-background/85 backdrop-blur border border-gold/30 px-2 py-1.5">
              {LAYER_OPTIONS.map((opt) => (
                <button
                  key={opt.k}
                  onClick={() => switchLayer(opt.k)}
                  className={`font-mono-ed text-[10px] tracking-[0.25em] px-2.5 h-7 transition-colors whitespace-nowrap ${
                    layer === opt.k
                      ? "bg-gradient-gold text-gold-foreground"
                      : "text-muted-foreground hover:text-gold"
                  }`}
                >
                  {opt.l.toUpperCase()}
                  {opt.k === detected && (
                    <span className="ml-1 text-[8px] opacity-70">●</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Floating circular controls (bottom-right) */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
            <CircleBtn label="Zoom in" onClick={() => zoomBy(0.85)}>
              <ZoomIn size={16} />
            </CircleBtn>
            <CircleBtn label="Zoom out" onClick={() => zoomBy(1.18)}>
              <ZoomOut size={16} />
            </CircleBtn>
            <CircleBtn label="Rotate left" onClick={() => rotateBy(-25)}>
              <RotateCcw size={16} />
            </CircleBtn>
            <CircleBtn label="Rotate right" onClick={() => rotateBy(25)}>
              <RotateCw size={16} />
            </CircleBtn>
            <CircleBtn label="Reset view" onClick={resetView}>
              <Maximize2 size={14} />
            </CircleBtn>
          </div>

          {/* Hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono-ed text-[9px] sm:text-[10px] tracking-[0.3em] bg-background/85 backdrop-blur px-3 py-1.5 border border-gold/30 text-muted-foreground">
            <span className="hidden md:inline">DRAG · SCROLL · OR USE BUTTONS</span>
            <span className="md:hidden">SWIPE · PINCH · OR TAP BUTTONS</span>
          </div>
        </motion.div>

        <aside className="border-t lg:border-t-0 lg:border-l border-foreground/10 overflow-y-auto p-5 sm:p-6 space-y-5 max-h-[55vh] lg:max-h-none">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono-ed text-[10px] tracking-[0.3em] text-gold">
                {product.category.toUpperCase()}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl leading-tight mt-1 truncate">
                {product.name}
              </h1>
              <p className="text-lg mt-2">
                {formatPrice(product.price_cents, product.currency)}
              </p>
            </div>
            <button
              onClick={toggleWish}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              className={`grid place-items-center w-10 h-10 border transition-all ${
                wished
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-foreground/20 hover:border-gold"
              }`}
            >
              <Heart size={16} fill={wished ? "currentColor" : "none"} />
            </button>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}

          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImageIdx(i)}
                  className={`w-14 h-14 border ${
                    i === imageIdx
                      ? "border-gold"
                      : "border-foreground/20 hover:border-gold/60"
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div>
            <Label className="text-[10px] uppercase tracking-widest mb-2 block">
              Size
            </Label>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-12 h-10 px-3 border text-[11px] tracking-widest transition-colors ${
                    size === s
                      ? "bg-foreground text-background border-foreground"
                      : "border-foreground/20 hover:border-gold"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Fit diagnostics ── */}
          {sizeTier && (
            <FitDiagnostics
              score={score}
              verdict={verdict}
              chosen={size}
              tier={sizeTier}
              suggestion={showSuggestion ? better : null}
              onAccept={(s) => setSize(s)}
            />
          )}

          <div>
            <Label className="text-[10px] uppercase tracking-widest mb-2 block">
              Render
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(["wrap", "flat"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`h-10 border text-[10px] tracking-[0.2em] uppercase transition-colors ${
                    mode === m
                      ? "bg-foreground text-background border-foreground"
                      : "border-foreground/20 hover:border-gold"
                  }`}
                >
                  {m === "wrap" ? "3D Wrap" : "Flat overlay"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-widest mb-2 block">
              Quick fit · {layer}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(["front", "center", "accurate"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className="h-10 border border-foreground/20 hover:border-gold text-[10px] tracking-[0.2em] uppercase transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <details className="border-t border-foreground/10 pt-4">
            <summary className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground cursor-pointer">
              FINE · ALIGNMENT
            </summary>
            <div className="space-y-3 mt-3">
              {[
                { label: "Horizontal", v: x, set: setX, min: -1, max: 1, step: 0.01 },
                { label: "Vertical", v: y, set: setY, min: -0.5, max: 1, step: 0.01 },
                { label: "Inflation", v: z, set: setZ, min: 0, max: 0.3, step: 0.005 },
                { label: "Scale", v: scale, set: setScale, min: 0.4, max: 2, step: 0.01 },
                { label: "Rotation", v: rot, set: setRot, min: -1, max: 1, step: 0.01 },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between mb-1">
                    <Label className="text-[10px] uppercase tracking-widest">
                      {s.label}
                    </Label>
                    <span className="font-mono-ed text-[10px] text-muted-foreground">
                      {s.v.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[s.v]}
                    onValueChange={([v]) => s.set(v)}
                    min={s.min}
                    max={s.max}
                    step={s.step}
                  />
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

const CircleBtn = ({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="w-11 h-11 grid place-items-center rounded-full bg-background/85 backdrop-blur border border-gold/40 text-foreground hover:bg-gradient-gold hover:text-gold-foreground hover:border-gold active:scale-95 transition-all shadow-soft"
  >
    {children}
  </button>
);

const FitDiagnostics = ({
  score,
  verdict,
  chosen,
  tier,
  suggestion,
  onAccept,
}: {
  score: number;
  verdict: { label: string; tone: "good" | "ok" | "bad" };
  chosen: string;
  tier: SizeTier;
  suggestion: string | null;
  onAccept: (s: string) => void;
}) => {
  const toneClass =
    verdict.tone === "good"
      ? "text-gold border-gold/40 bg-gold/5"
      : verdict.tone === "ok"
      ? "text-foreground border-foreground/30 bg-secondary/40"
      : "text-destructive border-destructive/40 bg-destructive/5";

  return (
    <div className={`border ${toneClass} p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <p className="font-mono-ed text-[10px] tracking-[0.3em]">
          FIT DIAGNOSTICS
        </p>
        <span className="font-display text-2xl leading-none">{score}</span>
      </div>

      <div className="h-1.5 bg-foreground/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-gradient-gold"
        />
      </div>

      <div className="flex items-baseline justify-between text-[11px]">
        <span className="font-mono-ed tracking-[0.25em]">{verdict.label.toUpperCase()}</span>
        <span className="text-muted-foreground">
          Your tier · <span className="text-gold">{tier}</span>
          {chosen ? <> · Selected · {chosen}</> : null}
        </span>
      </div>

      <AnimatePresence>
        {suggestion && (
          <motion.button
            key={suggestion}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => onAccept(suggestion)}
            className="w-full text-left text-[11px] border border-gold/40 px-3 py-2 hover:bg-gold/10 transition-colors"
          >
            <span className="font-mono-ed tracking-[0.2em] text-gold">
              SUGGESTED →
            </span>{" "}
            Try size{" "}
            <span className="font-display text-base align-middle">
              {suggestion}
            </span>{" "}
            for a closer fit.
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TryOn;
