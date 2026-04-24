// Body-size tier derivation from height/weight/gender.
// Returns standard apparel sizes (XS..XXL) used across catalog filtering.

export type SizeTier = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export const ALL_SIZES: SizeTier[] = ["XS", "S", "M", "L", "XL", "XXL"];

export interface BodyInput {
  height_cm: number;
  weight_kg: number;
  gender: "female" | "male" | "nonbinary" | string;
}

/**
 * Maps BMI to a primary size tier, then nudges by absolute weight & gender chart.
 * Returns the recommended tier plus the adjacent tiers (recommended fit window).
 */
export function deriveSizeTiers(input: BodyInput): { primary: SizeTier; recommended: SizeTier[] } {
  const { height_cm, weight_kg, gender } = input;
  const bmi = weight_kg / Math.pow(height_cm / 100, 2);
  const isFemale = gender === "female";

  // Gender-tuned BMI break-points
  const breaks = isFemale
    ? [17.5, 19.5, 22, 25, 29, 33] // XS,S,M,L,XL,XXL upper bounds
    : [18.5, 20.5, 23.5, 26.5, 30, 34];

  let idx = breaks.findIndex((b) => bmi <= b);
  if (idx === -1) idx = breaks.length - 1;

  // Weight nudge: very tall + heavy → bump up; very short + light → bump down
  if (height_cm > 185 && weight_kg > 80) idx = Math.min(idx + 1, ALL_SIZES.length - 1);
  if (height_cm < 155 && weight_kg < 50) idx = Math.max(idx - 1, 0);

  const primary = ALL_SIZES[idx];
  const recommended = [
    ALL_SIZES[Math.max(0, idx - 1)],
    primary,
    ALL_SIZES[Math.min(ALL_SIZES.length - 1, idx + 1)],
  ].filter((s, i, arr) => arr.indexOf(s) === i);

  return { primary, recommended };
}
