"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";

import { WaterSurface } from "@/components/water-surface";
import { Warship } from "@/components/warship";
import { WaterSplash } from "@/components/water-splash";
import { TargetMarker } from "@/components/target-marker";

export default function Page() {
	return (
		<div>
			<NavalScene />
		</div>
	)
}

export function NavalScene() {
  return (
    <div className="h-[500px] w-full">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={[4, 4, 6]}
          fov={45}
        />

        <color attach="background" args={["#030A14"]} />

        <ambientLight intensity={0.5} />

        <directionalLight
          position={[4, 8, 2]}
          intensity={2}
          color="#C6E6F5"
        />

        <WaterSurface
          size={15}
          color="#06225A"
        />

        <Warship
          position={[0, 0.15, 0]}
          rotation={[0, Math.PI / 4, 0]}
          scale={1.4}
        />

        <WaterSplash
          position={[1.5, 0, -1]}
        />

        <TargetMarker
          position={[-1.5, 0.08, 1]}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
    </div>
  );
}
