type Listener = () => void;

export function readMotionPreference() {
  const stored = sessionStorage.getItem("suryasathi-motion");
  if (stored === "reduce") return true;
  if (stored === "full") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function subscribeScene(listener: () => void) {
  return sceneBridge.subscribe(listener);
}

/** Shared mutable scene clock. Camera reads it every frame; React subscribes only when values settle. */
export const sceneBridge = {
  scroll: 0,
  hour: 8.4,
  pinnedHour: null as number | null,
  reducedMotion: false,
  visible: true,
  listeners: new Set<Listener>(),
  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },
  emit() {
    this.listeners.forEach((listener) => listener());
  },
};

export function formatHour(hour: number): string {
  const clamped = Math.min(17, Math.max(6, hour));
  const whole = Math.floor(clamped);
  const minutes = Math.min(59, Math.round((clamped - whole) * 60));
  const hour12 = whole % 12 === 0 ? 12 : whole % 12;
  const suffix = whole < 12 ? "am" : "pm";
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function sunVector(hour: number): [number, number, number] {
  const clamped = Math.min(17, Math.max(6, hour));
  const t = (clamped - 6) / 12;
  const angle = Math.PI * t;
  const radius = 8.5;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius * 0.72;
  const y = 1.5 + Math.sin(angle) * 4.8;
  return [x, y, z];
}

export type Vec3 = [number, number, number];

type CameraKey = { t: number; pos: Vec3; look: Vec3 };

/** Art-directed path. Scroll moves between these shots; it does not trap the page. */
const CAMERA_KEYS: CameraKey[] = [
  { t: 0, pos: [1.6, 4.2, 18], look: [-1.4, 0.9, 0] },
  { t: 0.18, pos: [8.4, 6.4, 11.5], look: [-1.1, 0.65, 0] },
  { t: 0.38, pos: [-8.2, 5.4, 10.5], look: [-0.6, 0.8, 0] },
  { t: 0.56, pos: [5.5, 4.6, 13], look: [-0.8, 0.7, 0] },
  { t: 0.74, pos: [0.8, 12.5, 7.2], look: [-0.4, 0.1, 0] },
  { t: 1, pos: [2.4, 4.4, 16.5], look: [-1.2, 0.9, 0] },
];

function smooth(u: number) {
  return u * u * (3 - 2 * u);
}

export function sampleCamera(progress: number): { pos: Vec3; look: Vec3 } {
  const t = Math.min(1, Math.max(0, progress));
  let index = 0;
  while (index < CAMERA_KEYS.length - 2 && CAMERA_KEYS[index + 1].t < t) index += 1;
  const from = CAMERA_KEYS[index];
  const to = CAMERA_KEYS[index + 1];
  const span = to.t - from.t || 1;
  const eased = smooth((t - from.t) / span);
  const mix = (a: number, b: number) => a + (b - a) * eased;
  return {
    pos: [mix(from.pos[0], to.pos[0]), mix(from.pos[1], to.pos[1]), mix(from.pos[2], to.pos[2])],
    look: [mix(from.look[0], to.look[0]), mix(from.look[1], to.look[1]), mix(from.look[2], to.look[2])],
  };
}

export function scriptedHour(progress: number): number {
  if (progress < 0.3) return 8.4;
  if (progress > 0.62) return 15.6;
  const u = (progress - 0.3) / 0.32;
  return 8 + u * 8;
}
