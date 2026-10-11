"use client";

import { useMemo } from "react";
import * as THREE from "three";

type Detail = "full" | "lite";

const concrete = "#d9cbb6";
const parapet = "#c9b79a";
const coping = "#f4efe4";
const mass = "#e7d3b4";
const tankBody = "#2f6d96";
const mumty = "#ecdcc4";

function usePanelTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 448;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#16324a";
    context.fillRect(0, 0, 256, 448);
    context.strokeStyle = "#8ea4b4";
    context.lineWidth = 1.5;
    for (let column = 1; column < 6; column += 1) {
      const x = (256 / 6) * column;
      context.beginPath();
      context.moveTo(x, 14);
      context.lineTo(x, 434);
      context.stroke();
    }
    for (let row = 1; row < 10; row += 1) {
      const y = (448 / 10) * row;
      context.beginPath();
      context.moveTo(14, y);
      context.lineTo(242, y);
      context.stroke();
    }
    context.strokeStyle = "#e4ddd0";
    context.lineWidth = 8;
    context.strokeRect(6, 6, 244, 436);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }, []);
}

function Box({
  size,
  position,
  rotation,
  color,
  roughness = 0.9,
  metalness = 0.02,
  edges = 0,
  cast = false,
  receive = false,
}: {
  size: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
  edges?: number;
  cast?: boolean;
  receive?: boolean;
}) {
  const [width, height, depth] = size;
  const geometry = useMemo(() => new THREE.BoxGeometry(width, height, depth), [width, height, depth]);
  const edgeGeometry = useMemo(
    () => (edges > 0.02 ? new THREE.EdgesGeometry(geometry, 18) : null),
    [geometry, edges],
  );
  return (
    <mesh geometry={geometry} position={position} rotation={rotation} castShadow={cast} receiveShadow={receive}>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      {edgeGeometry ? (
        <lineSegments geometry={edgeGeometry}>
          <lineBasicMaterial color="#f0a202" transparent opacity={edges} />
        </lineSegments>
      ) : null}
    </mesh>
  );
}

function TerraceModel({ detail, edgeOpacity }: { detail: Detail; edgeOpacity: number }) {
  const texture = usePanelTexture();
  const cast = detail === "full";
  const length = 10;
  const width = 7;

  const panels = [
    [-1.45, 0.15],
    [0, 0.15],
    [1.45, 0.15],
    [-1.45, 1.7],
    [0, 1.7],
    [1.45, 1.7],
  ];

  return (
    <group>
      <Box
        size={[length + 0.35, 2.55, width + 0.35]}
        position={[0, -1.42, 0]}
        color={mass}
        edges={edgeOpacity}
        receive={cast}
      />
      <Box size={[length + 0.4, 0.42, width + 0.4]} position={[0, -2.4, 0]} color="#c4a07a" />
      {[-3.1, -1.2, 1.2, 3.1].map((x) => (
        <group key={x}>
          <Box size={[1.05, 1.15, 0.05]} position={[x, -1.2, width / 2 + 0.18]} color={coping} />
          <Box size={[0.78, 0.86, 0.08]} position={[x, -1.2, width / 2 + 0.26]} color="#24384a" />
        </group>
      ))}
      <Box size={[1.05, 1.55, 0.08]} position={[0, -1.55, width / 2 + 0.26]} color="#6b4632" />
      <Box
        size={[length, 0.28, width]}
        position={[0, 0, 0]}
        color={concrete}
        roughness={0.94}
        edges={edgeOpacity}
        cast={cast}
        receive={cast}
      />

      <Box size={[length, 0.9, 0.14]} position={[0, 0.59, -width / 2]} color={parapet} edges={edgeOpacity} cast={cast} receive={cast} />
      <Box size={[length, 0.9, 0.14]} position={[0, 0.59, width / 2]} color={parapet} edges={edgeOpacity} cast={cast} receive={cast} />
      <Box size={[0.14, 0.9, width]} position={[-length / 2, 0.59, 0]} color={parapet} edges={edgeOpacity} cast={cast} receive={cast} />
      <Box size={[0.14, 0.9, width]} position={[length / 2, 0.59, 0]} color={parapet} edges={edgeOpacity} cast={cast} receive={cast} />
      <Box size={[length + 0.08, 0.06, 0.18]} position={[0, 1.05, -width / 2]} color={coping} />
      <Box size={[length + 0.08, 0.06, 0.18]} position={[0, 1.05, width / 2]} color={coping} />

      <mesh position={[0, 1.02, width / 2 + 0.02]} rotation={[0, 0, 0]} castShadow={cast}>
        <coneGeometry args={[0.12, 0.22, 3]} />
        <meshStandardMaterial color="#f0a202" roughness={0.45} metalness={0.1} />
      </mesh>

      {panels.map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, 0.42, z]} rotation={[-0.2, 0, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow={cast} receiveShadow={cast}>
            <boxGeometry args={[1.16, 0.05, 0.12]} />
            <meshStandardMaterial color="#e7edf0" metalness={0.55} roughness={0.32} />
          </mesh>
          <mesh castShadow={cast} receiveShadow={cast}>
            <boxGeometry args={[1.08, 0.045, 1.82]} />
            {texture ? (
              <meshStandardMaterial map={texture} roughness={0.32} metalness={0.35} color="#ffffff" />
            ) : (
              <meshStandardMaterial color="#16324a" roughness={0.35} metalness={0.35} />
            )}
          </mesh>
        </group>
      ))}

      <group position={[-3.55, 0.14, -1.85]}>
        <mesh castShadow={cast} receiveShadow={cast}>
          <cylinderGeometry args={[0.72, 0.76, 0.16, detail === "full" ? 28 : 12]} />
          <meshStandardMaterial color="#b7aa98" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.72, 0]} castShadow={cast} receiveShadow={cast}>
          <cylinderGeometry args={[0.58, 0.62, 1.25, detail === "full" ? 32 : 14]} />
          <meshStandardMaterial color={tankBody} roughness={0.38} metalness={0.06} />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.63, 0.63, 0.08, detail === "full" ? 32 : 14]} />
          <meshStandardMaterial color="#f7f4ee" roughness={0.45} />
        </mesh>
        <mesh position={[0, 1.3, 0]} scale={[1, 0.36, 1]}>
          <sphereGeometry args={[0.58, detail === "full" ? 24 : 12, 16]} />
          <meshStandardMaterial color="#e6ebed" roughness={0.42} />
        </mesh>
        <mesh position={[0.72, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.45, 8]} />
          <meshStandardMaterial color="#8d9398" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      <group position={[3.35, 0.14, -1.95]}>
        <Box size={[1.85, 2.15, 1.55]} position={[0, 1.07, 0]} color={mumty} edges={edgeOpacity} cast={cast} receive={cast} />
        <Box size={[0.72, 1.35, 0.06]} position={[0, 0.78, 0.78]} color="#6b4632" />
        <Box size={[1.95, 0.08, 1.7]} position={[0, 2.18, 0]} color={coping} />
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.7, 0]} receiveShadow={cast}>
        <circleGeometry args={[28, detail === "full" ? 48 : 20]} />
        <meshStandardMaterial color="#c9c0b0" roughness={0.95} />
      </mesh>
    </group>
  );
}

export function Terrace({ detail, reveal }: { detail: Detail; reveal: number }) {
  const edgeOpacity = Math.max(0, 1 - reveal * 1.15) * 0.9;
  return <TerraceModel detail={detail} edgeOpacity={edgeOpacity} />;
}
