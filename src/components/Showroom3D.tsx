import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html, Float } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
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
 * Layout brands in a circle around the user. Works for any N.
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

/**
 * Marble archway gate. Clicking the gate (or its label) requests a camera
 * fly-through and then navigates to the brand page.
 */
const BrandGate = ({
  brand,
  position,
  rotY,
  color,
  onEnter,
}: {
  brand: BrandRow;
  position: [number, number, number];
  rotY: number;
  color: string;
  onEnter: (b: BrandRow, pos: [number, number, number], rotY: number) => void;
}) => {
  const handle = () => onEnter(brand, position, rotY);

  // arch dimensions
  const colW = 0.32;
  const colH = 3.3;
  const gap = 1.6;
  const lintelH = 0.45;

  return (
    <group position={position} rotation={[0, rotY, 0]} onClick={handle}>
      {/* Floor pad in front of gate (subtle marble step) */}
      <mesh position={[0, 0.02, 0.55]} receiveShadow>
        <boxGeometry args={[gap + colW * 2 + 0.4, 0.04, 1.0]} />
        <meshStandardMaterial color="#2a2520" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Left column */}
      <mesh position={[-(gap / 2 + colW / 2), colH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[colW, colH, colW]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
      </mesh>
      {/* Right column */}
      <mesh position={[gap / 2 + colW / 2, colH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[colW, colH, colW]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
      </mesh>
      {/* Lintel (top beam) */}
      <mesh position={[0, colH + lintelH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[gap + colW * 2 + 0.2, lintelH, colW + 0.08]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.25} />
      </mesh>
      {/* Gold trim line */}
      <mesh position={[0, colH + 0.02, colW / 2 + 0.05]}>
        <boxGeometry args={[gap + colW * 2 + 0.18, 0.025, 0.015]} />
        <meshStandardMaterial color="#caa15a" emissive="#caa15a" emissiveIntensity={0.5} />
      </mesh>

      {/* Inner archway "void" — dark warm panel suggesting a room beyond */}
      <mesh position={[0, colH / 2 + 0.1, -0.05]} receiveShadow>
        <planeGeometry args={[gap, colH - 0.2]} />
        <meshStandardMaterial color="#0a0805" roughness={1} />
      </mesh>
      {/* Soft glow inside the gate */}
      <pointLight position={[0, colH / 2, -0.4]} intensity={0.45} color="#e6c98b" distance={4} />

      {/* Brand text logo carved above */}
      <Html position={[0, colH + lintelH + 0.55, 0]} center distanceFactor={9} occlude={false}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handle();
          }}
          className="font-display tracking-[0.4em] whitespace-nowrap px-6 py-2.5 bg-background/90 backdrop-blur border border-gold/50 hover:border-gold hover:bg-gold hover:text-gold-foreground transition-all duration-500 ease-silk cursor-pointer shadow-luxe text-base"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
        >
          {brand.name.toUpperCase()}
        </button>
      </Html>

      {/* "Enter" hint floating between columns */}
      <Html position={[0, 0.7, 0.05]} center distanceFactor={10} occlude={false}>
        <div className="font-mono-ed text-[8px] tracking-[0.4em] text-gold/80 px-2 py-0.5 border border-gold/30 bg-background/70 backdrop-blur whitespace-nowrap">
          ENTER →
        </div>
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

/**
 * Drives the camera through a chosen gate and then triggers `onArrive`.
 * Uses smooth easing and disables OrbitControls while flying.
 */
const FlyThrough = ({
  target,
  controlsRef,
  onArrive,
}: {
  target: { pos: [number, number, number]; rotY: number } | null;
  controlsRef: React.MutableRefObject<any>;
  onArrive: () => void;
}) => {
  const { camera } = useThree();
  const t = useRef(0);
  const startCam = useRef<Vector3 | null>(null);
  const startTarget = useRef<Vector3 | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (target) {
      t.current = 0;
      fired.current = false;
      startCam.current = camera.position.clone();
      startTarget.current = controlsRef.current?.target?.clone() ?? new Vector3(0, 1.2, 0);
      if (controlsRef.current) controlsRef.current.enabled = false;
    } else if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  }, [target, camera, controlsRef]);

  useFrame((_, delta) => {
    if (!target || !startCam.current || !startTarget.current) return;
    t.current = Math.min(1, t.current + delta / 1.6); // ~1.6s flight
    const e = 1 - Math.pow(1 - t.current, 3); // easeOutCubic

    // Direction outward from origin to gate (normalized)
    const gx = target.pos[0];
    const gz = target.pos[2];
    const len = Math.hypot(gx, gz);
    const nx = gx / len;
    const nz = gz / len;

    // Camera glides toward a point JUST inside the gate
    const insideX = gx + nx * 0.4;
    const insideZ = gz + nz * 0.4;
    const camTargetX = startCam.current.x + (insideX - startCam.current.x) * e;
    const camTargetY = startCam.current.y + (1.4 - startCam.current.y) * e;
    const camTargetZ = startCam.current.z + (insideZ - startCam.current.z) * e;
    camera.position.set(camTargetX, camTargetY, camTargetZ);

    // Look-at smoothly transitions to the gate "interior"
    const lookX = startTarget.current.x + (gx + nx * 1.5 - startTarget.current.x) * e;
    const lookY = startTarget.current.y + (1.4 - startTarget.current.y) * e;
    const lookZ = startTarget.current.z + (gz + nz * 1.5 - startTarget.current.z) * e;
    camera.lookAt(lookX, lookY, lookZ);

    if (t.current >= 1 && !fired.current) {
      fired.current = true;
      onArrive();
    }
  });

  return null;
};

interface Props {
  avatar: AvatarConfig;
  gender?: string;
  glbUrl?: string | null;
  /** Fired when a brand gate is clicked (so the page can show a fade overlay). */
  onEnterStart?: (brandSlug: string) => void;
}

export const Showroom3D = ({ avatar, gender, glbUrl, onEnterStart }: Props) => {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [flying, setFlying] = useState<{
    brand: BrandRow;
    pos: [number, number, number];
    rotY: number;
  } | null>(null);
  const controlsRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("brands")
      .select("id,slug,name,tagline")
      .order("name")
      .then(({ data }) => setBrands((data ?? []) as BrandRow[]));
  }, []);

  const layout = layoutBrands(Math.max(brands.length, 1), 8);

  const handleEnter = (b: BrandRow, pos: [number, number, number], rotY: number) => {
    if (flying) return;
    setFlying({ brand: b, pos, rotY });
    onEnterStart?.(b.slug);
  };

  const handleArrived = () => {
    if (!flying) return;
    navigate(`/brand/${flying.brand.slug}`);
  };

  return (
    <Canvas shadows camera={{ position: [0, 2.4, 11], fov: 52 }} dpr={[1, 1.75]}>
      <color attach="background" args={["#0a0806"]} />
      <fog attach="fog" args={["#0a0806", 14, 36]} />

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
          <Avatar3D cfg={avatar} gender={gender} glbUrl={glbUrl} />
        </group>
        {brands.map((b, i) => (
          <BrandGate
            key={b.id}
            brand={b}
            position={[layout[i].x, 0, layout[i].z]}
            rotY={layout[i].rotY}
            color={BRAND_COLORS[i % BRAND_COLORS.length]}
            onEnter={handleEnter}
          />
        ))}
        <ContactShadows position={[0, 0.01, 0]} opacity={0.6} scale={20} blur={2.5} far={4} />
        <Environment preset="warehouse" />
        {flying && (
          <FlyThrough
            target={{ pos: flying.pos, rotY: flying.rotY }}
            controlsRef={controlsRef}
            onArrive={handleArrived}
          />
        )}
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={3}
        maxDistance={18}
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
