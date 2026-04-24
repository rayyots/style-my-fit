import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/cart";
import { Button } from "@/components/ui/button";

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

  if (!order) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="font-mono-ed text-xs tracking-[0.3em]">LOADING…</span></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link to="/showroom" className="font-mono-ed text-xs tracking-[0.3em] hover:bg-accent px-2 py-1">← SHOWROOM</Link>
        <span className="font-display text-xl tracking-[0.4em]">ORDER</span>
        <span className="w-16" />
      </header>
      <main className="max-w-2xl mx-auto p-6 lg:p-12 space-y-8 text-center">
        <div>
          <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mb-3">ORDER {order.id.slice(0, 8).toUpperCase()}</p>
          <h1 className="font-display text-5xl">{order.status === "paid" ? "Payment received." : "Order placed."}</h1>
          <p className="text-muted-foreground mt-3">
            {order.payment_method === "cod" ? "Pay on delivery." : "Demo charge — no real payment was processed."}
          </p>
        </div>
        <div className="text-left border border-foreground/10 p-6 space-y-3">
          <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">SHIPPING TO</p>
          <p>{order.shipping_name}<br/>{order.shipping_address}<br/>{order.shipping_city}, {order.shipping_country}</p>
        </div>
        <div className="text-left border border-foreground/10 p-6 space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex justify-between text-sm">
              <span>{i.product_name} · {i.size} · ×{i.quantity}</span>
              <span>{formatPrice(i.price_cents * i.quantity, order.currency)}</span>
            </div>
          ))}
          <div className="border-t border-foreground/10 pt-2 flex justify-between font-display text-xl">
            <span>Total</span><span>{formatPrice(order.total_cents, order.currency)}</span>
          </div>
        </div>
        <Button asChild className="rounded-none h-12 px-10 font-mono-ed text-xs tracking-[0.3em]"><Link to="/showroom">CONTINUE BROWSING</Link></Button>
      </main>
    </div>
  );
};

export default OrderConfirm;
