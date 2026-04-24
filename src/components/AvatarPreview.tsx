import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense } from "react";
import { Avatar3D } from "./Avatar3D";
import { AvatarConfig } from "@/lib/avatar";

export const AvatarPreview = ({ cfg, bodyScale = 1, gender }: { cfg: AvatarConfig; bodyScale?: number; gender?: string }) => {
  return (
    <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45 }} dpr={[1, 1.75]}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 3]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 3, -2]} intensity={0.4} color="#d4a85a" />
      <Suspense fallback={null}>
        <Avatar3D cfg={cfg} bodyScale={bodyScale} gender={gender} />
        <ContactShadows position={[0, -1.2, 0]} opacity={0.5} scale={6} blur={2.5} />
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={6}
        target={[0, 0.5, 0]}
        enableDamping
        rotateSpeed={0.7}
        touches={{ ONE: 0, TWO: 2 }}
      />
    </Canvas>
  );
};
