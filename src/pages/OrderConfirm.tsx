import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/cart";
import { Button } from "@/components/ui/button";

const TAX_RATE = 0.08; // display-only receipt tax

const paymentLabel = (m: string) => {
  if (m === "cod") return "Cash on Delivery";
  if (m === "mock_card") return "Card · Demo (no real charge)";
  return m;
};

const OrderConfirm = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: o } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      const { data: oi } = await supabase.from("order_items").select("*").eq("order_id", id);
      setOrder(o); setItems(oi ?? []);
    })();
  }, [id]);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="font-mono-ed text-xs tracking-[0.3em]">LOADING…</span>
      </div>
    );
  }

  // Receipt math: treat stored total_cents as the gross. Reverse-derive subtotal/tax for clarity.
  const gross = order.total_cents as number;
  const subtotal = Math.round(gross / (1 + TAX_RATE));
  const tax = gross - subtotal;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link to="/showroom" className="font-mono-ed text-xs tracking-[0.3em] hover:text-gold transition-colors">← SHOWROOM</Link>
        <span className="font-display text-2xl tracking-[0.35em]"><span className="italic">K</span>O · RECEIPT</span>
        <span className="w-16" />
      </header>

      <main className="max-w-2xl mx-auto p-6 lg:p-12 space-y-8">
        {/* Hero */}
        <div className="text-center">
          <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mb-3">
            ORDER {order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleString()}
          </p>
          <h1 className="font-display text-5xl">
            {order.status === "paid" ? "Payment received." : "Order placed."}
          </h1>
          <p className="text-muted-foreground mt-3">
            {order.payment_method === "cod"
              ? "Pay on delivery — please have the exact amount ready."
              : "Demo charge — no real payment was processed."}
          </p>
        </div>

        {/* Shipping */}
        <section className="border border-foreground/10 p-6 space-y-2">
          <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">SHIPPING TO</p>
          <p className="text-sm leading-relaxed">
            {order.shipping_name}<br />
            {order.shipping_address}<br />
            {order.shipping_city}, {order.shipping_country}
            {order.shipping_phone ? <><br />{order.shipping_phone}</> : null}
          </p>
        </section>

        {/* Items */}
        <section className="border border-foreground/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">
              ITEMS · {itemCount}
            </p>
          </div>
          <div className="divide-y divide-foreground/10">
            {items.map((i) => (
              <div key={i.id} className="py-3 flex justify-between items-start gap-4 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{i.product_name}</p>
                  <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mt-1">
                    SIZE {i.size} · QTY ×{i.quantity}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p>{formatPrice(i.price_cents * i.quantity, order.currency)}</p>
                  <p className="font-mono-ed text-[10px] text-muted-foreground">
                    {formatPrice(i.price_cents, order.currency)} ea
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-foreground/10 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (8%)</span>
              <span>{formatPrice(tax, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-display text-2xl pt-2 border-t border-foreground/10">
              <span>Total</span>
              <span>{formatPrice(gross, order.currency)}</span>
            </div>
          </div>
        </section>

        {/* Payment details */}
        <section className="border border-foreground/10 p-6 space-y-2">
          <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">PAYMENT</p>
          <div className="flex justify-between text-sm">
            <span>Method</span>
            <span>{paymentLabel(order.payment_method)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Status</span>
            <span className="uppercase tracking-widest font-mono-ed text-xs">{order.status}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Charged</span>
            <span>
              {order.status === "paid"
                ? formatPrice(gross, order.currency)
                : "—"}
            </span>
          </div>
        </section>

        <div className="flex justify-center gap-3">
          <Button asChild variant="outline" className="rounded-none h-12 px-6 font-mono-ed text-xs tracking-[0.3em]">
            <button onClick={() => window.print()}>PRINT RECEIPT</button>
          </Button>
          <Button asChild className="rounded-none h-12 px-10 font-mono-ed text-xs tracking-[0.3em]">
            <Link to="/showroom">CONTINUE BROWSING</Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirm;
