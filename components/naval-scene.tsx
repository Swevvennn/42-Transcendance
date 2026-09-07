"use client";

import { Canvas } from "@react-three/fiber";
import { RadarSweep } from "@/components/radar-sweep";
import { WaterSurface } from "@/components/water-surface";
import { Warship } from "@/components/warship";
import { WaterSplash } from "@/components/water-splash";
import { TargetMarker } from "./target-marker";

export function LandingScene() {
  return (
    <Canvas
      camera={{
        position: [0, 7, 0],
        fov: 30,
      }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.05} />

      <RadarSweep
        radius={4}
        color="#CBFF00"
      />
    </Canvas>
  );
}

export function PlayScene() {
  return (
    <Canvas
      camera={{
        position: [0, 7, 8],
        fov: 45,
      }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.4} />

	  <TargetMarker 
		position={[0,-2,0]}
		color="#D84950"
  		size={5}
	  />

	  <directionalLight
		position={[0, 10, 0]}
		intensity={5}
		color="#CBFF00"
	  />


	  <Warship
		position = {[0, -2, 0]}
		rotation = {[0, 3, 0]}
		scale = {1.8}
		color = "#0C1100"
	    accent = "#CBFF00"
	  />
      
    </Canvas>
  );
}