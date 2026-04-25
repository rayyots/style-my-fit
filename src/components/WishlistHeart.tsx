import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { addToWishlist, removeFromWishlist, listWishlistIds } from "@/lib/wishlist";

interface Props {
  productId: string;
  /** Optional pre-fetched wishlist set; avoids extra DB hits in product grids. */
  wishedSet?: Set<string>;
  /** Optional callback when toggled (so a parent can refresh its set). */
  onToggle?: (next: boolean) => void;
  className?: string;
  size?: number;
}

/**
 * Floating heart button. Stops event propagation so it works inside <Link> cards.
 */
export const WishlistHeart = ({
  productId,
  wishedSet,
  onToggle,
  className,
  size = 14,
}: Props) => {
  const { user } = useAuth();
  const [wished, setWished] = useState(false);
  const [busy, setBusy] = useState(false);

  // Sync from prop set first (fast), then fetch only if missing.
  useEffect(() => {
    if (wishedSet) {
      setWished(wishedSet.has(productId));
      return;
    }
    if (!user) return;
    listWishlistIds(user.id).then((s) => setWished(s.has(productId)));
  }, [wishedSet, user, productId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to save items");
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !wished;
    setWished(next); // optimistic
    try {
      if (next) {
        await addToWishlist(user.id, productId);
        toast.success("Saved to wishlist");
      } else {
        await removeFromWishlist(user.id, productId);
        toast("Removed from wishlist");
      }
      onToggle?.(next);
    } catch (err: any) {
      setWished(!next);
      toast.error(err?.message ?? "Couldn't update wishlist");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.08 }}
      aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      className={
        className ??
        `grid place-items-center w-9 h-9 border backdrop-blur transition-colors ${
          wished
            ? "border-gold bg-gold/15 text-gold"
            : "border-foreground/20 bg-background/80 hover:border-gold hover:text-gold"
        }`
      }
    >
      <Heart size={size} fill={wished ? "currentColor" : "none"} />
    </motion.button>
  );
};