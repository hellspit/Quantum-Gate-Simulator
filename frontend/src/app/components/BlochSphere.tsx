"use client";
import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
const RULE = "#34414e",
  ACCENT = "#6fe5d2";
const R = 1.28;
const DEFAULT_POSITION: [number, number, number] = [2.65, 1.85, 2.65];
export type ViewDirection = [number, number, number];
export interface BlochViewControls {
  setDirection: (direction: ViewDirection) => void;
  reset: () => void;
  zoom: (factor: number) => void;
}
interface ViewProps {
  expanded?: boolean;
  onViewReady?: (controls: BlochViewControls) => () => void;
  onRotate?: (direction: ViewDirection) => void;
}

function CameraControls({ expanded, onViewReady, onRotate }: ViewProps) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const applyingView = useRef(false);
  const { camera, invalidate } = useThree();

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || !onViewReady) return;
    // Programmatic changes must not broadcast back into the linked views.
    const update = (change: () => void) => {
      applyingView.current = true;
      try {
        change();
        orbit.update();
        invalidate();
      } finally {
        applyingView.current = false;
      }
    };
    return onViewReady({
      setDirection: (direction) =>
        update(() => {
          const distance = camera.position.length();
          camera.position
            .set(...direction)
            .normalize()
            .multiplyScalar(distance);
        }),
      reset: () =>
        update(() => {
          camera.position.set(...DEFAULT_POSITION);
          orbit.target.set(0, 0, 0);
        }),
      zoom: (factor) =>
        update(() => {
          const distance = Math.min(
            8,
            Math.max(3.6, camera.position.length() * factor),
          );
          camera.position.setLength(distance);
        }),
    });
  }, [camera, invalidate, onViewReady]);

  return (
    <OrbitControls
      ref={controls}
      enableZoom={expanded}
      enablePan={false}
      enableDamping={false}
      minDistance={3.6}
      maxDistance={8}
      onChange={() => {
        if (!applyingView.current) {
          onRotate?.(
            camera.position.clone().normalize().toArray() as ViewDirection,
          );
        }
      }}
    />
  );
}
function Scene({ rx, ry, rz }: { rx: number; ry: number; rz: number }) {
  const rings = useMemo(
    () =>
      [0, 1, 2].map((axis) =>
        Array.from({ length: 97 }, (_, i) => {
          const a = (i / 96) * Math.PI * 2;
          return (
            axis === 0
              ? [Math.cos(a), 0, Math.sin(a)]
              : axis === 1
                ? [Math.cos(a), Math.sin(a), 0]
                : [0, Math.cos(a), Math.sin(a)]
          ) as [number, number, number];
        }),
      ),
    [],
  );
  const end: [number, number, number] = [ry, rz, rx];
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 32, 24]} />
        <meshBasicMaterial
          color="#6fe5d2"
          transparent
          opacity={0.022}
          depthWrite={false}
        />
      </mesh>
      {rings.map((ring, i) => (
        <Line key={i} points={ring} color={RULE} lineWidth={1} />
      ))}
      <Line
        points={[
          [0, -1.1, 0],
          [0, 1.1, 0],
        ]}
        color={RULE}
      />
      <Line
        points={[
          [-1.1, 0, 0],
          [1.1, 0, 0],
        ]}
        color={RULE}
      />
      <Line
        points={[
          [0, 0, -1.1],
          [0, 0, 1.1],
        ]}
        color={RULE}
      />
      <Line points={[[0, 0, 0], end]} color={ACCENT} lineWidth={2.5} />
      <mesh position={end}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color={ACCENT} />
      </mesh>
      <Html center position={[0, R, 0]} className="bloch-axis-label">
        |0⟩
      </Html>
      <Html center position={[0, -R, 0]} className="bloch-axis-label">
        |1⟩
      </Html>
      <Html center position={[0, 0, R]} className="bloch-axis-label">
        |+⟩
      </Html>
      <Html center position={[0, 0, -R]} className="bloch-axis-label">
        |−⟩
      </Html>
      <Html center position={[R, 0, 0]} className="bloch-axis-label">
        |+i⟩
      </Html>
      <Html center position={[-R, 0, 0]} className="bloch-axis-label">
        |−i⟩
      </Html>
    </group>
  );
}
export default function BlochSphere({
  rx,
  ry,
  rz,
  qubitLabel,
  expanded = false,
  onViewReady,
  onRotate,
}: {
  rx: number;
  ry: number;
  rz: number;
  qubitLabel: string;
} & ViewProps) {
  return (
    <div
      className={`bloch-sphere-container ${expanded ? "bloch-sphere-expanded" : ""}`}
      role="img"
      aria-label={`Bloch sphere for qubit ${qubitLabel}: X ${rx}, Y ${ry}, Z ${rz}`}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: DEFAULT_POSITION, fov: 42 }}
        fallback={
          <div className="webgl-fallback">
            3D is unavailable in this browser. State coordinates are shown
            below.
          </div>
        }
      >
        <Scene rx={rx} ry={ry} rz={rz} />
        <CameraControls
          expanded={expanded}
          onViewReady={onViewReady}
          onRotate={onRotate}
        />
      </Canvas>
    </div>
  );
}
