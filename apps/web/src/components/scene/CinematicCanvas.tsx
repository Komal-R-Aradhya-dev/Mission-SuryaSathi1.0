"use client";

import { Canvas } from "@react-three/fiber";
import { Component, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import * as THREE from "three";
import { SuryaWorld } from "@/components/scene/SuryaWorld";
import { WebGLFallback } from "@/components/scene/WebGLFallback";
import { readMotionPreference, sceneBridge, subscribeScene } from "@/lib/scene/sceneBridge";

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function subscribeViewport(listener: () => void) {
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}

function subscribeNothing() {
  return () => undefined;
}

function getDetail(): "full" | "lite" {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return window.innerWidth < 768 || connection?.saveData ? "lite" : "full";
}

export default function CinematicCanvas() {
  const supported = useSyncExternalStore(subscribeNothing, webglAvailable, () => true);
  const detail = useSyncExternalStore(subscribeViewport, getDetail, () => "full" as const);
  const pinnedHour = useSyncExternalStore(subscribeScene, () => sceneBridge.pinnedHour, () => null);
  const reduced = useSyncExternalStore(subscribeScene, readMotionPreference, () => false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    sceneBridge.reducedMotion = reduced;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      sceneBridge.scroll = max > 0 ? window.scrollY / max : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduced]);

  if (!supported || failed) {
    return (
      <div className="fixed inset-0 z-0">
        <WebGLFallback />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <SceneBoundary onFail={() => setFailed(true)}>
      <Canvas
        className="h-full w-full"
        shadows={detail === "full"}
        dpr={detail === "full" ? [1, 1.5] : 1}
        camera={{ position: [1.6, 4.2, 18], fov: 38, near: 0.1, far: 90 }}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        frameloop={reduced ? "demand" : "always"}
        onCreated={({ gl, invalidate }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.18;
          gl.setClearColor("#d5e4ee");
          setReady(true);
          invalidate();
        }}
      >
        <SuryaWorld detail={detail} pinnedHour={pinnedHour} />
      </Canvas>
      </SceneBoundary>
      {ready ? null : (
        <p role="status" className="absolute bottom-6 left-6 text-sm text-ivory/80">
          Preparing the terrace…
        </p>
      )}
    </div>
  );
}

class SceneBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
