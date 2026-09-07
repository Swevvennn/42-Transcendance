"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type RadarSweepProps = {
  radius?: number;
  color?: string;
};

export function RadarSweep({
  radius = 3,
  color = "#3FABDD",
}: RadarSweepProps) {
  const sweep = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!sweep.current) return;

    sweep.current.rotation.z -= delta * 1.5;
  });

  return (
    <group rotation-x={-Math.PI / 2}>
      {/* Radar disc */}
      <mesh>
        <circleGeometry args={[radius, 64]} />
        <meshBasicMaterial
          color="#061426"
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Rings */}
      {[0.35, 0.6, 0.82].map((scale) => (
        <mesh key={scale} position-z={0.002}>
          <ringGeometry
            args={[radius * scale, radius * scale + 0.008, 64]}
          />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.25}
          />
        </mesh>
      ))}

      {/* Sweep */}
      <mesh
        ref={sweep}
        position-z={0.01}
        geometry={new THREE.CircleGeometry(radius, 32, 0, Math.PI / 7)}
      >
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
