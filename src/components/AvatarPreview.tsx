import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense } from "react";
import { Avatar3D } from "./Avatar3D";
import { AvatarConfig } from "@/lib/avatar";

export const AvatarPreview = ({
  cfg,
  bodyScale = 1,
  gender,
  glbUrl,
}: {
  cfg: AvatarConfig;
  bodyScale?: number;
  gender?: string;
  glbUrl?: string | null;
}) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.4, 3.8], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      {/* Hyper-clean showroom: pure white seamless cyc + soft key/fill/rim */}
      <color attach="background" args={["#f6f6f4"]} />
      <fog attach="fog" args={["#f6f6f4", 8, 18]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 4]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 3, 2]} intensity={0.55} />
      <directionalLight position={[0, 4, -5]} intensity={0.7} color="#ffffff" />
      <Suspense fallback={null}>
        <Avatar3D cfg={cfg} bodyScale={bodyScale} gender={gender} glbUrl={glbUrl} />
        {/* seamless cyc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#f6f6f4" roughness={0.95} />
        </mesh>
        <ContactShadows position={[0, -1.199, 0]} opacity={0.45} scale={8} blur={2.8} far={4} />
        <Environment preset="city" />
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
