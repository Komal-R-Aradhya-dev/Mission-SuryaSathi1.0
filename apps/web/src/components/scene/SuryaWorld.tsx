"use client";

import { useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { sampleCamera, sceneBridge } from "@/lib/scene/sceneBridge";
import { SolarRig } from "@/components/scene/SolarRig";
import { Terrace } from "@/components/scene/Terrace";

export function SuryaWorld({
  detail,
  pinnedHour,
}: {
  detail: "full" | "lite";
  pinnedHour: number | null;
}) {
  useFrame(({ camera, clock, size }) => {
    const reduced = sceneBridge.reducedMotion;
    const progress = reduced ? 0 : sceneBridge.scroll;
    const shot = sampleCamera(progress);
    const idle = reduced ? 0 : Math.sin(clock.elapsedTime * 0.28) * 0.05 * (1 - Math.min(1, progress * 10));
    const narrow = size.width < 768;
    const nextX = shot.pos[0] * (narrow ? 0.94 : 1) + idle;
    const nextY = shot.pos[1] + (narrow ? 1.5 : 0);
    const nextZ = shot.pos[2] * (narrow ? 0.94 : 1);
    const blend = reduced ? 1 : 0.08;
    camera.position.x += (nextX - camera.position.x) * blend;
    camera.position.y += (nextY - camera.position.y) * blend;
    camera.position.z += (nextZ - camera.position.z) * blend;
    camera.lookAt(shot.look[0], shot.look[1] - (narrow ? 1.25 : 0), shot.look[2]);
  });

  return (
    <>
      <color attach="background" args={["#d5e4ee"]} />
      <fog attach="fog" args={["#e7dcc8", 30, 56]} />
      <DaySky />
      <SolarRig detail={detail} pinnedHour={pinnedHour} />
      <RevealTerrace detail={detail} />
      {detail === "full" ? <BlueprintGrid /> : null}
    </>
  );
}

function DaySky() {
  return (
    <mesh frustumCulled={false}>
      <sphereGeometry args={[42, 28, 20]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
        vertexShader={`
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vPos;
          void main() {
            float h = normalize(vPos).y;
            vec3 zenith = vec3(0.42, 0.62, 0.76);
            vec3 mid = vec3(0.78, 0.86, 0.90);
            vec3 horizon = vec3(0.96, 0.90, 0.80);
            vec3 below = vec3(0.73, 0.70, 0.62);
            vec3 color = h > 0.0
              ? mix(horizon, mix(mid, zenith, smoothstep(0.05, 0.62, h)), smoothstep(0.0, 0.28, h))
              : mix(horizon, below, smoothstep(0.0, -0.2, h));
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
}

function BlueprintGrid() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const opacity = sceneBridge.reducedMotion ? 0.15 : Math.max(0, 1 - sceneBridge.scroll / 0.26);
    mesh.visible = opacity > 0.05;
  });
  return (
    <Grid
      ref={ref}
      position={[0, 0.2, 0]}
      args={[16, 12]}
      cellSize={0.5}
      cellThickness={0.45}
      cellColor="#f0a202"
      sectionSize={2.5}
      sectionThickness={1}
      sectionColor="#c46b12"
      fadeDistance={14}
      fadeStrength={1.5}
      followCamera={false}
      infiniteGrid={false}
    />
  );
}

function RevealTerrace({ detail }: { detail: "full" | "lite" }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const reveal = sceneBridge.reducedMotion ? 1 : Math.min(1, Math.max(0, (sceneBridge.scroll - 0.02) / 0.2));
    if (!group.current) return;
    group.current.traverse((node) => {
      const mesh = node as THREE.Mesh;
      const material = mesh.material;
      if (!material || Array.isArray(material)) return;
      if (material instanceof THREE.LineBasicMaterial) {
        material.opacity = Math.max(0.05, (1 - reveal) * 0.85);
      }
    });
  });
  const reveal = sceneBridge.reducedMotion ? 1 : 0.15;
  return (
    <group ref={group}>
      <Terrace detail={detail} reveal={reveal} />
    </group>
  );
}
