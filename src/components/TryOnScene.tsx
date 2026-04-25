import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense, useMemo, MutableRefObject } from "react";
import { TextureLoader, DoubleSide, RepeatWrapping } from "three";
import { Avatar3D } from "./Avatar3D";
import { AvatarConfig } from "@/lib/avatar";

export type GarmentKind =
  | "top"        // shirts, tops, blouses, sweaters
  | "jacket"     // outerwear, coats, blazers
  | "bottom"     // pants, trousers, jeans, shorts, skirts
  | "dress"      // dresses, gowns, jumpsuits
  | "shoes"      // sneakers, boots, heels
  | "hat"        // caps, beanies
  | "accessory"; // bags, scarves

export interface OverlayCfg {
  url: string;
  x: number;
  y: number;
  z: number;       // tiny inflation to avoid skin clipping
  scale: number;
  rotation: number;
  mode?: "flat" | "wrap";
  garment?: GarmentKind;
}

/**
 * Category → garment type mapping. Robust to free-text categories from admin.
 */
export const guessGarment = (category: string): GarmentKind => {
  const c = category.toLowerCase();
  if (/(jacket|coat|blazer|outerwear|parka|trench)/.test(c)) return "jacket";
  if (/(pant|trouser|jean|short|skirt|bottom|legging)/.test(c)) return "bottom";
  if (/(dress|gown|robe|jumpsuit)/.test(c)) return "dress";
  if (/(shoe|sneaker|boot|heel|loafer|sandal)/.test(c)) return "shoes";
  if (/(hat|cap|beanie)/.test(c)) return "hat";
  if (/(bag|scarf|belt|accessor)/.test(c)) return "accessory";
  return "top";
};

/* ------------------ FLAT (sticker) ------------------ */
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

/* ------------------ 3D wrapped garment ------------------
 * Uses category to pick the right body region:
 *   top/jacket → torso cylinder
 *   bottom     → leg cylinder pair
 *   dress      → full-length silhouette
 *   shoes      → flat plates over feet
 *   hat        → cap above head
 *   accessory  → small plane at chest
 */
const WrappedGarment = ({ cfg, avatar }: { cfg: OverlayCfg; avatar: AvatarConfig }) => {
  const texture = useLoader(TextureLoader, cfg.url);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;

  const garment: GarmentKind = cfg.garment ?? "top";
  // base inflate is bigger to wrap the chunky stylized avatar without clipping
  const inflate = 0.06 + Math.max(0, cfg.z) * 0.5;

  const Material = (
    <meshStandardMaterial
      map={texture}
      transparent
      side={DoubleSide}
      roughness={0.85}
      metalness={0}
    />
  );

  // ───── shoes: two flat plates over feet
  if (garment === "shoes") {
    const yFoot = -1.21;
    return (
      <group position={[cfg.x, 0, 0]} rotation={[0, cfg.rotation, 0]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.16 * avatar.hips, yFoot + cfg.y * 0.1, 0.07]}>
            <boxGeometry args={[0.20 * cfg.scale, 0.10 * cfg.scale, 0.40 * cfg.scale]} />
            {Material}
          </mesh>
        ))}
      </group>
    );
  }

  // ───── hat: dome above head
  if (garment === "hat") {
    return (
      <group position={[cfg.x, 1.78 + cfg.y, 0]} rotation={[0, cfg.rotation, 0]}>
        <mesh>
          <sphereGeometry
            args={[0.40 * cfg.scale, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          {Material}
        </mesh>
      </group>
    );
  }

  // ───── accessory: small plane at chest
  if (garment === "accessory") {
    return (
      <mesh position={[cfg.x, 0.5 + cfg.y, 0.45]} rotation={[0, cfg.rotation, 0]}>
        <planeGeometry args={[0.55 * cfg.scale, 0.55 * cfg.scale]} />
        {Material}
      </mesh>
    );
  }

  // ───── bottom: pair of leg cylinders
  if (garment === "bottom") {
    const top = 0.42 * avatar.hips + inflate;
    const bot = 0.16 * avatar.hips + inflate;
    const len = 1.20 * cfg.scale;
    return (
      <group position={[cfg.x, -0.30 + cfg.y, 0]} rotation={[0, cfg.rotation, 0]}>
        {/* Yoke / waistband */}
        <mesh>
          <cylinderGeometry
            args={[0.44 * avatar.hips + inflate, 0.40 * avatar.hips + inflate, 0.20, 32, 1, true]}
          />
          {Material}
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.16 * avatar.hips, -0.62, 0]}>
            <cylinderGeometry args={[top * 0.45, bot, len, 28, 1, true]} />
            {Material}
          </mesh>
        ))}
      </group>
    );
  }

  // ───── dress: full-length flowing silhouette
  if (garment === "dress") {
    return (
      <group position={[cfg.x, -0.10 + cfg.y, 0]} rotation={[0, cfg.rotation, 0]}>
        <mesh castShadow>
          <cylinderGeometry
            args={[
              0.42 * avatar.shoulders + inflate,
              0.60 * avatar.hips + inflate,
              1.75 * cfg.scale,
              48,
              8,
              true,
            ]}
          />
          {Material}
        </mesh>
      </group>
    );
  }

  // ───── top / jacket: torso cylinder, jacket slightly inflated
  const jacket = garment === "jacket";
  const radTop = (jacket ? 0.46 : 0.42) * avatar.shoulders + (jacket ? inflate * 1.6 : inflate);
  const radBot = (jacket ? 0.44 : 0.38) * avatar.waist + (jacket ? inflate * 1.4 : inflate);
  return (
    <group position={[cfg.x, 0.45 + cfg.y, 0]} rotation={[0, cfg.rotation, 0]}>
      <mesh castShadow>
        <cylinderGeometry
          args={[radTop, radBot, 1.05 * cfg.scale, 48, 6, true]}
        />
        {Material}
      </mesh>
      {jacket && (
        // jacket sleeves — short cylinders over the arms
        <>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * (0.42 * avatar.shoulders + 0.06), -0.05, 0]}
              rotation={[0, 0, side * 0.05]}
            >
              <cylinderGeometry args={[0.14, 0.11, 0.65 * cfg.scale, 18, 1, true]} />
              {Material}
            </mesh>
          ))}
        </>
      )}
    </group>
  );
};

interface Props {
  avatar: AvatarConfig;
  overlay: OverlayCfg | null;
  bodyScale?: number;
  gender?: string;
  glbUrl?: string | null;
  /** Auto-decide between mouse and touch interaction. Defaults true. */
  enableTouchControls?: boolean;
  /** Ref for imperative camera control from floating buttons. */
  controlsRef?: MutableRefObject<any>;
}

export const TryOnScene = ({ avatar, overlay, bodyScale = 1, gender, glbUrl, controlsRef }: Props) => {
  return (
    <Canvas shadows camera={{ position: [0, 1.4, 4], fov: 42 }} dpr={[1, 1.75]}>
      <color attach="background" args={["#0e0c0a"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 6, 4]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#d4a85a" />
      <Suspense fallback={null}>
        <Avatar3D cfg={avatar} bodyScale={bodyScale} gender={gender} glbUrl={glbUrl} />
        {overlay && overlay.mode === "flat" && <FlatPlane cfg={overlay} />}
        {overlay && (overlay.mode ?? "wrap") === "wrap" && (
          <WrappedGarment cfg={overlay} avatar={avatar} />
        )}
        <ContactShadows position={[0, -1.21, 0]} opacity={0.55} scale={6} blur={2.5} />
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls
        ref={controlsRef as any}
        enablePan={false}
        minDistance={1.8}
        maxDistance={6}
        target={[0, 0.6, 0]}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.7}
        touches={{ ONE: 0, TWO: 2 }}
      />
    </Canvas>
  );
};
