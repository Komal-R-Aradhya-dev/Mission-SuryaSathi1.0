"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { sceneBridge, scriptedHour, sunVector } from "@/lib/scene/sceneBridge";

export function SolarRig({
  detail,
  pinnedHour,
}: {
  detail: "full" | "lite";
  pinnedHour: number | null;
}) {
  const light = useRef<THREE.DirectionalLight>(null);
  const orb = useRef<THREE.Group>(null);
  const { scene } = useThree();
  const lastHour = useRef(0);

  useLayoutEffect(() => {
    const current = light.current;
    if (!current) return;
    current.target.position.set(0, 0.45, 0);
    scene.add(current.target);
    return () => {
      scene.remove(current.target);
    };
  }, [scene]);

  useFrame(() => {
    const hour = pinnedHour ?? (sceneBridge.reducedMotion ? 8.4 : scriptedHour(sceneBridge.scroll));
    if (Math.abs(hour - lastHour.current) > 0.08) {
      lastHour.current = hour;
      sceneBridge.hour = hour;
      sceneBridge.emit();
    }
    const [x, y, z] = sunVector(hour);
    orb.current?.position.set(x, y, z);
    if (light.current) {
      light.current.position.set(x, y, z);
      light.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      <ambientLight intensity={0.62} color="#fff4e4" />
      <hemisphereLight args={["#d7ecff", "#8faf78", 0.72]} />
      <directionalLight
        ref={light}
        intensity={2.35}
        color="#ffe0a8"
        castShadow={detail === "full"}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.00035}
      />
      <group ref={orb}>
        <mesh>
          <sphereGeometry args={[0.62, detail === "full" ? 40 : 18, detail === "full" ? 40 : 18]} />
          <meshBasicMaterial color="#ffe1a3" toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.25, 24, 24]} />
          <meshBasicMaterial color="#ffb020" transparent opacity={0.16} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.35, 24, 24]} />
          <meshBasicMaterial color="#e08912" transparent opacity={0.07} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0.2, 0.4]}>
          <torusGeometry args={[1.7, 0.012, 8, 64]} />
          <meshBasicMaterial color="#f0a202" transparent opacity={0.45} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
