import { supabase } from "@/integrations/supabase/client";

export interface CartRow {
  id: string;
  product_id: string;
  size: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price_cents: number;
    currency: string;
    images: string[];
    purchase_type: "internal" | "external";
    external_url: string | null;
    brand_id: string;
  };
}

export async function listCart(userId: string): Promise<CartRow[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("id,product_id,size,quantity,product:products(id,name,price_cents,currency,images,purchase_type,external_url,brand_id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any;
}

export async function addToCart(userId: string, productId: string, size: string, quantity = 1) {
  const { error } = await supabase.from("cart_items").insert({
    user_id: userId, product_id: productId, size, quantity,
  });
  if (error) throw error;
}

export async function updateCartQty(id: string, quantity: number) {
  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("id", id);
    return;
  }
  await supabase.from("cart_items").update({ quantity }).eq("id", id);
}

export async function removeCart(id: string) {
  await supabase.from("cart_items").delete().eq("id", id);
}

export function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}
