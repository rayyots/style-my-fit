import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchAvatar, AvatarConfig } from "@/lib/avatar";
import { TryOnScene } from "@/components/TryOnScene";
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

const TryOn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [imageIdx, setImageIdx] = useState(0);
  const [size, setSize] = useState<string>("");

  // Overlay alignment
  const [x, setX] = useState(0);
  const [y, setY] = useState(0.4);
  const [z, setZ] = useState(0.35);
  const [scale, setScale] = useState(1.4);
  const [rot, setRot] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const [{ data: p }, av] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).maybeSingle(),
        fetchAvatar(user.id),
      ]);
      setProduct(p as any);
      setAvatar(av);
      if (p?.sizes?.length) setSize(p.sizes[0]);
    })();
  }, [id, user, authLoading, navigate]);

  if (!product || !avatar) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><span className="font-mono-ed text-xs tracking-[0.3em]">PREPARING TRY-ON…</span></div>;
  }

  const overlayUrl = product.images[imageIdx];

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
          <TryOnScene avatar={avatar} overlay={overlayUrl ? { url: overlayUrl, x, y, z, scale, rotation: rot } : null} />
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

          <div className="border-t border-foreground/10 pt-4 space-y-4">
            <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">OVERLAY · ALIGNMENT</p>
            {[
              { label: "Horizontal", v: x, set: setX, min: -1, max: 1, step: 0.01 },
              { label: "Vertical",   v: y, set: setY, min: -1, max: 2, step: 0.01 },
              { label: "Depth",      v: z, set: setZ, min: -0.3, max: 0.6, step: 0.01 },
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
            <button onClick={() => { setX(0); setY(0.4); setZ(0.35); setScale(1.4); setRot(0); }} className="font-mono-ed text-[10px] tracking-[0.3em] underline text-muted-foreground">RESET ALIGNMENT</button>
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
