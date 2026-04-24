import { useRef } from "react";
import { Group } from "three";
import { AvatarConfig } from "@/lib/avatar";

interface Props {
  cfg: AvatarConfig;
  rotateSpeed?: number;
}

/**
 * Parametric low-poly avatar built from primitives.
 * Scale-driven morph: shoulders/waist/hips/torso/legs control geometry scale.
 */
export const Avatar3D = ({ cfg }: Props) => {
  const ref = useRef<Group>(null);

  return (
    <group ref={ref} position={[0, -1.2, 0]} scale={[1, cfg.torso, 1]}>
      {/* Head */}
      <mesh position={[0, 2.55, 0]} castShadow>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color={cfg.skin_tone} roughness={0.55} />
      </mesh>
      {/* Hair cap */}
      <mesh position={[0, 2.66, -0.02]} castShadow>
        <sphereGeometry args={[0.235, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={cfg.hair_color} roughness={0.8} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 2.27, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.14, 16]} />
        <meshStandardMaterial color={cfg.skin_tone} roughness={0.6} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.7, 0]} scale={[cfg.shoulders, 1, cfg.shoulders * 0.55]} castShadow>
        <cylinderGeometry args={[0.32, 0.28 * cfg.waist, 0.85, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Hips */}
      <mesh position={[0, 1.18, 0]} scale={[cfg.hips, 1, cfg.hips * 0.6]} castShadow>
        <cylinderGeometry args={[0.3, 0.28, 0.25, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
      </mesh>
      {/* Arms */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.42 * cfg.shoulders, 1.95, 0]}>
          <mesh position={[0, -0.4, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.06, 0.85, 16]} />
            <meshStandardMaterial color={cfg.skin_tone} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Legs */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.13 * cfg.hips, 0.55, 0]} scale={[1, cfg.legs, 1]}>
          <mesh position={[0, -0.05, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.09, 1.1, 16]} />
            <meshStandardMaterial color="#0d0d0d" roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Feet */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.13 * cfg.hips, -0.05 + (cfg.legs - 1) * -0.55, 0.05]} castShadow>
          <boxGeometry args={[0.13, 0.06, 0.28]} />
          <meshStandardMaterial color="#000" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
};
