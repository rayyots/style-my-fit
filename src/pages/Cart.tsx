import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { CartRow, formatPrice, listCart, removeCart, updateCartQty } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Minus, Plus, Trash2 } from "lucide-react";

const Cart = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<CartRow[]>([]);
  const [busy, setBusy] = useState(true);

  const reload = async () => {
    if (!user) return;
    setItems(await listCart(user.id));
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/auth"); return; }
    (async () => { await reload(); setBusy(false); })();
  }, [user, loading]);

  const total = items.reduce((s, i) => s + i.product.price_cents * i.quantity, 0);
  const currency = items[0]?.product.currency ?? "USD";

  const setQtyLocal = (id: string, q: number) => {
    setItems((prev) =>
      q <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, quantity: q } : i))
    );
  };
  const removeLocal = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 px-6 lg:px-12 py-4 flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-20">
        <button onClick={() => nav(-1)} className="font-mono-ed text-xs tracking-[0.3em] hover:text-gold transition-colors">← BACK</button>
        <Logo to="/showroom" />
        <div className="flex items-center gap-3">
          <Link to="/showroom" className="font-mono-ed text-[10px] tracking-[0.3em] hover:text-gold hidden md:inline">SHOWROOM</Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 lg:p-12 space-y-12">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl"
        >
          Your selection.
        </motion.h1>

        {busy ? (
          <p className="text-center py-20 font-mono-ed text-xs tracking-[0.3em] animate-shimmer">LOADING…</p>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <h2 className="font-display text-3xl mb-2">Nothing here yet.</h2>
            <p className="text-muted-foreground mb-6">Find something to add to your fitting.</p>
            <Button onClick={() => nav("/showroom")} className="rounded-none font-mono-ed text-xs tracking-[0.3em]">
              BROWSE SHOWROOM
            </Button>
          </motion.div>
        ) : (
          <section>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((i) => (
                  <motion.div
                    key={i.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Row item={i} setQtyLocal={setQtyLocal} removeLocal={removeLocal} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-t border-gold/30 pt-6">
              <div>
                <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">SUBTOTAL · {items.length} ITEMS</p>
                <p className="font-display text-4xl mt-1">{formatPrice(total, currency)}</p>
              </div>
              <Button
                onClick={() => nav("/checkout")}
                className="rounded-none h-14 px-12 font-mono-ed text-xs tracking-[0.3em] bg-gradient-gold text-gold-foreground hover:opacity-90 border-0"
              >
                PROCEED TO CHECKOUT →
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

const Row = ({
  item,
  setQtyLocal,
  removeLocal,
}: {
  item: CartRow;
  setQtyLocal: (id: string, q: number) => void;
  removeLocal: (id: string) => void;
}) => (
  <div className="flex gap-4 border border-foreground/10 p-3 hover:border-gold/40 transition-colors">
    <div className="w-24 h-32 bg-secondary shrink-0 overflow-hidden">
      {item.product.images[0] && (
        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
      )}
    </div>
    <div className="flex-1 flex flex-col">
      <h3 className="font-display text-lg">{item.product.name}</h3>
      <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mt-1">SIZE {item.size}</p>
      <p className="text-sm mt-1">{formatPrice(item.product.price_cents, item.product.currency)}</p>
      <div className="mt-auto flex items-center gap-3 flex-wrap">
        <div className="flex border border-foreground/20">
          <button
            aria-label="Decrease quantity"
            onClick={() => {
              const next = item.quantity - 1;
              setQtyLocal(item.id, next);
              updateCartQty(item.id, next).catch(() => setQtyLocal(item.id, item.quantity));
            }}
            className="w-9 h-9 hover:bg-gold hover:text-gold-foreground transition-colors grid place-items-center"
          >
            <Minus size={12} />
          </button>
          <span className="w-9 h-9 flex items-center justify-center font-mono-ed text-xs">{item.quantity}</span>
          <button
            aria-label="Increase quantity"
            onClick={() => {
              const next = item.quantity + 1;
              setQtyLocal(item.id, next);
              updateCartQty(item.id, next).catch(() => setQtyLocal(item.id, item.quantity));
            }}
            className="w-9 h-9 hover:bg-gold hover:text-gold-foreground transition-colors grid place-items-center"
          >
            <Plus size={12} />
          </button>
        </div>
        <button
          onClick={() => {
            removeLocal(item.id);
            removeCart(item.id).catch(() => {});
          }}
          className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground hover:text-destructive ml-auto inline-flex items-center gap-1"
        >
          <Trash2 size={12} /> REMOVE
        </button>
      </div>
    </div>
  </div>
);

export default Cart;
