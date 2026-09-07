"use client";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

type WaterSurfaceProps = {
  size?: number;
  color?: string;
  opacity?: number;
};

export function WaterSurface({
  size = 20,
  color = "#06225A",
  opacity = 0.82,
}: WaterSurfaceProps) {
  const mesh = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, 80, 80);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [size]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;

    const position = mesh.current.geometry.attributes.position;
    const time = clock.elapsedTime;

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);

      const wave =
        Math.sin(x * 0.65 + time * 1.2) * 0.035 +
        Math.cos(z * 0.8 + time * 0.9) * 0.025 +
        Math.sin((x + z) * 0.35 + time) * 0.02;

      position.setY(i, wave);
    }

    position.needsUpdate = true;
    mesh.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={mesh} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.25}
        metalness={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
