import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserContext } from "@/hooks/useUserContext";
import { Button } from "@/components/ui/button";
import { ALL_SIZES, SizeTier } from "@/lib/sizing";
import { formatPrice } from "@/lib/cart";

interface Brand { id: string; slug: string; name: string; tagline: string | null; description: string | null; cover_image: string | null; }
interface Product {
  id: string; name: string; category: string; gender: "male"|"female"|"unisex";
  sizes: string[]; images: string[]; price_cents: number; currency: string;
  purchase_type: "internal"|"external"; external_url: string | null;
}

const Brand = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, recommendedSizes, sizeTier, isAdmin } = useUserContext();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [genderFilter, setGenderFilter] = useState<"all"|"male"|"female"|"unisex">(
    (profile?.gender === "male" || profile?.gender === "female") ? (profile.gender as any) : "all"
  );
  const [sizeFilter, setSizeFilter] = useState<SizeTier[]>([]);
  const [smartSize, setSmartSize] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      // Brand can be looked up by slug or uuid
      const isUuid = /^[0-9a-f-]{36}$/i.test(id);
      const q = supabase.from("brands").select("*").limit(1);
      const { data: bd } = await (isUuid ? q.eq("id", id) : q.eq("slug", id));
      const b = bd?.[0];
      if (!b) { setBrand(null); setLoading(false); return; }
      setBrand(b as any);
      const { data: pd } = await supabase.from("products").select("*").eq("brand_id", b.id).order("created_at", { ascending: false });
      setProducts((pd ?? []) as any);
      setLoading(false);
    })();
  }, [id]);

  // Auto-apply recommended sizes once when smartSize is on and we have tiers
  useEffect(() => {
    if (smartSize && recommendedSizes.length && sizeFilter.length === 0) {
      setSizeFilter(recommendedSizes);
    }
  }, [smartSize, recommendedSizes]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (genderFilter !== "all" && p.gender !== genderFilter && p.gender !== "unisex") return false;
      if (sizeFilter.length && !p.sizes.some((s) => sizeFilter.includes(s as SizeTier))) return false;
      return true;
    });
  }, [products, genderFilter, sizeFilter]);

  const toggleSize = (s: SizeTier) => {
    setSmartSize(false);
    setSizeFilter((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><span className="font-mono-ed text-xs tracking-[0.3em]">LOADING…</span></div>;
  }
  if (!brand) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center bg-background">
        <h1 className="font-display text-4xl">Brand not found.</h1>
        <Button onClick={() => navigate("/showroom")} className="rounded-none font-mono-ed text-xs tracking-[0.3em]">BACK TO SHOWROOM</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20">
        <button onClick={() => navigate("/showroom")} className="font-mono-ed text-xs tracking-[0.3em] hover:text-accent-foreground hover:bg-accent px-2 py-1">← SHOWROOM</button>
        <span className="font-display text-xl tracking-[0.4em]">ATELIER</span>
        <div className="flex items-center gap-3">
          {isAdmin && <Link to="/admin" className="font-mono-ed text-[10px] tracking-[0.3em] hover:underline">ADMIN</Link>}
          <Link to="/cart" className="font-mono-ed text-[10px] tracking-[0.3em] hover:underline">CART</Link>
        </div>
      </header>

      <section className="px-6 lg:px-12 py-12 border-b border-foreground/10">
        <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mb-3">COLLECTION</p>
        <h1 className="font-display text-6xl lg:text-7xl mb-3">{brand.name}</h1>
        {brand.tagline && <p className="text-lg text-muted-foreground max-w-xl">{brand.tagline}</p>}
      </section>

      <section className="px-6 lg:px-12 py-6 border-b border-foreground/10 flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2">
          <span className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">GENDER</span>
          {(["all","female","male","unisex"] as const).map((g) => (
            <button key={g} onClick={() => setGenderFilter(g)}
              className={`px-3 h-8 border text-[10px] uppercase tracking-widest transition-all ${genderFilter===g?"bg-foreground text-background border-foreground":"border-foreground/20 hover:border-foreground"}`}>
              {g}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">SIZE</span>
          {ALL_SIZES.map((s) => (
            <button key={s} onClick={() => toggleSize(s)}
              className={`w-10 h-8 border text-[10px] tracking-widest transition-all ${sizeFilter.includes(s)?"bg-foreground text-background border-foreground":"border-foreground/20 hover:border-foreground"}`}>
              {s}
            </button>
          ))}
          {sizeTier && (
            <label className="flex items-center gap-2 ml-2 cursor-pointer">
              <input type="checkbox" checked={smartSize} onChange={(e) => {
                setSmartSize(e.target.checked);
                if (e.target.checked) setSizeFilter(recommendedSizes);
                else setSizeFilter([]);
              }} />
              <span className="font-mono-ed text-[10px] tracking-[0.3em]">SMART FIT · {sizeTier}</span>
            </label>
          )}
        </div>
      </section>

      <section className="px-6 lg:px-12 py-10">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-20 text-center">No items match these filters.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filtered.map((p) => (
              <Link key={p.id} to={`/tryon/${p.id}`} className="group block">
                <div className="aspect-[3/4] bg-secondary mb-3 overflow-hidden">
                  {p.images[0] ? (
                    <img src={p.images[0]} alt={p.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 ease-silk group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono-ed text-[10px] tracking-[0.3em]">NO IMAGE</div>
                  )}
                </div>
                <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground uppercase">{p.category}</p>
                <h3 className="font-display text-lg leading-tight">{p.name}</h3>
                <p className="text-sm mt-1">{formatPrice(p.price_cents, p.currency)}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                  {p.purchase_type === "external" ? "BUY EXTERNAL ↗" : "IN-APP CHECKOUT"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Brand;
