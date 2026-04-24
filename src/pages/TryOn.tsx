import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchAvatar, AvatarConfig, bodyScaleFromHeight } from "@/lib/avatar";
import { TryOnScene, OverlayCfg } from "@/components/TryOnScene";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { addToCart, formatPrice } from "@/lib/cart";
import { toast } from "sonner";

interface Product {
  id: string; name: string; category: string; description: string | null;
  gender: string; sizes: string[]; images: string[]; price_cents: number; currency: string;
  purchase_type: "internal" | "external"; external_url: string | null;
}

type GarmentKind = "top" | "bottom" | "dress";

const guessGarment = (category: string): GarmentKind => {
  const c = category.toLowerCase();
  if (/(pant|trouser|jean|short|skirt|bottom)/.test(c)) return "bottom";
  if (/(dress|gown|robe|jumpsuit)/.test(c)) return "dress";
  return "top";
};

// Snap presets per garment kind: { y, z, scale }
const PRESETS: Record<GarmentKind, Record<string, { y: number; z: number; scale: number }>> = {
  top: {
    front:           { y: 1.7,  z: 0.0,  scale: 0.95 },
    center:          { y: 1.65, z: 0.02, scale: 1.0  },
    "near-accurate": { y: 1.7,  z: 0.04, scale: 1.05 },
  },
  bottom: {
    front:           { y: 0.85, z: 0.0,  scale: 1.1 },
    center:          { y: 0.8,  z: 0.02, scale: 1.15 },
    "near-accurate": { y: 0.85, z: 0.04, scale: 1.2  },
  },
  dress: {
    front:           { y: 1.35, z: 0.0,  scale: 1.5 },
    center:          { y: 1.3,  z: 0.02, scale: 1.55 },
    "near-accurate": { y: 1.35, z: 0.04, scale: 1.6  },
  },
};

const TryOn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [bodyScale, setBodyScale] = useState(1);
  const [imageIdx, setImageIdx] = useState(0);
  const [size, setSize] = useState<string>("");

  // Overlay alignment
  const [x, setX] = useState(0);
  const [y, setY] = useState(1.7);
  const [z, setZ] = useState(0.02);
  const [scale, setScale] = useState(1.0);
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
        supabase.from("profiles").select("height_cm").eq("id", user.id).maybeSingle(),
      ]);
      setProduct(p as any);
      setAvatar(av);
      setBodyScale(bodyScaleFromHeight(prof?.height_cm ? Number(prof.height_cm) : null));
      if (p?.sizes?.length) setSize(p.sizes[0]);

      // Apply default preset for the detected garment kind
      if (p) {
        const kind = guessGarment(p.category);
        const def = PRESETS[kind].center;
        setY(def.y); setZ(def.z); setScale(def.scale);
      }
    })();
  }, [id, user, authLoading, navigate]);

  const overlayUrl = product?.images[imageIdx];

  const overlay: OverlayCfg | null = useMemo(() => {
    if (!overlayUrl) return null;
    return { url: overlayUrl, x, y, z, scale, rotation: rot, mode, garment };
  }, [overlayUrl, x, y, z, scale, rot, mode, garment]);

  const applyPreset = (key: "front" | "center" | "near-accurate") => {
    const p = PRESETS[garment][key];
    setX(0); setRot(0);
    setY(p.y); setZ(p.z); setScale(p.scale);
  };

  if (!product || !avatar) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><span className="font-mono-ed text-xs tracking-[0.3em]">PREPARING TRY-ON…</span></div>;
  }

  const handleAddToCart = async () => {
    if (!user || !size) return;
    try {
      await addToCart(user.id, product.id, size, 1);
      toast.success("Added to cart");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleBuy = async () => {
    if (product.purchase_type === "external" && product.external_url) {
      window.open(product.external_url, "_blank", "noopener");
      return;
    }
    await handleAddToCart();
    navigate("/checkout");
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b border-foreground/10 px-6 py-3 flex items-center justify-between bg-background/95 backdrop-blur z-10">
        <button onClick={() => navigate(-1)} className="font-mono-ed text-xs tracking-[0.3em] hover:bg-accent px-2 py-1">← BACK</button>
        <span className="font-display text-xl tracking-[0.4em]">ATELIER · TRY-ON</span>
        <button onClick={() => navigate("/cart")} className="font-mono-ed text-[10px] tracking-[0.3em] hover:underline">CART →</button>
      </header>

      <div className="flex-1 grid lg:grid-cols-[1fr_360px] overflow-hidden">
        <div className="relative">
          <TryOnScene avatar={avatar} overlay={overlay} bodyScale={bodyScale} />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono-ed text-[10px] tracking-[0.3em] bg-background/80 backdrop-blur px-3 py-2 border border-foreground/10">
            DRAG TO ROTATE · SCROLL TO ZOOM
          </div>
        </div>

        <aside className="border-l border-foreground/10 overflow-y-auto p-6 space-y-6">
          <div>
            <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">{product.category.toUpperCase()}</p>
            <h1 className="font-display text-3xl leading-tight mt-1">{product.name}</h1>
            <p className="text-lg mt-2">{formatPrice(product.price_cents, product.currency)}</p>
            {product.description && <p className="text-sm text-muted-foreground mt-3">{product.description}</p>}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((src, i) => (
                <button key={i} onClick={() => setImageIdx(i)} className={`w-14 h-14 border ${i===imageIdx?"border-foreground":"border-foreground/20"}`}>
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
                  className={`min-w-12 h-10 px-3 border text-[11px] tracking-widest ${size===s?"bg-foreground text-background border-foreground":"border-foreground/20 hover:border-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Render mode toggle */}
          <div>
            <Label className="text-[10px] uppercase tracking-widest mb-2 block">Render</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["wrap","flat"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`h-10 border text-[10px] tracking-[0.2em] uppercase ${mode===m?"bg-foreground text-background border-foreground":"border-foreground/20 hover:border-foreground"}`}>
                  {m === "wrap" ? "3D Wrap" : "Flat overlay"}
                </button>
              ))}
            </div>
          </div>

          {/* Snap presets */}
          <div>
            <Label className="text-[10px] uppercase tracking-widest mb-2 block">Quick fit · {garment}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["front","center","near-accurate"] as const).map((p) => (
                <button key={p} onClick={() => applyPreset(p)}
                  className="h-10 border border-foreground/20 hover:border-foreground text-[10px] tracking-[0.2em] uppercase">
                  {p === "near-accurate" ? "Accurate" : p}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-foreground/10 pt-4 space-y-4">
            <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">FINE · ALIGNMENT</p>
            {[
              { label: "Horizontal", v: x, set: setX, min: -1, max: 1, step: 0.01 },
              { label: "Vertical",   v: y, set: setY, min: -0.5, max: 2.5, step: 0.01 },
              { label: "Inflation",  v: z, set: setZ, min: 0, max: 0.3, step: 0.005 },
              { label: "Scale",      v: scale, set: setScale, min: 0.4, max: 3, step: 0.01 },
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
            <button onClick={() => applyPreset("center")} className="font-mono-ed text-[10px] tracking-[0.3em] underline text-muted-foreground">RESET ALIGNMENT</button>
          </div>

          <div className="border-t border-foreground/10 pt-4 space-y-2">
            <Button onClick={handleBuy} disabled={!size} className="w-full rounded-none h-12 font-mono-ed text-xs tracking-[0.3em]">
              {product.purchase_type === "external" ? "BUY ON BRAND SITE ↗" : "BUY NOW"}
            </Button>
            {product.purchase_type === "internal" && (
              <Button variant="outline" onClick={handleAddToCart} disabled={!size} className="w-full rounded-none h-12 font-mono-ed text-xs tracking-[0.3em]">
                ADD TO CART
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TryOn;
