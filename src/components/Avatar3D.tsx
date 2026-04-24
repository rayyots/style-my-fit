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
      <Suspense fallback={<ProceduralAvatar cfg={cfg} bodyScale={bodyScale} gender={gender} />}>
        <GLBAvatar url={glbUrl} bodyScale={bodyScale} cfg={cfg} />
      </Suspense>
    );
  }
  return <ProceduralAvatar cfg={cfg} bodyScale={bodyScale} gender={gender} />;
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

/* ───────────── Procedural fallback (fully working sizing) ───────────── */
const ProceduralAvatar = ({ cfg, bodyScale = 1, gender = "nonbinary" }: Props) => {
  const ref = useRef<Group>(null);
  const isFemale = gender === "female";

  const torsoGeo = useMemo(() => {
    const sh = cfg.shoulders;
    const w = cfg.waist;
    const hp = cfg.hips;
    const bust = isFemale ? sh * 1.05 : sh * 0.98;
    const profile: Vector2[] = [
      new Vector2(0.001, -0.55),
      new Vector2(0.30 * hp, -0.55),
      new Vector2(0.34 * hp, -0.40),
      new Vector2(0.30 * w, -0.10),
      new Vector2(0.32 * sh, 0.20),
      new Vector2(0.34 * bust, 0.45),
      new Vector2(0.30 * sh, 0.62),
      new Vector2(0.001, 0.62),
    ];
    return new LatheGeometry(profile, 32);
  }, [cfg.shoulders, cfg.waist, cfg.hips, isFemale]);

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
      <group position={[0, 2.55, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.21, 48, 48]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.07, 0.015]}>
          <sphereGeometry args={[0.17, 32, 32]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.06, -0.02]} rotation={[-0.05, 0, 0]} castShadow>
          <sphereGeometry args={[0.225, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
          <meshStandardMaterial color={hair} roughness={0.85} />
        </mesh>
        {isFemale && (
          <mesh position={[0, -0.05, -0.04]} castShadow>
            <cylinderGeometry args={[0.21, 0.18, 0.32, 24, 1, true]} />
            <meshStandardMaterial color={hair} roughness={0.85} side={2 as any} />
          </mesh>
        )}
        <mesh position={[-0.07, 0.01, 0.18]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        <mesh position={[0.07, 0.01, 0.18]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.05, 0.19]}>
          <boxGeometry args={[0.18, 0.005, 0.005]} />
          <meshStandardMaterial color={hair} />
        </mesh>
      </group>

      <mesh position={[0, 2.27, 0]}>
        <cylinderGeometry args={[0.075, 0.085, 0.16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>

      <group position={[0, 1.65, 0]}>
        <mesh geometry={torsoGeo} castShadow receiveShadow>
          <meshStandardMaterial color={cloth} roughness={0.45} metalness={0.05} />
        </mesh>
      </group>

      {[-1, 1].map((side) => (
        <group
          key={`arm-${side}`}
          position={[side * 0.36 * cfg.shoulders, 2.18, 0]}
          rotation={[0, 0, side * 0.05]}
        >
          <mesh castShadow>
            <sphereGeometry args={[0.085, 16, 16]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
          <group position={[0, -0.25, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.075, 0.065, 0.5, 16]} />
              <meshStandardMaterial color={skin} roughness={0.55} />
            </mesh>
          </group>
          <mesh position={[0, -0.5, 0]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
          <group position={[0, -0.75, 0.02]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.06, 0.05, 0.45, 16]} />
              <meshStandardMaterial color={skin} roughness={0.55} />
            </mesh>
          </group>
          <mesh position={[0, -1.02, 0.04]} castShadow>
            <boxGeometry args={[0.075, 0.16, 0.045]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group
          key={`leg-${side}`}
          position={[side * 0.13 * cfg.hips, 1.0, 0]}
          scale={[1, cfg.legs, 1]}
        >
          <mesh position={[0, -0.32, 0]} castShadow>
            <cylinderGeometry args={[0.115, 0.095, 0.62, 18]} />
            <meshStandardMaterial color={dark} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.66, 0]}>
            <sphereGeometry args={[0.095, 14, 14]} />
            <meshStandardMaterial color={dark} roughness={0.5} />
          </mesh>
          <mesh position={[0, -1.0, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.07, 0.6, 16]} />
            <meshStandardMaterial color={dark} roughness={0.5} />
          </mesh>
          <mesh position={[0, -1.34, 0.07]} castShadow>
            <boxGeometry args={[0.13, 0.07, 0.3]} />
            <meshStandardMaterial color="#000" roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
