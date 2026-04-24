import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CartRow, formatPrice, listCart, removeCart, updateCartQty } from "@/lib/cart";
import { Button } from "@/components/ui/button";

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

  const internal = items.filter((i) => i.product.purchase_type === "internal");
  const external = items.filter((i) => i.product.purchase_type === "external");
  const total = internal.reduce((s, i) => s + i.product.price_cents * i.quantity, 0);
  const currency = internal[0]?.product.currency ?? "USD";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 px-6 lg:px-12 py-4 flex items-center justify-between">
        <button onClick={() => nav(-1)} className="font-mono-ed text-xs tracking-[0.3em] hover:bg-accent px-2 py-1">← BACK</button>
        <span className="font-display text-xl tracking-[0.4em]">CART</span>
        <Link to="/showroom" className="font-mono-ed text-[10px] tracking-[0.3em] hover:underline">SHOWROOM</Link>
      </header>

      <main className="max-w-4xl mx-auto p-6 lg:p-12 space-y-12">
        {busy ? <p className="text-center py-20 font-mono-ed text-xs tracking-[0.3em]">LOADING…</p> :
        items.length === 0 ? (
          <div className="text-center py-32">
            <h1 className="font-display text-4xl mb-4">Your cart is empty.</h1>
            <Button onClick={() => nav("/showroom")} className="rounded-none font-mono-ed text-xs tracking-[0.3em]">BROWSE SHOWROOM</Button>
          </div>
        ) : (
          <>
            {internal.length > 0 && (
              <section>
                <h2 className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mb-6">IN-APP CHECKOUT</h2>
                <div className="space-y-4">
                  {internal.map((i) => (
                    <Row key={i.id} item={i} reload={reload} />
                  ))}
                </div>
                <div className="mt-8 flex justify-between items-end border-t border-foreground/10 pt-6">
                  <div>
                    <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">TOTAL</p>
                    <p className="font-display text-3xl">{formatPrice(total, currency)}</p>
                  </div>
                  <Button onClick={() => nav("/checkout")} className="rounded-none h-12 px-10 font-mono-ed text-xs tracking-[0.3em]">CHECKOUT →</Button>
                </div>
              </section>
            )}

            {external.length > 0 && (
              <section>
                <h2 className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mb-6">EXTERNAL · BRAND REDIRECT</h2>
                <div className="space-y-4">
                  {external.map((i) => (
                    <Row key={i.id} item={i} reload={reload} external />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const Row = ({ item, reload, external }: { item: CartRow; reload: () => Promise<void>; external?: boolean }) => (
  <div className="flex gap-4 border border-foreground/10 p-3">
    <div className="w-24 h-32 bg-secondary shrink-0">
      {item.product.images[0] && <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />}
    </div>
    <div className="flex-1 flex flex-col">
      <h3 className="font-display text-lg">{item.product.name}</h3>
      <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mt-1">SIZE {item.size}</p>
      <p className="text-sm mt-1">{formatPrice(item.product.price_cents, item.product.currency)}</p>
      <div className="mt-auto flex items-center gap-3">
        {!external && (
          <div className="flex border border-foreground/20">
            <button onClick={async () => { await updateCartQty(item.id, item.quantity - 1); reload(); }} className="w-8 h-8 hover:bg-accent">−</button>
            <span className="w-8 h-8 flex items-center justify-center font-mono-ed text-xs">{item.quantity}</span>
            <button onClick={async () => { await updateCartQty(item.id, item.quantity + 1); reload(); }} className="w-8 h-8 hover:bg-accent">+</button>
          </div>
        )}
        {external && item.product.external_url && (
          <a href={item.product.external_url} target="_blank" rel="noopener" className="font-mono-ed text-[10px] tracking-[0.3em] underline">OPEN BRAND SITE ↗</a>
        )}
        <button onClick={async () => { await removeCart(item.id); reload(); }} className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground hover:text-destructive ml-auto">REMOVE</button>
      </div>
    </div>
  </div>
);

export default Cart;
