import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AvatarConfig, defaultAvatar, fetchAvatar } from "@/lib/avatar";
import { Showroom3D } from "@/components/Showroom3D";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/hooks/useUserContext";

const Showroom = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const { isAdmin, sizeTier } = useUserContext();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
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
      <header className="border-b border-foreground/10 px-6 lg:px-12 py-4 flex items-center justify-between bg-background/90 backdrop-blur z-10">
        <span className="font-display text-xl tracking-[0.4em]">ATELIER</span>
        <div className="hidden md:flex items-center gap-8 font-mono-ed text-xs tracking-[0.3em]">
          <span className="text-muted-foreground">SHOWROOM</span>
          <button onClick={() => navigate("/onboarding?edit=1")} className="hover:text-accent-foreground hover:bg-accent px-2 py-1 transition-colors">EDIT AVATAR</button>
          <Link to="/cart" className="hover:text-accent-foreground hover:bg-accent px-2 py-1 transition-colors">CART</Link>
          {isAdmin && <Link to="/admin" className="hover:text-accent-foreground hover:bg-accent px-2 py-1 transition-colors">ADMIN</Link>}
        </div>
        <div className="flex items-center gap-3">
          {sizeTier && <span className="hidden md:inline font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">FIT · {sizeTier}</span>}
          <span className="hidden md:inline font-mono-ed text-xs text-muted-foreground">{user?.email}</span>
          <Button variant="outline" onClick={signOut} className="rounded-none h-9 font-mono-ed text-[10px] tracking-[0.3em]">
            SIGN OUT
          </Button>
        </div>
      </header>

      <div className="flex-1 relative">
        <Showroom3D avatar={avatar} />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono-ed text-[10px] tracking-[0.3em] text-foreground/60 bg-background/80 backdrop-blur px-4 py-2 border border-foreground/10">
          CLICK A BRAND TO ENTER · DRAG TO LOOK · SCROLL TO ZOOM
        </div>
      </div>
    </div>
  );
};

export default Showroom;
