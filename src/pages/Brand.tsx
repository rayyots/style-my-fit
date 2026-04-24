import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useUserContext } from "@/hooks/useUserContext";
import { Button } from "@/components/ui/button";
import { ALL_SIZES, SizeTier } from "@/lib/sizing";
import { formatPrice } from "@/lib/cart";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Brand { id: string; slug: string; name: string; tagline: string | null; description: string | null; cover_image: string | null; }
interface Product {
  id: string; name: string; category: string; gender: "male"|"female"|"unisex";
  sizes: string[]; images: string[]; price_cents: number; currency: string;
}

const BrandPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, recommendedSizes, sizeTier, isAdmin } = useUserContext();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [genderFilter, setGenderFilter] = useState<"all"|"male"|"female"|"unisex">(
    (profile?.gender === "male" || profile?.gender === "female") ? (profile.gender as any) : "all"
  );
  const [sizeFilter, setSizeFilter] = useState<SizeTier[]>([]);
  const [smartSize, setSmartSize] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="font-mono-ed text-xs tracking-[0.3em] animate-shimmer">CURATING…</span>
      </div>
    );
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
      <header className="border-b border-foreground/10 px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20">
        <button onClick={() => navigate("/showroom")} className="font-mono-ed text-[10px] sm:text-xs tracking-[0.3em] hover:text-gold transition-colors">← SHOWROOM</button>
        <Logo to="/showroom" />
        <div className="flex items-center gap-3">
          {isAdmin && <Link to="/admin" className="hidden sm:inline font-mono-ed text-[10px] tracking-[0.3em] hover:text-gold">ADMIN</Link>}
          <Link to="/cart" className="font-mono-ed text-[10px] tracking-[0.3em] hover:text-gold">CART</Link>
          <ThemeToggle />
        </div>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-4 sm:px-6 lg:px-12 py-12 lg:py-16 border-b border-gold/20 bg-gradient-spotlight"
      >
        <p className="font-mono-ed text-[10px] tracking-[0.3em] text-gold mb-3">— COLLECTION</p>
        <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl mb-3 leading-[0.95]">{brand.name}</h1>
        {brand.tagline && <p className="text-base sm:text-lg text-muted-foreground max-w-2xl italic">{brand.tagline}</p>}
      </motion.section>

      <section className="px-4 sm:px-6 lg:px-12 py-5 border-b border-foreground/10 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">GENDER</span>
          {(["all","female","male","unisex"] as const).map((g) => (
            <button key={g} onClick={() => setGenderFilter(g)}
              className={`px-3 h-8 border text-[10px] uppercase tracking-widest transition-all ${genderFilter===g?"bg-foreground text-background border-foreground":"border-foreground/20 hover:border-gold"}`}>
              {g}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">SIZE</span>
          {ALL_SIZES.map((s) => (
            <button key={s} onClick={() => toggleSize(s)}
              className={`w-9 h-8 border text-[10px] tracking-widest transition-all ${sizeFilter.includes(s)?"bg-foreground text-background border-foreground":"border-foreground/20 hover:border-gold"}`}>
              {s}
            </button>
          ))}
          {sizeTier && (
            <label className="flex items-center gap-2 ml-2 cursor-pointer">
              <input type="checkbox" checked={smartSize} onChange={(e) => {
                setSmartSize(e.target.checked);
                if (e.target.checked) setSizeFilter(recommendedSizes);
                else setSizeFilter([]);
              }} className="accent-gold" />
              <span className="font-mono-ed text-[10px] tracking-[0.3em]">SMART FIT · {sizeTier}</span>
            </label>
          )}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-12 py-10">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-20 text-center">No items match these filters.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
              >
                <Link to={`/tryon/${p.id}`} className="group block">
                  <div className="aspect-[3/4] bg-secondary mb-3 overflow-hidden relative">
                    {p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-silk group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono-ed text-[10px] tracking-[0.3em]">NO IMAGE</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-gold text-gold-foreground py-2 text-center font-mono-ed text-[10px] tracking-[0.3em]">
                      TRY ON →
                    </div>
                  </div>
                  <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground uppercase">{p.category}</p>
                  <h3 className="font-display text-lg leading-tight">{p.name}</h3>
                  <p className="text-sm mt-1 text-gold">{formatPrice(p.price_cents, p.currency)}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default BrandPage;
