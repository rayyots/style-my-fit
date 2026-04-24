import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html, Float, Text3D, Center } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import { Avatar3D } from "./Avatar3D";
import { AvatarConfig } from "@/lib/avatar";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface BrandRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
}

const BRAND_COLORS = [
  "#1a1a1a", "#2b2b2b", "#3d3328", "#1f1a14", "#0f1820",
  "#2a1f1a", "#1c1c1c", "#3a2e22", "#1e1814", "#262019",
  "#1a1a1f", "#23201a", "#2c241a", "#1d1a17", "#221c14",
];

/**
 * Layout brands in a circle around the user. Works for any N (we'll pass 15).
 */
const layoutBrands = (n: number, radius: number) => {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.cos(t) * radius,
      z: Math.sin(t) * radius,
      rotY: -t - Math.PI / 2,
    };
  });
};

const BrandPlinth = ({
  brand,
  position,
  rotY,
  color,
}: {
  brand: BrandRow;
  position: [number, number, number];
  rotY: number;
  color: string;
}) => {
  const navigate = useNavigate();
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Plinth */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.36, 1.5]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      {/* Backdrop wall — luxury panel with subtle gold edge */}
      <mesh position={[0, 1.7, -0.78]} receiveShadow>
        <planeGeometry args={[2.4, 2.9]} />
        <meshStandardMaterial color="#1a1612" roughness={0.95} />
      </mesh>
      {/* Gold trim */}
      <mesh position={[0, 0.36, -0.78]}>
        <boxGeometry args={[2.4, 0.005, 0.005]} />
        <meshStandardMaterial color="#caa15a" emissive="#caa15a" emissiveIntensity={0.3} />
      </mesh>
      {/* Mannequin silhouette */}
      <Float speed={1.2} floatIntensity={0.18} rotationIntensity={0.06}>
        <mesh position={[0, 1.35, 0]} castShadow>
          <capsuleGeometry args={[0.24, 1.3, 8, 16]} />
          <meshStandardMaterial color="#d4b88a" roughness={0.4} metalness={0.05} />
        </mesh>
      </Float>
      {/* Brand label */}
      <Html position={[0, 3.0, 0]} center distanceFactor={9} occlude={false}>
        <button
          onClick={() => navigate(`/brand/${brand.slug}`)}
          className="font-display text-base tracking-[0.3em] whitespace-nowrap px-5 py-2.5 bg-background/95 backdrop-blur border border-gold/40 hover:border-gold hover:bg-gold hover:text-gold-foreground transition-all duration-500 ease-silk cursor-pointer shadow-luxe"
        >
          {brand.name.toUpperCase()} →
        </button>
      </Html>
    </group>
  );
};

const Floor = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
    <circleGeometry args={[30, 64]} />
    <meshStandardMaterial color="#15110d" roughness={0.7} metalness={0.1} />
  </mesh>
);

interface Props {
  avatar: AvatarConfig;
  gender?: string;
}

export const Showroom3D = ({ avatar, gender }: Props) => {
  const [brands, setBrands] = useState<BrandRow[]>([]);

  useEffect(() => {
    supabase
      .from("brands")
      .select("id,slug,name,tagline")
      .order("name")
      .then(({ data }) => setBrands((data ?? []) as BrandRow[]));
  }, []);

  const layout = layoutBrands(Math.max(brands.length, 1), 7);

  return (
    <Canvas shadows camera={{ position: [0, 2.4, 9], fov: 50 }} dpr={[1, 1.75]}>
      <color attach="background" args={["#0a0806"]} />
      <fog attach="fog" args={["#0a0806", 12, 32]} />

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[8, 10, 6]}
        intensity={1.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <spotLight position={[0, 8, 2]} angle={0.45} penumbra={0.85} intensity={0.8} color="#e6c98b" castShadow />
      <pointLight position={[0, 1, 0]} intensity={0.4} color="#caa15a" />

      <Suspense fallback={null}>
        <Floor />
        {/* User avatar at center */}
        <group position={[0, 0, 0]}>
          <Avatar3D cfg={avatar} gender={gender} />
        </group>
        {brands.map((b, i) => (
          <BrandPlinth
            key={b.id}
            brand={b}
            position={[layout[i].x, 0, layout[i].z]}
            rotY={layout[i].rotY}
            color={BRAND_COLORS[i % BRAND_COLORS.length]}
          />
        ))}
        <ContactShadows position={[0, 0.01, 0]} opacity={0.6} scale={20} blur={2.5} far={4} />
        <Environment preset="warehouse" />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={16}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1.2, 0]}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        touches={{ ONE: 0, TWO: 2 }}
      />
    </Canvas>
  );
};
