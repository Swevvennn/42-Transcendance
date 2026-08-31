"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Warship() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // =========================================================
    // SCENE
    // =========================================================

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x050a06);

    // =========================================================
    // CAMERA
    // =========================================================

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );

    // Vue en plongée
    camera.position.set(5.5, 7.5, 6.5);

    camera.lookAt(0, 0, 0);

    // =========================================================
    // RENDERER
    // =========================================================

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
      container.clientWidth,
      container.clientHeight
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type =
      THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    container.appendChild(
      renderer.domElement
    );

    // =========================================================
    // BATEAU
    // =========================================================

    const ship = new THREE.Group();

    // Petit pion
    ship.scale.set(
      0.65,
      0.65,
      0.65
    );

    // Position initiale dans l'eau
    ship.position.y = -0.38;

    scene.add(ship);

    // =========================================================
    // COULEURS
    // =========================================================

    const hullMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x7fa600,
        roughness: 0.62,
        metalness: 0.22,
      });

    const darkMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x6b8c00,
        roughness: 0.55,
        metalness: 0.3,
      });

    const deckMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x8baa00,
        roughness: 0.72,
        metalness: 0.15,
      });

    const detailMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x94b800,
        roughness: 0.55,
        metalness: 0.2,
      });

    const windowMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x4f6900,
        roughness: 0.2,
        metalness: 0.65,
      });

    // =========================================================
    // COQUE
    // =========================================================

    const hullGeometry =
      new THREE.CapsuleGeometry(
        0.78,
        2.6,
        5,
        12
      );

    const hull = new THREE.Mesh(
      hullGeometry,
      hullMaterial
    );

    hull.rotation.x =
      Math.PI / 2;

    hull.scale.set(
      1,
      0.42,
      1.55
    );

    hull.castShadow = true;
    hull.receiveShadow = true;

    ship.add(hull);

    // =========================================================
    // PONT
    // =========================================================

    const deckGeometry =
      new THREE.BoxGeometry(
        1.25,
        0.16,
        3.7
      );

    const deck = new THREE.Mesh(
      deckGeometry,
      deckMaterial
    );

    deck.position.y = 0.27;

    deck.castShadow = true;

    ship.add(deck);

    // =========================================================
    // BAS DE LA COQUE
    // =========================================================

    const lowerHull =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.15,
          0.18,
          3.15
        ),
        darkMaterial
      );

    lowerHull.position.y = 0.02;

    lowerHull.castShadow = true;

    ship.add(lowerHull);

    // =========================================================
    // CABINE
    // =========================================================

    const cabin =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.78,
          0.55,
          0.9
        ),
        detailMaterial
      );

    cabin.position.set(
      0,
      0.58,
      0.35
    );

    cabin.castShadow = true;

    ship.add(cabin);

    // =========================================================
    // VITRE
    // =========================================================

    const frontWindow =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.55,
          0.16,
          0.03
        ),
        windowMaterial
      );

    frontWindow.position.set(
      0,
      0.7,
      -0.12
    );

    ship.add(frontWindow);

    // =========================================================
    // CHEMINÉE
    // =========================================================

    const chimney =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.17,
          0.22,
          0.62,
          8
        ),
        darkMaterial
      );

    chimney.position.set(
      0,
      1.02,
      0.85
    );

    chimney.castShadow = true;

    ship.add(chimney);

    // =========================================================
    // TOURELLE AVANT
    // =========================================================

    const turret =
      new THREE.Group();

    turret.position.set(
      0,
      0.52,
      -1.05
    );

    ship.add(turret);

    const turretBase =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.4,
          0.47,
          0.25,
          8
        ),
        darkMaterial
      );

    turretBase.castShadow = true;

    turret.add(turretBase);

    // =========================================================
    // DOUBLE CANON
    // =========================================================

    const cannonGeometry =
      new THREE.CylinderGeometry(
        0.065,
        0.075,
        0.9,
        8
      );

    for (const x of [-0.13, 0.13]) {
      const cannon =
        new THREE.Mesh(
          cannonGeometry,
          darkMaterial
        );

      cannon.rotation.x =
        Math.PI / 2;

      cannon.position.set(
        x,
        0.08,
        -0.43
      );

      cannon.castShadow = true;

      turret.add(cannon);
    }

    // =========================================================
    // TOURELLE ARRIÈRE
    // =========================================================

    const rearTurret =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.3,
          0.36,
          0.22,
          8
        ),
        darkMaterial
      );

    rearTurret.position.set(
      0,
      0.48,
      1.25
    );

    rearTurret.castShadow = true;

    ship.add(rearTurret);

    // =========================================================
    // MAT
    // =========================================================

    const mast =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.035,
          0.05,
          1.15,
          6
        ),
        darkMaterial
      );

    mast.position.set(
      0,
      1.45,
      0.05
    );

    mast.castShadow = true;

    ship.add(mast);

    // =========================================================
    // RADAR
    // =========================================================

    const radarBar =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.9,
          0.035,
          0.07
        ),
        darkMaterial
      );

    radarBar.position.set(
      0,
      1.75,
      0.05
    );

    ship.add(radarBar);

    // =========================================================
    // ANTENNES
    // =========================================================

    for (const x of [-0.25, 0.25]) {
      const antenna =
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.015,
            0.015,
            0.45,
            6
          ),
          darkMaterial
        );

      antenna.position.set(
        x,
        1.62,
        0.05
      );

      ship.add(antenna);
    }

    // =========================================================
    // EAU
    // =========================================================

    const waterMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x07130a,
        roughness: 0.32,
        metalness: 0.12,
      });

    const water =
      new THREE.Mesh(
        new THREE.CircleGeometry(
          6,
          64
        ),
        waterMaterial
      );

    water.rotation.x =
      -Math.PI / 2;

    water.position.y =
      -0.58;

    water.receiveShadow = true;

    scene.add(water);

    // =========================================================
    // PETITE TRACE D'EAU
    // =========================================================

    const wakeGroup = new THREE.Group();

    wakeGroup.position.y = -0.50;

    scene.add(wakeGroup);

    // Couleur très proche de l'arrière-plan
    // pour que la trace se fonde naturellement
    const wakeMaterial =
      new THREE.MeshBasicMaterial({
        color: 0x17300d,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

    // =========================================================
    // TRACE PRINCIPALE
    // =========================================================

    const wakeGeometry =
      new THREE.PlaneGeometry(
        1.15,
        2.4
      );

    const wake = new THREE.Mesh(
      wakeGeometry,
      wakeMaterial
    );

    wake.rotation.x =
      -Math.PI / 2;

    // Forme très allongée
    wake.scale.set(
      0.8,
      1,
      1
    );

    wake.position.set(
      0,
      0,
      1.35
    );

    wakeGroup.add(wake);

    // =========================================================
    // PETITE TRACE CENTRALE
    // =========================================================

    const centerWakeMaterial =
      new THREE.MeshBasicMaterial({
        color: 0x244817,
        transparent: true,
        opacity: 0.13,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

    const centerWake =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          0.45,
          1.8
        ),
        centerWakeMaterial
      );

    centerWake.rotation.x =
      -Math.PI / 2;

    centerWake.position.set(
      0,
      0.003,
      1.25
    );

    wakeGroup.add(centerWake);

    // =========================================================
    // PETITES ONDULATIONS
    // =========================================================

    const rippleMaterial =
      new THREE.MeshBasicMaterial({
        color: 0x31551b,
        transparent: true,
        opacity: 0.11,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

    const ripples: THREE.Mesh[] = [];

    for (let i = 0; i < 3; i++) {
      const ripple =
        new THREE.Mesh(
          new THREE.PlaneGeometry(
            0.7 - i * 0.12,
            0.18
          ),
          rippleMaterial.clone()
        );

      ripple.rotation.x =
        -Math.PI / 2;

      ripple.position.set(
        0,
        0.006,
        0.85 + i * 0.55
      );

      wakeGroup.add(ripple);

      ripples.push(ripple);
    }

    // =========================================================
    // ANIMATION DE LA TRACE
    // =========================================================

    const animateWake = (
      elapsed: number
    ) => {
      // La trace respire très légèrement
      const pulse =
        Math.sin(elapsed * 1.2);

      wake.scale.x =
        0.78 + pulse * 0.04;

      centerWake.scale.x =
        1 + pulse * 0.05;

      // Les petites ondulations
      // s'étirent progressivement
      ripples.forEach(
        (ripple, index) => {
          const wave =
            Math.sin(
              elapsed * 1.4 +
              index * 1.5
            );

          ripple.scale.x =
            1 + wave * 0.12;

          const material =
            ripple.material as THREE.MeshBasicMaterial;

          material.opacity =
            0.06 +
            (wave + 1) * 0.025;
        }
      );
    };

    // =======================================================
    // RENDER
    // =======================================================

    renderer.render(
      scene,
      camera
    );

    let animationFrame: number;
    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    // =========================================================
    // RESIZE
    // =========================================================

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    // =========================================================
    // CLEANUP
    // =========================================================

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener("resize", handleResize);

      renderer.dispose();

      // Géométries du bateau
      hullGeometry.dispose();
      deckGeometry.dispose();
      cannonGeometry.dispose();

      // Matériaux
      hullMaterial.dispose();
      darkMaterial.dispose();
      deckMaterial.dispose();
      detailMaterial.dispose();
      windowMaterial.dispose();

      water.geometry.dispose();
      waterMaterial.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    />
  );
}