import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { AvatarConfig, fetchAvatar } from "@/lib/avatar";
import { Showroom3D } from "@/components/Showroom3D";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/hooks/useUserContext";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const Showroom = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const { isAdmin, sizeTier, profile } = useUserContext();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    fetchAvatar(user.id).then((a) => {
      if (!a) navigate("/onboarding");
      else setAvatar(a);
    });
  }, [user, loading, navigate]);

  if (!avatar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="font-mono-ed text-xs tracking-[0.3em] animate-shimmer">PREPARING SHOWROOM…</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b border-foreground/10 px-4 sm:px-6 lg:px-12 py-3 flex items-center justify-between bg-background/90 backdrop-blur z-10">
        <Logo to="/" />
        <div className="hidden md:flex items-center gap-6 font-mono-ed text-[10px] tracking-[0.3em]">
          <span className="text-gold">SHOWROOM</span>
          <button onClick={() => navigate("/onboarding?edit=1")} className="hover:text-gold transition-colors">EDIT AVATAR</button>
          <Link to="/cart" className="hover:text-gold transition-colors">CART</Link>
          {isAdmin && <Link to="/admin" className="hover:text-gold transition-colors">ADMIN</Link>}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {sizeTier && <span className="hidden md:inline font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">FIT · <span className="text-gold">{sizeTier}</span></span>}
          <ThemeToggle />
          <Button variant="outline" onClick={signOut} className="rounded-none h-9 px-3 font-mono-ed text-[9px] tracking-[0.3em] hidden sm:inline-flex">
            SIGN OUT
          </Button>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-background/95 backdrop-blur border-t border-gold/30 grid grid-cols-4 font-mono-ed text-[9px] tracking-[0.25em]">
        <button onClick={() => navigate("/onboarding?edit=1")} className="py-3 hover:text-gold">AVATAR</button>
        <Link to="/cart" className="py-3 text-center hover:text-gold">CART</Link>
        {isAdmin
          ? <Link to="/admin" className="py-3 text-center hover:text-gold">ADMIN</Link>
          : <span className="py-3 text-center text-muted-foreground">FIT · {sizeTier ?? "—"}</span>}
        <button onClick={signOut} className="py-3 text-center hover:text-destructive">EXIT</button>
      </nav>

      <div className="flex-1 relative">
        <Showroom3D avatar={avatar} gender={profile?.gender} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 font-mono-ed text-[10px] tracking-[0.3em] text-foreground/70 bg-background/80 backdrop-blur px-4 py-2 border border-gold/30"
        >
          <span className="hidden md:inline">CLICK A BRAND TO ENTER · DRAG TO LOOK · SCROLL TO ZOOM</span>
          <span className="md:hidden">TAP A BRAND · SWIPE TO LOOK · PINCH TO ZOOM</span>
        </motion.div>
      </div>
    </div>
  );
};

export default Showroom;
