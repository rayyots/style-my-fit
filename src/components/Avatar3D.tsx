import { Suspense, useMemo, useRef } from "react";
import { Group, LatheGeometry, Vector2 } from "three";
import { useGLTF } from "@react-three/drei";
import { AvatarConfig } from "@/lib/avatar";

interface Props {
  cfg: AvatarConfig;
  /** Overall body scale (driven by height). Default 1. */
  bodyScale?: number;
  /** Optional gender hint affects torso/hip silhouette. */
  gender?: "female" | "male" | "nonbinary" | string;
  /** Ready Player Me (or compatible) GLB URL. When provided, replaces the procedural body. */
  glbUrl?: string | null;
}

/**
 * Realistic Ready Player Me avatar (when `glbUrl` is provided), with a procedural
 * humanoid as graceful fallback. Both honor `bodyScale`.
 */
export const Avatar3D = ({ cfg, bodyScale = 1, gender = "nonbinary", glbUrl }: Props) => {
  if (glbUrl) {
    return (
      <Suspense fallback={<StylizedAvatar cfg={cfg} bodyScale={bodyScale} gender={gender} />}>
        <GLBAvatar url={glbUrl} bodyScale={bodyScale} cfg={cfg} />
      </Suspense>
    );
  }
  return <StylizedAvatar cfg={cfg} bodyScale={bodyScale} gender={gender} />;
};

/* ───────────── Ready Player Me / GLB avatar ───────────── */
const GLBAvatar = ({ url, bodyScale, cfg }: { url: string; bodyScale: number; cfg: AvatarConfig }) => {
  const { scene } = useGLTF(url) as any;
  // RPM full-bodies are ~1.8m and stand on Y=0; pull down so feet touch the contact-shadow plane.
  const torsoStretch = cfg.torso;
  return (
    <primitive
      object={scene}
      position={[0, -1.2, 0]}
      scale={[bodyScale, bodyScale * torsoStretch, bodyScale]}
    />
  );
};

/* ───────── Stylized cartoon avatar (Pixar/CGI vibe, matches reference) ─────────
 * Big rounded head, soft eyes, simple beard for male / longer hair for female,
 * chunky chibi-ish proportions. Built entirely from primitives so it scales
 * with AvatarConfig and bodyScale, with NO external assets.
 */
const StylizedAvatar = ({ cfg, bodyScale = 1, gender = "nonbinary" }: Props) => {
  const ref = useRef<Group>(null);
  const isFemale = gender === "female";
  const isMale = gender === "male";

  // soft cartoon palette
  const skin = cfg.skin_tone;
  const hair = cfg.hair_color;
  const shirt = "#f4f1ec";   // creamy tee, looks luxurious in showroom lighting
  const trouser = "#1c2a55"; // navy
  const sneaker = "#e8c14a"; // mustard accent (matches reference)
  const sneakerSole = "#f7f5f0";

  // Stylized torso silhouette — soft "blob" using a lathe.
  const torsoGeo = useMemo(() => {
    const sh = cfg.shoulders;
    const w = cfg.waist;
    const hp = cfg.hips;
    const profile: Vector2[] = [
      new Vector2(0.001, -0.55),
      new Vector2(0.36 * hp, -0.55),
      new Vector2(0.40 * hp, -0.40),
      new Vector2(0.36 * w, -0.10),
      new Vector2(0.38 * sh, 0.18),
      new Vector2(0.42 * sh, 0.40),
      new Vector2(0.36 * sh, 0.58),
      new Vector2(0.001, 0.60),
    ];
    return new LatheGeometry(profile, 48);
  }, [cfg.shoulders, cfg.waist, cfg.hips]);

  return (
    <group
      ref={ref}
      position={[0, -1.2, 0]}
      scale={[bodyScale, cfg.torso * bodyScale, bodyScale]}
      dispose={null}
    >
      {/* ── HEAD (oversized, chibi-style ~1.7× normal) ── */}
      <group position={[0, 2.55, 0]}>
        {/* Skull — slightly oblong sphere */}
        <mesh castShadow receiveShadow scale={[1, 1.05, 0.95]}>
          <sphereGeometry args={[0.34, 64, 64]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>

        {/* Hair — wavy cap */}
        <group>
          <mesh position={[0, 0.12, -0.02]} rotation={[-0.08, 0, 0]} castShadow>
            <sphereGeometry
              args={[0.36, 48, 48, 0, Math.PI * 2, 0, Math.PI / 2.1]}
            />
            <meshStandardMaterial color={hair} roughness={0.7} />
          </mesh>
          {/* Hair clumps for stylized "wavy" look */}
          {[-0.18, -0.06, 0.06, 0.18].map((dx, i) => (
            <mesh
              key={i}
              position={[dx, 0.32 + (i % 2) * 0.04, 0.12]}
              rotation={[0.2, 0, dx * 0.6]}
              castShadow
            >
              <sphereGeometry args={[0.075, 16, 16]} />
              <meshStandardMaterial color={hair} roughness={0.7} />
            </mesh>
          ))}
          {isFemale && (
            // Long hair behind head
            <mesh position={[0, -0.18, -0.1]} castShadow>
              <cylinderGeometry args={[0.32, 0.26, 0.6, 28, 1, true]} />
              <meshStandardMaterial color={hair} roughness={0.7} side={2 as any} />
            </mesh>
          )}
        </group>

        {/* Eyes — black ovals (simple, friendly) */}
        {[-0.11, 0.11].map((dx) => (
          <group key={dx} position={[dx, 0.0, 0.295]}>
            {/* white eye base */}
            <mesh>
              <sphereGeometry args={[0.045, 24, 24]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
            {/* pupil */}
            <mesh position={[0, 0, 0.025]}>
              <sphereGeometry args={[0.025, 16, 16]} />
              <meshStandardMaterial color="#0c0c0c" roughness={0.15} />
            </mesh>
            {/* eyelid (top arc) */}
            <mesh position={[0, 0.025, 0.025]} rotation={[-0.2, 0, 0]}>
              <torusGeometry args={[0.044, 0.005, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          </group>
        ))}

        {/* Tiny nose */}
        <mesh position={[0, -0.04, 0.33]} castShadow>
          <sphereGeometry args={[0.024, 16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.5} />
        </mesh>

        {/* Mouth — small curved line / smile */}
        <mesh position={[0, -0.13, 0.31]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.05, 0.012, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#3a1a14" />
        </mesh>

        {/* Beard for male preset */}
        {isMale && (
          <group position={[0, -0.08, 0.18]}>
            <mesh castShadow>
              <sphereGeometry
                args={[0.32, 32, 32, 0, Math.PI * 2, Math.PI / 2.4, Math.PI / 2.2]}
              />
              <meshStandardMaterial color={hair} roughness={0.85} />
            </mesh>
            {/* Mustache */}
            <mesh position={[0, -0.04, 0.16]} scale={[1.4, 0.6, 1]}>
              <sphereGeometry args={[0.06, 20, 20]} />
              <meshStandardMaterial color={hair} roughness={0.85} />
            </mesh>
          </group>
        )}

        {/* Cheeks blush */}
        {[-0.16, 0.16].map((dx) => (
          <mesh key={`b${dx}`} position={[dx, -0.06, 0.28]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color="#f4a89a" roughness={0.9} transparent opacity={0.55} />
          </mesh>
        ))}
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 2.18, 0]}>
        <cylinderGeometry args={[0.085, 0.10, 0.18, 20]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>

      {/* ── TORSO (clothed in tee) ── */}
      <group position={[0, 1.55, 0]}>
        <mesh geometry={torsoGeo} castShadow receiveShadow>
          <meshStandardMaterial color={shirt} roughness={0.7} metalness={0.02} />
        </mesh>
        {/* Crew neckline accent */}
        <mesh position={[0, 0.55, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.13, 0.012, 8, 32]} />
          <meshStandardMaterial color={trouser} />
        </mesh>
      </group>

      {/* ── ARMS (chunky, cartoon-style) ── */}
      {[-1, 1].map((side) => (
        <group
          key={`arm-${side}`}
          position={[side * 0.42 * cfg.shoulders, 2.05, 0]}
          rotation={[0, 0, side * 0.06]}
        >
          {/* Shoulder ball (sleeve) */}
          <mesh castShadow>
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshStandardMaterial color={shirt} roughness={0.7} />
          </mesh>
          {/* Upper arm — sleeve */}
          <group position={[0, -0.18, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.10, 0.085, 0.32, 20]} />
              <meshStandardMaterial color={shirt} roughness={0.7} />
            </mesh>
            {/* Sleeve hem (navy band like reference) */}
            <mesh position={[0, -0.16, 0]}>
              <cylinderGeometry args={[0.092, 0.09, 0.04, 20]} />
              <meshStandardMaterial color={trouser} roughness={0.6} />
            </mesh>
          </group>
          {/* Forearm — skin */}
          <group position={[0, -0.55, 0.04]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.07, 0.06, 0.42, 18]} />
              <meshStandardMaterial color={skin} roughness={0.55} />
            </mesh>
          </group>
          {/* Hand */}
          <mesh position={[0, -0.84, 0.06]} castShadow scale={[1, 1.1, 0.7]}>
            <sphereGeometry args={[0.085, 18, 18]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
        </group>
      ))}

      {/* ── LEGS (chunky trousers) ── */}
      {[-1, 1].map((side) => (
        <group
          key={`leg-${side}`}
          position={[side * 0.16 * cfg.hips, 0.95, 0]}
          scale={[1, cfg.legs, 1]}
        >
          <mesh position={[0, -0.36, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.13, 0.72, 22]} />
            <meshStandardMaterial color={trouser} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.74, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.12, 0.65, 22]} />
            <meshStandardMaterial color={trouser} roughness={0.7} />
          </mesh>
          {/* Cuff fold */}
          <mesh position={[0, -1.06, 0]} castShadow>
            <cylinderGeometry args={[0.135, 0.13, 0.09, 22]} />
            <meshStandardMaterial color={trouser} roughness={0.5} />
          </mesh>
          {/* Sock peek */}
          <mesh position={[0, -1.13, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.04, 18]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Sneaker — colored upper + white sole */}
          <group position={[0, -1.20, 0.06]}>
            <mesh castShadow scale={[1, 0.9, 1.7]}>
              <sphereGeometry
                args={[0.13, 24, 18, 0, Math.PI * 2, 0, Math.PI / 1.6]}
              />
              <meshStandardMaterial color={sneaker} roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.06, 0]} castShadow>
              <boxGeometry args={[0.18, 0.06, 0.36]} />
              <meshStandardMaterial color={sneakerSole} roughness={0.4} />
            </mesh>
            {/* Three "stripe" laces */}
            {[-0.04, 0, 0.04].map((dz) => (
              <mesh key={dz} position={[0, 0.04, dz]}>
                <boxGeometry args={[0.20, 0.012, 0.012]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>
        </group>
      ))}
    </group>
  );
};

