import { supabase } from "@/integrations/supabase/client";

export interface WishRow {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    price_cents: number;
    currency: string;
    images: string[];
    brand_id: string;
    category: string;
    sizes: string[];
  };
}

export async function listWishlist(userId: string): Promise<WishRow[]> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select(
      "id,product_id,product:products(id,name,price_cents,currency,images,brand_id,category,sizes)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any;
}

export async function listWishlistIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r: any) => r.product_id));
}

export async function addToWishlist(userId: string, productId: string) {
  const { error } = await supabase
    .from("wishlist_items")
    .insert({ user_id: userId, product_id: productId });
  if (!error) return;
  // 23505 = unique_violation. Treat as success (already wished).
  const code = (error as any).code as string | undefined;
  const msg = `${error.message ?? ""}`.toLowerCase();
  if (code === "23505" || msg.includes("duplicate") || msg.includes("unique")) return;
  throw error;
}

export async function removeFromWishlist(userId: string, productId: string) {
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
  if (error) throw error;
}

export async function toggleWishlist(
  userId: string,
  productId: string,
  current: boolean
) {
  if (current) await removeFromWishlist(userId, productId);
  else await addToWishlist(userId, productId);
  return !current;
}