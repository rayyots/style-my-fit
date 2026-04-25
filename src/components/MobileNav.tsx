import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserContext } from "@/hooks/useUserContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";

/**
 * Hamburger drawer used on phone/tablet across all main pages.
 * Pairs with the bottom tab bar on Showroom-style screens.
 */
export const MobileNavTrigger = () => {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin, sizeTier, profile } = useUserContext();

  const go = (to: string) => {
    setOpen(false);
    nav(to);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Menu"
        className="md:hidden grid place-items-center w-10 h-10 border border-foreground/15 hover:border-gold transition-colors rounded-none"
      >
        <Menu size={16} />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[78%] max-w-sm bg-background border-r border-gold/30 p-0 flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/10">
          <Logo to="/showroom" />
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid place-items-center w-9 h-9 border border-foreground/15 hover:border-gold transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {profile?.name && (
          <div className="px-5 py-4 border-b border-foreground/10">
            <p className="font-mono-ed text-[9px] tracking-[0.3em] text-muted-foreground">
              SIGNED IN
            </p>
            <p className="font-display text-2xl mt-1">{profile.name}</p>
            {sizeTier && (
              <p className="font-mono-ed text-[10px] tracking-[0.3em] mt-1 text-gold">
                FIT · {sizeTier}
              </p>
            )}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2">
          {[
            { l: "SHOWROOM", to: "/showroom" },
            { l: "STYLER", to: "/styler" },
            { l: "WISHLIST", to: "/wishlist" },
            { l: "CART", to: "/cart" },
            { l: "ORDERS", to: "/orders" },
            { l: "EDIT AVATAR", to: "/onboarding?edit=1" },
            ...(isAdmin ? [{ l: "ADMIN", to: "/admin" }] : []),
          ].map((it) => (
            <button
              key={it.l}
              onClick={() => go(it.to)}
              className="w-full text-left px-5 py-4 border-b border-foreground/5 font-mono-ed text-xs tracking-[0.3em] hover:bg-secondary hover:text-gold transition-colors"
            >
              {it.l}
            </button>
          ))}
        </nav>

        <div className="border-t border-foreground/10 px-5 py-4 flex items-center justify-between">
          <ThemeToggle />
          <button
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground hover:text-destructive transition-colors"
          >
            SIGN OUT
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};