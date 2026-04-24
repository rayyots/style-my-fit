import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/cart";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNavTrigger } from "@/components/MobileNav";

const STATUS_COLOR: Record<string, string> = {
  pending: "text-muted-foreground",
  paid: "text-gold",
  shipped: "text-gold",
  delivered: "text-gold",
  cancelled: "text-destructive",
};

const Orders = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/auth"); return; }
    (async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      setOrders(data ?? []);
      setBusy(false);
    })();
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 px-4 sm:px-6 lg:px-12 py-3 flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-2"><MobileNavTrigger /><Logo to="/showroom" /></div>
        <span className="font-mono-ed text-[10px] tracking-[0.3em] text-gold">ORDERS</span>
        <ThemeToggle />
      </header>
      <main className="max-w-3xl mx-auto p-6 lg:p-12 pb-24">
        <motion.h1 initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="font-display text-5xl mb-10">Your orders.</motion.h1>
        {busy ? (
          <p className="text-center py-20 font-mono-ed text-xs tracking-[0.3em] animate-shimmer">LOADING…</p>
        ) : orders.length === 0 ? (
          <p className="text-center py-32 text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link key={o.id} to={`/orders/${o.id}/status`} className="block border border-foreground/10 hover:border-gold/50 transition-colors p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">{o.id.slice(0,8).toUpperCase()} · {new Date(o.created_at).toLocaleDateString()}</p>
                  <p className="font-display text-xl mt-1">{formatPrice(o.total_cents, o.currency)}</p>
                </div>
                <span className={`font-mono-ed text-[10px] tracking-[0.3em] uppercase ${STATUS_COLOR[o.status] ?? ""}`}>{o.status}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;