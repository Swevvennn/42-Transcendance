"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type WaterSplashProps = {
  position?: [number, number, number];
  color?: string;
  count?: number;
};

export function WaterSplash({
  position = [0, 0, 0],
  color = "#3FABDD",
  count = 45,
}: WaterSplashProps) {
  const points = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 0.35,
        Math.random() * 0.15,
        (Math.random() - 0.5) * 0.35
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.025,
        Math.random() * 0.09 + 0.035,
        (Math.random() - 0.5) * 0.025
      ),
    }));
  }, [count]);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);

    particles.forEach((particle, i) => {
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    return geo;
  }, [particles, count]);

  useFrame(() => {
    if (!points.current) return;

    const position = points.current.geometry.attributes.position;

    particles.forEach((particle, i) => {
      particle.velocity.y -= 0.003;

      particle.position.add(particle.velocity);

      if (particle.position.y < 0) {
        particle.position.set(
          (Math.random() - 0.5) * 0.35,
          0,
          (Math.random() - 0.5) * 0.35
        );

        particle.velocity.y = Math.random() * 0.08 + 0.04;
      }

      position.setXYZ(
        i,
        particle.position.x,
        particle.position.y,
        particle.position.z
      );
    });

    position.needsUpdate = true;
  });

  return (
    <group position={position}>
      <points ref={points} geometry={geometry}>
        <pointsMaterial
          color={color}
          size={0.045}
          transparent
          opacity={0.85}
          sizeAttenuation
        />
      </points>

      <mesh rotation-x={-Math.PI / 2} position-y={0.002}>
        <ringGeometry args={[0.05, 0.45, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
