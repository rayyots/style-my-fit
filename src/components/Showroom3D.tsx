import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html, Float } from "@react-three/drei";
import { Suspense } from "react";
import { Avatar3D } from "./Avatar3D";
import { AvatarConfig } from "@/lib/avatar";
import { useNavigate } from "react-router-dom";

const BRANDS = [
  { id: "noir", name: "MAISON NOIR", position: [-4.5, 0, -2] as [number, number, number], color: "#0a0a0a" },
  { id: "lumen", name: "LUMEN", position: [0, 0, -5] as [number, number, number], color: "#e8e6df" },
  { id: "void", name: "VOID/STUDIO", position: [4.5, 0, -2] as [number, number, number], color: "#2b2b2b" },
];

const BrandPlinth = ({ brand }: { brand: typeof BRANDS[0] }) => {
  const navigate = useNavigate();
  return (
    <group position={brand.position}>
      {/* Plinth */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.3, 1.4]} />
        <meshStandardMaterial color={brand.color} roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Backdrop wall */}
      <mesh position={[0, 1.6, -0.7]} receiveShadow>
        <planeGeometry args={[2.2, 2.6]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.95} />
      </mesh>
      {/* Mannequin silhouette */}
      <Float speed={1.5} floatIntensity={0.2} rotationIntensity={0.1}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <capsuleGeometry args={[0.22, 1.2, 8, 16]} />
          <meshStandardMaterial color={brand.id === "lumen" ? "#1a1a1a" : "#fafaf6"} roughness={0.4} />
        </mesh>
      </Float>
      {/* Brand label */}
      <Html position={[0, 2.9, 0]} center distanceFactor={8} occlude={false}>
        <button
          onClick={() => navigate(`/brand/${brand.id}`)}
          className="font-display text-sm tracking-[0.3em] whitespace-nowrap px-4 py-2 bg-background/90 backdrop-blur border border-foreground/10 hover:bg-accent hover:text-accent-foreground transition-all duration-500 ease-silk cursor-pointer"
        >
          {brand.name} →
        </button>
      </Html>
    </group>
  );
};

const Floor = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
    <planeGeometry args={[40, 40]} />
    <meshStandardMaterial color="#ebe6dc" roughness={0.85} />
  </mesh>
);

interface Props {
  avatar: AvatarConfig;
}

export const Showroom3D = ({ avatar }: Props) => {
  return (
    <Canvas shadows camera={{ position: [0, 2.2, 6], fov: 50 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#f4f1ea"]} />
      <fog attach="fog" args={["#f4f1ea", 10, 25]} />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <spotLight position={[0, 6, 2]} angle={0.5} penumbra={0.8} intensity={0.6} castShadow />

      <Suspense fallback={null}>
        <Floor />
        {/* User avatar at center */}
        <group position={[0, 0, 1.5]}>
          <Avatar3D cfg={avatar} />
        </group>
        {BRANDS.map((b) => (
          <BrandPlinth key={b.id} brand={b} />
        ))}
        <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={20} blur={2} far={4} />
        <Environment preset="studio" />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={12}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 1.2, 0]}
      />
    </Canvas>
  );
};
