import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { AvatarConfig } from "@/lib/avatar";

/** 6 realistic skin tones from the spec. */
export const SKIN_TONES = [
  "#FDDBB4",
  "#F1C27D",
  "#E0AC69",
  "#C68642",
  "#8D5524",
  "#4A2912",
] as const;

export const HAIR_COLORS = [
  "#1c1611",
  "#3b2a1a",
  "#6b4a26",
  "#a67241",
  "#d8b271",
  "#e9d8c2",
] as const;

export const BODY_TYPES = ["slim", "regular", "athletic", "plus"] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const GENDERS = ["female", "male", "nonbinary"] as const;

/** Apply body_type proportions on top of the avatar config. */
export function applyBodyType(cfg: AvatarConfig, bt: BodyType, gender?: string): AvatarConfig {
  const isFemale = gender === "female";
  const p: Record<BodyType, Partial<AvatarConfig>> = {
    slim:     { shoulders: isFemale ? 0.86 : 0.95, waist: 0.78, hips: isFemale ? 0.96 : 0.86 },
    regular:  { shoulders: isFemale ? 0.95 : 1.05, waist: isFemale ? 0.88 : 0.95, hips: isFemale ? 1.05 : 0.95 },
    athletic: { shoulders: isFemale ? 1.02 : 1.18, waist: isFemale ? 0.82 : 0.90, hips: isFemale ? 1.02 : 0.95 },
    plus:     { shoulders: 1.20, waist: 1.25, hips: 1.25 },
  };
  return { ...cfg, ...p[bt] };
}

interface Props {
  cfg: AvatarConfig;
  bodyType: BodyType;
  height: number;
  gender: string;
  onChange: (
    next: { cfg: AvatarConfig; bodyType: BodyType; height: number; gender: string }
  ) => void;
}

/**
 * Compact customization panel: height slider, body type, skin tone, hair color, gender.
 * Pure UI — parent owns persistence.
 */
export const AvatarCustomizer = ({ cfg, bodyType, height, gender, onChange }: Props) => {
  const setCfg = (patch: Partial<AvatarConfig>) =>
    onChange({ cfg: { ...cfg, ...patch }, bodyType, height, gender });
  const setBody = (bt: BodyType) =>
    onChange({ cfg: applyBodyType(cfg, bt, gender), bodyType: bt, height, gender });
  const setHeight = (h: number) =>
    onChange({ cfg, bodyType, height: h, gender });
  const setGender = (g: string) =>
    onChange({ cfg: applyBodyType(cfg, bodyType, g), bodyType, height, gender: g });

  return (
    <div className="space-y-5">
      {/* Gender */}
      <div>
        <Label className="text-[10px] uppercase tracking-widest mb-2 block">Gender</Label>
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`h-10 border text-[10px] tracking-[0.2em] uppercase transition-colors ${
                gender === g
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/20 hover:border-gold"
              }`}
            >
              {g === "nonbinary" ? "Non-bin" : g}
            </button>
          ))}
        </div>
      </div>

      {/* Body type */}
      <div>
        <Label className="text-[10px] uppercase tracking-widest mb-2 block">Body type</Label>
        <div className="grid grid-cols-4 gap-2">
          {BODY_TYPES.map((bt) => (
            <button
              key={bt}
              onClick={() => setBody(bt)}
              className={`h-10 border text-[10px] tracking-[0.2em] uppercase transition-colors ${
                bodyType === bt
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/20 hover:border-gold"
              }`}
            >
              {bt}
            </button>
          ))}
        </div>
      </div>

      {/* Height */}
      <div>
        <div className="flex justify-between mb-1">
          <Label className="text-[10px] uppercase tracking-widest">Height</Label>
          <span className="font-mono-ed text-[10px] text-muted-foreground">
            {Math.round(height)} cm
          </span>
        </div>
        <Slider
          value={[height]}
          onValueChange={([v]) => setHeight(v)}
          min={150}
          max={200}
          step={1}
        />
      </div>

      {/* Skin tone */}
      <div>
        <Label className="text-[10px] uppercase tracking-widest mb-2 block">Skin tone</Label>
        <div className="flex flex-wrap gap-2">
          {SKIN_TONES.map((t) => (
            <button
              key={t}
              aria-label={`Skin tone ${t}`}
              onClick={() => setCfg({ skin_tone: t })}
              className={`w-9 h-9 rounded-full border-2 transition-all ${
                cfg.skin_tone.toLowerCase() === t.toLowerCase()
                  ? "border-gold scale-110"
                  : "border-foreground/20 hover:border-gold/60"
              }`}
              style={{ backgroundColor: t }}
            />
          ))}
        </div>
      </div>

      {/* Hair color */}
      <div>
        <Label className="text-[10px] uppercase tracking-widest mb-2 block">Hair</Label>
        <div className="flex flex-wrap gap-2">
          {HAIR_COLORS.map((t) => (
            <button
              key={t}
              aria-label={`Hair color ${t}`}
              onClick={() => setCfg({ hair_color: t })}
              className={`w-9 h-9 rounded-full border-2 transition-all ${
                cfg.hair_color.toLowerCase() === t.toLowerCase()
                  ? "border-gold scale-110"
                  : "border-foreground/20 hover:border-gold/60"
              }`}
              style={{ backgroundColor: t }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};