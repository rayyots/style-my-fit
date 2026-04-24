import { useMemo, useRef } from "react";
import { Group, LatheGeometry, Vector2 } from "three";
import { AvatarConfig } from "@/lib/avatar";

interface Props {
  cfg: AvatarConfig;
  /** Overall body scale (driven by height). Default 1. */
  bodyScale?: number;
  /** Optional gender hint affects torso/hip silhouette. */
  gender?: "female" | "male" | "nonbinary" | string;
}

/**
 * Refined procedural humanoid built from primitives + a lathed torso silhouette.
 * - Articulated arms (upper + forearm + hand)
 * - Articulated legs (thigh + shin + foot)
 * - Head with neck, hair cap, subtle facial features
 * - Torso uses a `LatheGeometry` to give a real body curve (shoulders → waist → hips)
 *
 * Sizing parameters: shoulders / waist / hips / torso / legs come from AvatarConfig.
 * bodyScale (height) scales the entire group uniformly.
 */
export const Avatar3D = ({ cfg, bodyScale = 1, gender = "nonbinary" }: Props) => {
  const ref = useRef<Group>(null);
  const isFemale = gender === "female";

  // Build a body silhouette by lathing a 2D profile around Y.
  // Points go from bottom (hips) to top (shoulders).
  const torsoGeo = useMemo(() => {
    const sh = cfg.shoulders;
    const w = cfg.waist;
    const hp = cfg.hips;
    // Female silhouette: more pronounced hip/bust curve. Male: straighter.
    const bust = isFemale ? sh * 1.05 : sh * 0.98;

    const profile: Vector2[] = [
      new Vector2(0.001, -0.55),                    // bottom centerline
      new Vector2(0.30 * hp, -0.55),                // bottom hip width
      new Vector2(0.34 * hp, -0.40),                // hip
      new Vector2(0.30 * w, -0.10),                 // waist
      new Vector2(0.32 * sh, 0.20),                 // ribs
      new Vector2(0.34 * bust, 0.45),               // bust / chest
      new Vector2(0.30 * sh, 0.62),                 // shoulder cap
      new Vector2(0.001, 0.62),                     // top centerline
    ];
    return new LatheGeometry(profile, 32);
  }, [cfg.shoulders, cfg.waist, cfg.hips, isFemale]);

  // Color tokens
  const skin = cfg.skin_tone;
  const hair = cfg.hair_color;
  const cloth = "#1a1a1a";
  const dark = "#0d0d0d";

  return (
    <group
      ref={ref}
      position={[0, -1.2, 0]}
      scale={[bodyScale, cfg.torso * bodyScale, bodyScale]}
      dispose={null}
    >
      {/* ───────── HEAD ───────── */}
      <group position={[0, 2.55, 0]}>
        {/* Skull */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.21, 48, 48]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
        {/* Jaw — slight elongation downward */}
        <mesh position={[0, -0.07, 0.015]}>
          <sphereGeometry args={[0.17, 32, 32]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
        {/* Hair cap */}
        <mesh position={[0, 0.06, -0.02]} rotation={[-0.05, 0, 0]} castShadow>
          <sphereGeometry args={[0.225, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
          <meshStandardMaterial color={hair} roughness={0.85} />
        </mesh>
        {/* Hair length (only when female-ish) */}
        {isFemale && (
          <mesh position={[0, -0.05, -0.04]} castShadow>
            <cylinderGeometry args={[0.21, 0.18, 0.32, 24, 1, true]} />
            <meshStandardMaterial color={hair} roughness={0.85} side={2 as any} />
          </mesh>
        )}
        {/* Eyes — small dark beads */}
        <mesh position={[-0.07, 0.01, 0.18]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        <mesh position={[0.07, 0.01, 0.18]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        {/* Subtle brow shadow */}
        <mesh position={[0, 0.05, 0.19]}>
          <boxGeometry args={[0.18, 0.005, 0.005]} />
          <meshStandardMaterial color={hair} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, 2.27, 0]}>
        <cylinderGeometry args={[0.075, 0.085, 0.16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>

      {/* ───────── TORSO (lathed) ───────── */}
      <group position={[0, 1.65, 0]}>
        <mesh geometry={torsoGeo} castShadow receiveShadow>
          <meshStandardMaterial color={cloth} roughness={0.45} metalness={0.05} />
        </mesh>
      </group>

      {/* ───────── ARMS ───────── */}
      {[-1, 1].map((side) => (
        <group
          key={`arm-${side}`}
          position={[side * 0.36 * cfg.shoulders, 2.18, 0]}
          rotation={[0, 0, side * 0.05]}
        >
          {/* Shoulder cap */}
          <mesh castShadow>
            <sphereGeometry args={[0.085, 16, 16]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
          {/* Upper arm */}
          <group position={[0, -0.25, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.075, 0.065, 0.5, 16]} />
              <meshStandardMaterial color={skin} roughness={0.55} />
            </mesh>
          </group>
          {/* Elbow */}
          <mesh position={[0, -0.5, 0]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
          {/* Forearm */}
          <group position={[0, -0.75, 0.02]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.06, 0.05, 0.45, 16]} />
              <meshStandardMaterial color={skin} roughness={0.55} />
            </mesh>
          </group>
          {/* Hand */}
          <mesh position={[0, -1.02, 0.04]} castShadow>
            <boxGeometry args={[0.075, 0.16, 0.045]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
        </group>
      ))}

      {/* ───────── LEGS ───────── */}
      {[-1, 1].map((side) => (
        <group
          key={`leg-${side}`}
          position={[side * 0.13 * cfg.hips, 1.0, 0]}
          scale={[1, cfg.legs, 1]}
        >
          {/* Thigh */}
          <mesh position={[0, -0.32, 0]} castShadow>
            <cylinderGeometry args={[0.115, 0.095, 0.62, 18]} />
            <meshStandardMaterial color={dark} roughness={0.5} />
          </mesh>
          {/* Knee */}
          <mesh position={[0, -0.66, 0]}>
            <sphereGeometry args={[0.095, 14, 14]} />
            <meshStandardMaterial color={dark} roughness={0.5} />
          </mesh>
          {/* Shin */}
          <mesh position={[0, -1.0, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.07, 0.6, 16]} />
            <meshStandardMaterial color={dark} roughness={0.5} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, -1.34, 0.07]} castShadow>
            <boxGeometry args={[0.13, 0.07, 0.3]} />
            <meshStandardMaterial color="#000" roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
