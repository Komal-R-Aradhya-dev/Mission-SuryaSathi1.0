"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useSyncExternalStore } from "react";
import type { AnalysisDraft } from "@/lib/analysis/draft";
import { sunVector } from "@/lib/scene/sceneBridge";
import { SunTimeControl } from "@/components/analyze/SunTimeControl";

function subscribeWebgl() {
  return () => undefined;
}

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function read(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function SolarTwin({
  draft,
  onSunHour,
}: {
  draft: AnalysisDraft;
  onSunHour: (hour: number) => void;
}) {
  const webgl = useSyncExternalStore(subscribeWebgl, webglAvailable, () => true);

  const length = read(draft.terrace.length_m);
  const width = read(draft.terrace.width_m);
  const ready = length !== null && width !== null && length > 0 && width > 0;

  const obstacles = useMemo(() => {
    if (!ready || length === null || width === null) return [];
    return draft.terrace.obstacles.flatMap((obstacle) => {
      const x = read(obstacle.x_offset_m);
      const y = read(obstacle.y_offset_m);
      const w = read(obstacle.width_m);
      const l = read(obstacle.length_m);
      const h = read(obstacle.height_m);
      if (x === null || y === null || w === null || l === null || h === null) return [];
      if (x < 0 || y < 0 || w <= 0 || l <= 0 || h <= 0) return [];
      if (x + w > length + 0.001 || y + l > width + 0.001) return [];
      return [{ x, y, w, l, h, id: obstacle.id }];
    });
  }, [draft.terrace.obstacles, length, ready, width]);

  return (
    <aside className="space-y-4 rounded-3xl border border-white/10 bg-ink-2/60 p-4">
      <div>
        <h2 className="text-sm tracking-[0.16em] text-amber uppercase">Geometry preview</h2>
        <p className="mt-2 text-xs leading-5 text-ivory-dim">
          This drawing follows the metres you type. It does not place modules and it does not estimate annual generation. Drag to orbit. The page still scrolls; zoom on the model is off so the wheel is not captured.
        </p>
      </div>
      <div className="relative h-72 overflow-hidden rounded-2xl bg-[#07110e]">
        {!ready ? (
          <p className="grid h-full place-items-center px-6 text-center text-sm text-ivory-dim">
            Enter a length and width to see the terrace plan.
          </p>
        ) : webgl ? (
          <Canvas camera={{ position: [0, Math.max(length ?? 1, width ?? 1) * 0.85, (width ?? 1) * 1.15], fov: 40 }}>
            <color attach="background" args={["#07110e"]} />
            <ambientLight intensity={0.45} />
            <TwinLight hour={draft.sunHour} />
            <TwinRoof length={length ?? 1} width={width ?? 1} obstacles={obstacles} />
            <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2.15} />
          </Canvas>
        ) : (
          <Plan length={length ?? 1} width={width ?? 1} obstacles={obstacles} />
        )}
      </div>
      <SunTimeControl id="twin-sun-hour" hour={draft.sunHour} onChange={onSunHour} />
    </aside>
  );
}

function TwinLight({ hour }: { hour: number }) {
  const [x, y, z] = sunVector(hour);
  return <directionalLight position={[x, y, z]} intensity={2} color="#ffc56b" />;
}

function TwinRoof({
  length,
  width,
  obstacles,
}: {
  length: number;
  width: number;
  obstacles: { id: string; x: number; y: number; w: number; l: number; h: number }[];
}) {
  return (
    <group>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[length, 0.18, width]} />
        <meshStandardMaterial color="#6e675c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.45, -width / 2]}>
        <boxGeometry args={[length, 0.7, 0.1]} />
        <meshStandardMaterial color="#7c7468" />
      </mesh>
      <mesh position={[0, 0.45, width / 2]}>
        <boxGeometry args={[length, 0.7, 0.1]} />
        <meshStandardMaterial color="#7c7468" />
      </mesh>
      {obstacles.map((obstacle) => {
        const cx = -length / 2 + obstacle.x + obstacle.w / 2;
        const cz = width / 2 - obstacle.y - obstacle.l / 2;
        return (
          <mesh key={obstacle.id} position={[cx, obstacle.h / 2 + 0.09, cz]}>
            <boxGeometry args={[obstacle.w, obstacle.h, obstacle.l]} />
            <meshStandardMaterial color="#1a3148" />
          </mesh>
        );
      })}
    </group>
  );
}

function Plan({
  length,
  width,
  obstacles,
}: {
  length: number;
  width: number;
  obstacles: { id: string; x: number; y: number; w: number; l: number }[];
}) {
  return (
    <div className="p-3">
      <p className="mb-2 text-center text-[10px] tracking-[0.16em] text-ivory-dim uppercase">North</p>
      <div className="relative border border-amber/40 bg-[#241e18]" style={{ aspectRatio: `${length} / ${width}` }}>
        {obstacles.map((obstacle) => (
          <div
            key={obstacle.id}
            className="absolute bg-[#1a3148]"
            style={{
              left: `${(obstacle.x / length) * 100}%`,
              bottom: `${(obstacle.y / width) * 100}%`,
              width: `${(obstacle.w / length) * 100}%`,
              height: `${(obstacle.l / width) * 100}%`,
            }}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] tracking-[0.16em] text-ivory-dim uppercase">South · flat plan, not a yield model</p>
    </div>
  );
}
