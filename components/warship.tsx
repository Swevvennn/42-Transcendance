"use client";

import { Float } from "@react-three/drei";

type WarshipProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
  accent?: string;
};

export function Warship({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color = "#0D1B2A",
  accent = "#3FABDD",
}: WarshipProps) {
  return (
    <Float
      speed={1.2}
      rotationIntensity={0.08}
      floatIntensity={0.06}
    >
      <group position={position} rotation={rotation} scale={scale}>
        {/* Hull */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.42, 0.18, 1.6]} />
          <meshStandardMaterial
            color={color}
            roughness={0.7}
            metalness={0.5}
          />
        </mesh>

        {/* Bow */}
        {/* <mesh position={[0, 0.18, -0.95]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.22, 0.45, 4]} />
          <meshStandardMaterial
            color={color}
            roughness={0.7}
            metalness={0.5}
          />
        </mesh> */}

        {/* Command tower */}
        <mesh position={[0, 0.4, 0.05]}>
          <boxGeometry args={[0.22, 0.25, 0.4]} />
          <meshStandardMaterial
            color="#172B3A"
            roughness={0.55}
            metalness={0.65}
          />
        </mesh>

        {/* Radar */}
        <mesh position={[0, 0.58, 0.08]}>
          <cylinderGeometry args={[0.025, 0.025, 0.25, 8]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={1.5}
          />
        </mesh>

        {/* Gun */}
        <mesh position={[0, 0.48, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.35, 8]} />
          <meshStandardMaterial color="#263746" />
        </mesh>

        {/* Navigation lights */}
        <mesh position={[0.23, 0.28, -0.5]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color={accent} />
        </mesh>
      </group>
    </Float>
  );
}
