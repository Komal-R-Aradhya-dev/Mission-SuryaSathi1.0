"use client";

import { formatHour } from "@/lib/scene/sceneBridge";

export function SunTimeControl({
  id,
  hour,
  onChange,
  onFollow,
  following = false,
  note,
}: {
  id: string;
  hour: number;
  onChange: (hour: number) => void;
  onFollow?: () => void;
  following?: boolean;
  note?: string;
}) {
  return (
    <div className="pointer-events-auto max-w-md rounded-2xl border border-white/15 bg-ink/80 p-4">
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm text-ivory">
        <span>Time of day</span>
        <span className="font-mono text-amber">{formatHour(hour)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={6}
        max={17}
        step={0.25}
        value={Math.min(17, Math.max(6, hour))}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-amber"
      />
      <p className="mt-3 text-xs leading-5 text-ivory-dim">
        {note ??
          "Visualization only. Dragging this does not run a shading study and does not change any annual-generation figure."}
      </p>
      {onFollow ? (
        <button
          type="button"
          onClick={onFollow}
          disabled={following}
          className="mt-3 min-h-11 text-sm text-amber disabled:text-ivory-dim"
        >
          {following ? "Following the chapter" : "Follow the chapter again"}
        </button>
      ) : null}
    </div>
  );
}
