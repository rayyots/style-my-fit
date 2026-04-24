import { supabase } from "@/integrations/supabase/client";

export interface AvatarConfig {
  shoulders: number;
  waist: number;
  hips: number;
  torso: number;
  legs: number;
  skin_tone: string;
  hair_color: string;
}

/**
 * Compute an overall body scale from the user's height (cm).
 * 170 cm = 1.0. Clamped so very short / very tall users still render well.
 */
export function bodyScaleFromHeight(height_cm?: number | null): number {
  if (!height_cm) return 1;
  return Math.min(1.18, Math.max(0.82, height_cm / 170));
}

export const defaultAvatar: AvatarConfig = {
  shoulders: 1.0,
  waist: 1.0,
  hips: 1.0,
  torso: 1.0,
  legs: 1.0,
  skin_tone: "#d8a87a",
  hair_color: "#3b2a1a",
};

/** Derive a starting parametric config from height / weight / gender. */
export function deriveFromMeasurements(height_cm: number, weight_kg: number, gender: string): AvatarConfig {
  const bmi = weight_kg / Math.pow(height_cm / 100, 2);
  const heavy = Math.min(1.35, Math.max(0.75, bmi / 22));
  const tall = Math.min(1.15, Math.max(0.88, height_cm / 170));
  const isFemale = gender === "female";
  return {
    shoulders: isFemale ? 0.9 * heavy : 1.05 * heavy,
    waist: heavy * (isFemale ? 0.85 : 0.95),
    hips: isFemale ? 1.05 * heavy : 0.95 * heavy,
    torso: tall,
    legs: tall,
    skin_tone: defaultAvatar.skin_tone,
    hair_color: defaultAvatar.hair_color,
  };
}

export async function fetchAvatar(userId: string): Promise<AvatarConfig | null> {
  const { data } = await supabase.from("avatars").select("*").eq("user_id", userId).maybeSingle();
  if (!data) return null;
  return {
    shoulders: Number(data.shoulders),
    waist: Number(data.waist),
    hips: Number(data.hips),
    torso: Number(data.torso),
    legs: Number(data.legs),
    skin_tone: data.skin_tone,
    hair_color: data.hair_color,
  };
}

export async function upsertAvatar(userId: string, cfg: AvatarConfig) {
  const { error } = await supabase.from("avatars").upsert(
    { user_id: userId, ...cfg },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}
