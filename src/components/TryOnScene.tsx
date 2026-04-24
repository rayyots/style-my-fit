import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense } from "react";
import { TextureLoader, DoubleSide } from "three";
import { Avatar3D } from "./Avatar3D";
import { AvatarConfig } from "@/lib/avatar";

interface OverlayCfg {
  url: string;
  x: number;       // horizontal offset
  y: number;       // vertical offset (height on body)
  z: number;       // depth (front/back)
  scale: number;   // overall scale
  rotation: number;
}

const ProductPlane = ({ cfg }: { cfg: OverlayCfg }) => {
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

interface Props {
  avatar: AvatarConfig;
  overlay: OverlayCfg | null;
}

export const TryOnScene = ({ avatar, overlay }: Props) => {
  return (
    <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#f4f1ea"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.0} castShadow />
      <Suspense fallback={null}>
        <Avatar3D cfg={avatar} />
        {overlay && <ProductPlane cfg={overlay} />}
        <ContactShadows position={[0, -1.21, 0]} opacity={0.4} scale={6} blur={2} />
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls enablePan={false} minDistance={2} maxDistance={6} target={[0, 0.6, 0]} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} />
    </Canvas>
  );
};
