import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { AvatarConfig, fetchAvatar, fetchAvatarGlbUrl } from "@/lib/avatar";
import { Showroom3D } from "@/components/Showroom3D";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/hooks/useUserContext";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNavTrigger } from "@/components/MobileNav";
import { Heart } from "lucide-react";

const Showroom = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [enteringBrand, setEnteringBrand] = useState<string | null>(null);
  const { isAdmin, sizeTier, profile } = useUserContext();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const [a, g] = await Promise.all([
        fetchAvatar(user.id),
        fetchAvatarGlbUrl(user.id),
      ]);
      if (!a) navigate("/onboarding");
      else { setAvatar(a); setGlbUrl(g); }
    })();
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
        <div className="flex items-center gap-2">
          <MobileNavTrigger />
          <Logo to="/" />
        </div>
        <div className="hidden md:flex items-center gap-6 font-mono-ed text-[10px] tracking-[0.3em]">
          <span className="text-gold">SHOWROOM</span>
          <button onClick={() => navigate("/onboarding?edit=1")} className="hover:text-gold transition-colors">EDIT AVATAR</button>
          <Link to="/wishlist" className="hover:text-gold transition-colors">WISHLIST</Link>
          <Link to="/orders" className="hover:text-gold transition-colors">ORDERS</Link>
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
        <Link to="/wishlist" className="py-3 text-center hover:text-gold inline-flex items-center justify-center gap-1"><Heart size={11} /> WISH</Link>
        <Link to="/cart" className="py-3 text-center hover:text-gold">CART</Link>
        <Link to="/orders" className="py-3 text-center hover:text-gold">ORDERS</Link>
      </nav>

      <div className="flex-1 relative">
        <Showroom3D
          avatar={avatar}
          gender={profile?.gender}
          glbUrl={glbUrl}
          onEnterStart={(slug) => setEnteringBrand(slug)}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 font-mono-ed text-[10px] tracking-[0.3em] text-foreground/70 bg-background/80 backdrop-blur px-4 py-2 border border-gold/30"
        >
          <span className="hidden md:inline">CLICK A BRAND TO ENTER · DRAG TO LOOK · SCROLL TO ZOOM</span>
          <span className="md:hidden">TAP A BRAND · SWIPE TO LOOK · PINCH TO ZOOM</span>
        </motion.div>

        {/* Cinematic fly-through fade — appears during the camera flight */}
        <AnimatePresence>
          {enteringBrand && (
            <motion.div
              key="flash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
              className="pointer-events-none absolute inset-0 bg-background z-30 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-center"
              >
                <div className="font-mono-ed text-[10px] tracking-[0.5em] text-gold mb-3">— ENTERING —</div>
                <div className="font-display text-4xl tracking-[0.3em] uppercase">
                  {enteringBrand.replace(/-/g, " ")}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Showroom;
