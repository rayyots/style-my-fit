import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CartRow, formatPrice, listCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Checkout = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<CartRow[]>([]);
  const [method, setMethod] = useState<"cod" | "mock_card">("cod");
  const [form, setForm] = useState({ name: "", address: "", city: "", country: "", phone: "" });
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/auth"); return; }
    (async () => {
      const all = await listCart(user.id);
      setItems(all);
    })();
  }, [user, loading]);

  const total = useMemo(() => items.reduce((s, i) => s + i.product.price_cents * i.quantity, 0), [items]);
  const currency = items[0]?.product.currency ?? "USD";

  const placeOrder = async () => {
    if (!user) return;
    if (!form.name || !form.address || !form.city || !form.country) { toast.error("Fill in shipping details"); return; }
    if (method === "mock_card" && (!card.number || !card.expiry || !card.cvv)) { toast.error("Fill in card details"); return; }
    setBusy(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user.id,
        status: method === "mock_card" ? "paid" : "pending",
        payment_method: method,
        total_cents: total,
        currency,
        shipping_name: form.name,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_country: form.country,
        shipping_phone: form.phone || null,
      }).select().single();
      if (error) throw error;

      const rows = items.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        product_name: i.product.name,
        size: i.size,
        quantity: i.quantity,
        price_cents: i.product.price_cents,
      }));
      const { error: oiErr } = await supabase.from("order_items").insert(rows);
      if (oiErr) throw oiErr;

      // Clear internal cart items
      await supabase.from("cart_items").delete().in("id", items.map((i) => i.id));

      toast.success(method === "mock_card" ? "Payment successful" : "Order placed · pay on delivery");
      nav(`/orders/${order.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  };

  if (items.length === 0 && !busy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center bg-background">
        <h1 className="font-display text-4xl">Nothing to checkout.</h1>
        <Button onClick={() => nav("/showroom")} className="rounded-none font-mono-ed text-xs tracking-[0.3em]">BROWSE SHOWROOM</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 px-6 lg:px-12 py-4 flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-20">
        <button onClick={() => nav(-1)} className="font-mono-ed text-xs tracking-[0.3em] hover:text-gold transition-colors">← BACK</button>
        <span className="font-display text-2xl tracking-[0.35em]">CHECKOUT</span>
        <span className="w-16" />
      </header>

      <main className="max-w-5xl mx-auto p-6 lg:p-12 grid lg:grid-cols-[1.3fr_1fr] gap-12">
        <section className="space-y-8">
          <div>
            <h2 className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mb-4">SHIPPING</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} className="col-span-2" />
              <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} className="col-span-2" />
              <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
              <Field label="Phone (optional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} className="col-span-2" />
            </div>
          </div>

          <div>
            <h2 className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mb-4">PAYMENT</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { k: "cod", label: "Cash on delivery" },
                { k: "mock_card", label: "Card (mock)" },
              ].map((o) => (
                <button key={o.k} onClick={() => setMethod(o.k as any)}
                  className={`h-12 border text-xs uppercase tracking-widest ${method===o.k?"bg-foreground text-background border-foreground":"border-foreground/20 hover:border-foreground"}`}>
                  {o.label}
                </button>
              ))}
            </div>
            {method === "mock_card" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Card number" value={card.number} onChange={(v) => setCard({ ...card, number: v })} className="col-span-2" placeholder="4242 4242 4242 4242" />
                <Field label="Expiry (MM/YY)" value={card.expiry} onChange={(v) => setCard({ ...card, expiry: v })} placeholder="12/27" />
                <Field label="CVV" value={card.cvv} onChange={(v) => setCard({ ...card, cvv: v })} placeholder="123" />
                <p className="col-span-2 font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">DEMO — NO REAL CHARGE IS MADE.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="border border-foreground/10 p-6 self-start space-y-4">
          <h2 className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">ORDER · {items.length} ITEMS</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {items.map((i) => (
              <div key={i.id} className="flex gap-3 items-center">
                <div className="w-12 h-16 bg-secondary shrink-0">
                  {i.product.images[0] && <img src={i.product.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{i.product.name}</p>
                  <p className="font-mono-ed text-[10px] text-muted-foreground">SIZE {i.size} · ×{i.quantity}</p>
                </div>
                <span className="text-sm">{formatPrice(i.product.price_cents * i.quantity, i.product.currency)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-foreground/10 pt-4 flex justify-between">
            <span className="font-mono-ed text-[10px] tracking-[0.3em]">TOTAL</span>
            <span className="font-display text-2xl">{formatPrice(total, currency)}</span>
          </div>
          <Button onClick={placeOrder} disabled={busy} className="w-full rounded-none h-12 font-mono-ed text-xs tracking-[0.3em]">
            {busy ? "PLACING…" : "PLACE ORDER →"}
          </Button>
        </aside>
      </main>
    </div>
  );
};

const Field = ({ label, value, onChange, className, placeholder }: { label: string; value: string; onChange: (v: string) => void; className?: string; placeholder?: string }) => (
  <div className={className}>
    <Label className="text-[10px] uppercase tracking-widest">{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 rounded-none border-0 border-b border-foreground/20 bg-transparent px-0 h-10 focus-visible:ring-0" />
  </div>
);

export default Checkout;
