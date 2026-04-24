import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import { TextureLoader, DoubleSide, RepeatWrapping } from "three";
import { Avatar3D } from "./Avatar3D";
import { AvatarConfig } from "@/lib/avatar";

export interface OverlayCfg {
  url: string;
  x: number;       // horizontal offset
  y: number;       // vertical offset (height on body)
  z: number;       // depth (front/back) — used as small extra inflation
  scale: number;   // overall scale (height of the garment)
  rotation: number;
  /** "flat" = old billboard plane, "wrap" = curved 3D garment hugging the avatar */
  mode?: "flat" | "wrap";
  garment?: "top" | "bottom" | "dress";
}

/* ------------------------------------------------------------------ */
/*  FLAT MODE — kept for products that look better as a sticker        */
/* ------------------------------------------------------------------ */
const FlatPlane = ({ cfg }: { cfg: OverlayCfg }) => {
  const texture = useLoader(TextureLoader, cfg.url);
  const aspect = texture.image ? texture.image.width / texture.image.height : 0.75;
  const w = cfg.scale * aspect;
  const h = cfg.scale;
  return (
    <mesh position={[cfg.x, cfg.y, cfg.z]} rotation={[0, cfg.rotation, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} transparent side={DoubleSide} />
    </mesh>
  );
};

/* ------------------------------------------------------------------ */
/*  WRAP MODE — Vistra-style 2D-to-3D garment                          */
/*  Builds a curved garment mesh shaped to the avatar (shoulders/waist */
/*  /hips) and applies the product image as a wrapped texture.         */
/* ------------------------------------------------------------------ */
const WrappedGarment = ({ cfg, avatar }: { cfg: OverlayCfg; avatar: AvatarConfig }) => {
  const texture = useLoader(TextureLoader, cfg.url);

  // Texture should NOT tile — wrap once across the front-facing arc
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;

  const garment = cfg.garment ?? "top";

  // Garment dimensions follow the avatar's parametric proportions.
  // Cylinder geometry naturally wraps a texture around its surface.
  const params = useMemo(() => {
    const inflate = 0.04 + Math.max(0, cfg.z) * 0.5; // gives the cloth a tiny offset from skin
    if (garment === "bottom") {
      return {
        radiusTop: 0.3 * avatar.hips + inflate,
        radiusBottom: 0.22 * avatar.hips + inflate,
        height: 0.95 * cfg.scale,
        y: cfg.y,
      };
    }
    if (garment === "dress") {
      return {
        radiusTop: 0.34 * avatar.shoulders + inflate,
        radiusBottom: 0.36 * avatar.hips + inflate,
        height: 1.4 * cfg.scale,
        y: cfg.y,
      };
    }
    // top
    return {
      radiusTop: 0.34 * avatar.shoulders + inflate,
      radiusBottom: 0.3 * avatar.waist + inflate,
      height: 0.9 * cfg.scale,
      y: cfg.y,
    };
  }, [avatar, garment, cfg.scale, cfg.y, cfg.z]);

  return (
    <group position={[cfg.x, params.y, 0]} rotation={[0, cfg.rotation, 0]}>
      {/* Outer cloth surface — open cylinder so it wraps around the body */}
      <mesh castShadow>
        <cylinderGeometry
          args={[
            params.radiusTop,
            params.radiusBottom,
            params.height,
            48,         // radial segments — smooth wrap
            6,          // height segments
            true,       // open-ended (no caps)
          ]}
        />
        <meshStandardMaterial
          map={texture}
          transparent
          side={DoubleSide}
          roughness={0.85}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
};

interface Props {
  avatar: AvatarConfig;
  overlay: OverlayCfg | null;
  /** Overall body scale derived from height. */
  bodyScale?: number;
}

export const TryOnScene = ({ avatar, overlay, bodyScale = 1 }: Props) => {
  return (
    <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#f4f1ea"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.0} castShadow />
      <Suspense fallback={null}>
        <Avatar3D cfg={avatar} bodyScale={bodyScale} />
        {overlay && overlay.mode === "flat" && <FlatPlane cfg={overlay} />}
        {overlay && (overlay.mode ?? "wrap") === "wrap" && (
          <WrappedGarment cfg={overlay} avatar={avatar} />
        )}
        <ContactShadows position={[0, -1.21, 0]} opacity={0.4} scale={6} blur={2} />
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        target={[0, 0.6, 0]}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
};
