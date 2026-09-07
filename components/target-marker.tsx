"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type TargetMarkerProps = {
  position?: [number, number, number];
  color?: string;
  size?: number;
};

export function TargetMarker({
  position = [0, 0.05, 0],
  color = "#D84950",
  size = 0.7,
}: TargetMarkerProps) {
  const ring = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ring.current) return;

    const pulse = 1 + Math.sin(clock.elapsedTime * 5) * 0.08;

    ring.current.scale.setScalar(pulse);
    ring.current.rotation.y += 0.015;
  });

  return (
    <group position={position}>
      <mesh
        ref={ring}
        rotation-x={-Math.PI / 2}
      >
        <ringGeometry args={[size * 0.38, size * 0.46, 4]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      <pointLight
        color={color}
        intensity={2}
        distance={2}
      />
    </group>
  );
}
