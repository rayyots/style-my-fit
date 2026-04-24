import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Circle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/cart";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNavTrigger } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/hooks/useUserContext";
import { toast } from "sonner";

const STAGES = ["pending", "paid", "shipped", "delivered"] as const;
type Stage = (typeof STAGES)[number];

const OrderStatus = () => {
  const { id } = useParams();
  const { isAdmin } = useUserContext();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  const reload = async () => {
    const { data: o } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
    const { data: oi } = await supabase.from("order_items").select("*").eq("order_id", id);
    setOrder(o); setItems(oi ?? []);
  };
  useEffect(() => { reload(); }, [id]);

  if (!order) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="font-mono-ed text-xs tracking-[0.3em]">LOADING…</span></div>;

  const cancelled = order.status === "cancelled";
  const currentIdx = cancelled ? -1 : STAGES.indexOf(order.status as Stage);

  const advance = async (next: Stage) => {
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", order.id);
    if (error) toast.error(error.message); else { toast.success(`Marked ${next}`); reload(); }
  };
  const cancel = async () => {
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    if (error) toast.error(error.message); else { toast.success("Order cancelled"); reload(); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 px-4 sm:px-6 lg:px-12 py-3 flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-2"><MobileNavTrigger /><Logo to="/showroom" /></div>
        <span className="font-mono-ed text-[10px] tracking-[0.3em] text-gold">ORDER · {order.id.slice(0,8).toUpperCase()}</span>
        <ThemeToggle />
      </header>
      <main className="max-w-2xl mx-auto p-6 lg:p-12 pb-24 space-y-8">
        <div className="text-center">
          <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mb-3">{new Date(order.created_at).toLocaleString()}</p>
          <h1 className="font-display text-5xl">{cancelled ? "Cancelled." : order.status === "delivered" ? "Delivered." : "In motion."}</h1>
          <p className="text-muted-foreground mt-3">Track your KO order.</p>
        </div>

        {/* Timeline */}
        <section className="border border-gold/30 p-6 bg-gradient-spotlight">
          {cancelled ? (
            <div className="flex items-center gap-3 text-destructive"><X size={18} /><span className="font-mono-ed text-xs tracking-[0.3em]">ORDER CANCELLED</span></div>
          ) : (
            <ol className="relative">
              {STAGES.map((s, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <li key={s} className="flex gap-4 pb-6 last:pb-0 relative">
                    {i < STAGES.length - 1 && (
                      <span className={`absolute left-[11px] top-7 bottom-0 w-px ${done ? "bg-gold" : "bg-foreground/15"}`} />
                    )}
                    <motion.div initial={false} animate={{scale: active ? 1.1 : 1}} className={`relative z-10 mt-0.5 w-6 h-6 rounded-full grid place-items-center border-2 ${done ? "bg-gold border-gold text-gold-foreground" : "border-foreground/20 text-muted-foreground"}`}>
                      {done ? <Check size={12} /> : <Circle size={6} />}
                    </motion.div>
                    <div className="flex-1">
                      <p className={`font-mono-ed text-[11px] tracking-[0.3em] uppercase ${active ? "text-gold" : done ? "text-foreground" : "text-muted-foreground"}`}>{s}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s === "pending" && "Awaiting payment confirmation."}
                        {s === "paid" && "Payment captured. Preparing for dispatch."}
                        {s === "shipped" && "On the way to your address."}
                        {s === "delivered" && "Delivered. Enjoy your KO piece."}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Items */}
        <section className="border border-foreground/10 p-6">
          <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mb-3">ITEMS</p>
          <div className="divide-y divide-foreground/10">
            {items.map((i) => (
              <div key={i.id} className="py-3 flex justify-between text-sm">
                <div><p className="font-medium">{i.product_name}</p><p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground mt-1">SIZE {i.size} · ×{i.quantity}</p></div>
                <span>{formatPrice(i.price_cents * i.quantity, order.currency)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-foreground/10 pt-3 mt-3 flex justify-between font-display text-xl"><span>Total</span><span>{formatPrice(order.total_cents, order.currency)}</span></div>
        </section>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild variant="outline" className="rounded-none h-11 px-6 font-mono-ed text-[10px] tracking-[0.3em]"><Link to={`/orders/${order.id}`}>VIEW RECEIPT</Link></Button>
          {!cancelled && order.status === "pending" && (
            <Button variant="outline" onClick={cancel} className="rounded-none h-11 px-6 font-mono-ed text-[10px] tracking-[0.3em] text-destructive border-destructive/40">CANCEL ORDER</Button>
          )}
          {isAdmin && !cancelled && currentIdx < STAGES.length - 1 && (
            <Button onClick={() => advance(STAGES[currentIdx + 1])} className="rounded-none h-11 px-6 font-mono-ed text-[10px] tracking-[0.3em]">ADMIN · MARK {STAGES[currentIdx + 1].toUpperCase()}</Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderStatus;