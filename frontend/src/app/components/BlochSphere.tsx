"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Line, Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface BlochSphereProps {
  rx: number;
  ry: number;
  rz: number;
  qubitLabel: string;
}

function Arrow({ end }: { end: THREE.Vector3 }) {
  const ref = useRef<THREE.Group>(null);
  
  return (
    <group ref={ref}>
      {/* Line from origin to point */}
      <Line
        points={[[0, 0, 0], [end.x, end.y, end.z]]}
        color="#00f0ff"
        lineWidth={3}
      />
      {/* Arrowhead */}
      <mesh position={[end.x, end.y, end.z]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#00f0ff" />
      </mesh>
    </group>
  );
}

function BlochSphereScene({ rx, ry, rz, qubitLabel }: BlochSphereProps) {
  // Map Quantum Physics (x,y,z) to ThreeJS (x,y,z)
  // Physics: z is up
  // ThreeJS: y is up
  // So: three.y = rz, three.x = ry, three.z = rx
  const vector = new THREE.Vector3(ry, rz, rx);
  
  return (
    <group>
      {/* The transparent sphere */}
      <Sphere args={[1, 32, 32]}>
        <meshStandardMaterial
          color="#ffffff"
          opacity={0.15}
          transparent
          roughness={0.1}
          metalness={0.8}
        />
      </Sphere>
      
      {/* Wireframe equator and meridians */}
      <Sphere args={[1, 16, 16]}>
        <meshBasicMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={0.1}
        />
      </Sphere>

      {/* Axis Lines */}
      {/* Z Axis (Vertical in ThreeJS Y) */}
      <Line points={[[0, -1.2, 0], [0, 1.2, 0]]} color="#555555" lineWidth={1} />
      {/* X Axis (ThreeJS Z) */}
      <Line points={[[0, 0, -1.2], [0, 0, 1.2]]} color="#555555" lineWidth={1} />
      {/* Y Axis (ThreeJS X) */}
      <Line points={[[-1.2, 0, 0], [1.2, 0, 0]]} color="#555555" lineWidth={1} />

      {/* State Vector */}
      <Arrow end={vector} />

      {/* Labels */}
      <Text position={[0, 1.3, 0]} fontSize={0.2} color="#ffffff">|0⟩</Text>
      <Text position={[0, -1.3, 0]} fontSize={0.2} color="#ffffff">|1⟩</Text>
      <Text position={[0, 0, 1.3]} fontSize={0.15} color="#aaaaaa">|+⟩</Text>
      <Text position={[1.3, 0, 0]} fontSize={0.15} color="#aaaaaa">|+i⟩</Text>

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} />
    </group>
  );
}

export default function BlochSphere(props: BlochSphereProps) {
  return (
    <div className="bloch-sphere-container" style={{ width: '100%', height: '200px', position: 'relative' }}>
        <h4 style={{ position: 'absolute', top: 0, left: 10, zIndex: 10, color: '#aaa', fontSize: '0.9rem' }}>
            Qubit {props.qubitLabel}
        </h4>
        <Canvas camera={{ position: [2, 1.5, 2], fov: 45 }}>
            <BlochSphereScene {...props} />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2.0} />
        </Canvas>
    </div>
  );
}
