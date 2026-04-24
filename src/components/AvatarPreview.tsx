import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense } from "react";
import { Avatar3D } from "./Avatar3D";
import { AvatarConfig } from "@/lib/avatar";

export const AvatarPreview = ({ cfg, bodyScale = 1 }: { cfg: AvatarConfig; bodyScale?: number }) => {
  return (
    <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#f4f1ea"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 3]} intensity={1.1} castShadow />
      <Suspense fallback={null}>
        <Avatar3D cfg={cfg} bodyScale={bodyScale} />
        <ContactShadows position={[0, -1.2, 0]} opacity={0.45} scale={6} blur={2} />
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls enablePan={false} minDistance={2.5} maxDistance={6} target={[0, 0.5, 0]} />
    </Canvas>
  );
};
