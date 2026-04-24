import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listWishlist, removeFromWishlist, WishRow } from "@/lib/wishlist";
import { formatPrice } from "@/lib/cart";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNavTrigger } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";

const Wishlist = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<WishRow[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/auth"); return; }
    (async () => { setItems(await listWishlist(user.id)); setBusy(false); })();
  }, [user, loading]);

  const remove = async (productId: string) => {
    if (!user) return;
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
    try { await removeFromWishlist(user.id, productId); } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 px-4 sm:px-6 lg:px-12 py-3 flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <MobileNavTrigger />
          <Logo to="/showroom" />
        </div>
        <span className="font-mono-ed text-[10px] tracking-[0.3em] text-gold">WISHLIST</span>
        <ThemeToggle />
      </header>
      <main className="max-w-5xl mx-auto p-6 lg:p-12 pb-24">
        <motion.h1 initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="font-display text-5xl mb-10">Saved pieces.</motion.h1>
        {busy ? (
          <p className="text-center py-20 font-mono-ed text-xs tracking-[0.3em] animate-shimmer">LOADING…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-32">
            <Heart size={32} className="mx-auto mb-4 text-gold" />
            <h2 className="font-display text-3xl mb-2">No favourites yet.</h2>
            <p className="text-muted-foreground mb-6">Tap the heart on any item to save it for later.</p>
            <Button onClick={() => nav("/showroom")} className="rounded-none font-mono-ed text-xs tracking-[0.3em]">BROWSE SHOWROOM</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            <AnimatePresence>
              {items.map((i) => (
                <motion.div key={i.id} layout initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.95}}>
                  <Link to={`/tryon/${i.product.id}`} className="group block">
                    <div className="aspect-[3/4] bg-secondary mb-3 overflow-hidden relative">
                      {i.product.images[0] && (
                        <img src={i.product.images[0]} alt={i.product.name} className="w-full h-full object-cover transition-transform duration-700 ease-silk group-hover:scale-105" />
                      )}
                    </div>
                    <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground uppercase">{i.product.category}</p>
                    <h3 className="font-display text-lg leading-tight">{i.product.name}</h3>
                    <p className="text-sm mt-1 text-gold">{formatPrice(i.product.price_cents, i.product.currency)}</p>
                  </Link>
                  <button onClick={() => remove(i.product_id)} className="mt-2 font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground hover:text-destructive inline-flex items-center gap-1">
                    <Trash2 size={11} /> REMOVE
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;