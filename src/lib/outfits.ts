import { supabase } from "@/integrations/supabase/client";
import { AvatarConfig } from "./avatar";

export interface OutfitItem {
  product_id: string;
  name: string;
  category: string;
  brand_id: string;
  brand_name?: string;
  image: string | null;
  size?: string | null;
  color?: string | null;
  price_cents: number;
  currency: string;
}

export interface OutfitRecord {
  id: string;
  user_id: string;
  name: string;
  items: OutfitItem[];
  avatar_config: Partial<AvatarConfig> & {
    body_type?: string;
    height_cm?: number;
    gender?: string;
    glb_url?: string | null;
  };
  style_vibe: string | null;
  likes: number;
  is_public: boolean;
  created_at: string;
}

export async function saveOutfit(
  userId: string,
  payload: {
    name: string;
    items: OutfitItem[];
    avatar_config: OutfitRecord["avatar_config"];
    style_vibe?: string | null;
    is_public?: boolean;
  }
) {
  const { data, error } = await supabase
    .from("outfits")
    .insert({
      user_id: userId,
      name: payload.name,
      items: payload.items as any,
      avatar_config: payload.avatar_config as any,
      style_vibe: payload.style_vibe ?? null,
      is_public: payload.is_public ?? false,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function listMyOutfits(userId: string): Promise<OutfitRecord[]> {
  const { data, error } = await supabase
    .from("outfits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OutfitRecord[];
}

export async function deleteOutfit(id: string) {
  const { error } = await supabase.from("outfits").delete().eq("id", id);
  if (error) throw error;
}

export const STYLE_VIBES = [
  { id: "casual", label: "Casual", emoji: "🧢" },
  { id: "formal", label: "Formal", emoji: "👔" },
  { id: "streetwear", label: "Streetwear", emoji: "🔥" },
  { id: "sport", label: "Sport", emoji: "⚡" },
] as const;

export type VibeId = (typeof STYLE_VIBES)[number]["id"];

export const OUTFIT_TABS = ["top", "bottom", "shoes", "accessory", "jacket"] as const;
export type OutfitTab = (typeof OUTFIT_TABS)[number];

export const TAB_LABELS: Record<OutfitTab, string> = {
  top: "Tops",
  bottom: "Bottoms",
  shoes: "Shoes",
  accessory: "Accessories",
  jacket: "Outerwear",
};

/** Map a free-text product category to an outfit-builder tab. */
export function categoryToTab(category: string): OutfitTab {
  const c = (category || "").toLowerCase();
  if (/(jacket|coat|blazer|outerwear|parka|trench)/.test(c)) return "jacket";
  if (/(pant|trouser|jean|short|skirt|bottom|legging|dress|gown|jumpsuit)/.test(c)) return "bottom";
  if (/(shoe|sneaker|boot|heel|loafer|sandal)/.test(c)) return "shoes";
  if (/(hat|cap|beanie|bag|scarf|belt|accessor|jewel|sunglass|watch)/.test(c)) return "accessory";
  return "top";
}