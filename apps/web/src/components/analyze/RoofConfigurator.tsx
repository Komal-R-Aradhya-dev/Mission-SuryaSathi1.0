"use client";

import type { AnalysisDraft, ObstacleDraft } from "@/lib/analysis/draft";
import { newObstacle } from "@/lib/analysis/draft";
import { buttonGhost, buttonSecondary } from "@/components/site/styles";
import { TextInput } from "@/components/analyze/fields";
import type { FieldErrors } from "@/lib/analysis/validation";

export function ObstacleControls({
  obstacles,
  onChange,
  errors,
}: {
  obstacles: ObstacleDraft[];
  onChange: (obstacles: ObstacleDraft[]) => void;
  errors: FieldErrors;
}) {
  function patch(id: string, key: keyof ObstacleDraft, value: string) {
    onChange(obstacles.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm text-ivory">Obstacles</h3>
        <button
          type="button"
          className={buttonSecondary}
          onClick={() => onChange([...obstacles, newObstacle()])}
        >
          Add a block
        </button>
      </div>
      <p className="text-xs leading-5 text-ivory-dim">
        X is metres from the west edge. Y is metres from the south edge. Width runs east–west, length runs south–north. The block sent to the API is a rectangular footprint. Presets only fill these boxes.
      </p>
      {obstacles.length === 0 ? <p className="text-sm text-ivory-dim">No obstacles yet. A clear roof is allowed.</p> : null}
      {obstacles.map((obstacle, index) => (
        <fieldset key={obstacle.id} className="space-y-3 rounded-2xl border border-white/10 p-4">
          <legend className="px-1 text-sm text-ivory">Block {index + 1}</legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonGhost}
              onClick={() =>
                onChange(
                  obstacles.map((item) =>
                    item.id === obstacle.id
                      ? { ...item, width_m: "1.2", length_m: "1.2", height_m: "1.1" }
                      : item,
                  ),
                )
              }
            >
              Tank-sized preset
            </button>
            <button
              type="button"
              className={buttonGhost}
              onClick={() =>
                onChange(
                  obstacles.map((item) =>
                    item.id === obstacle.id
                      ? { ...item, width_m: "1.8", length_m: "1.6", height_m: "2.2" }
                      : item,
                  ),
                )
              }
            >
              Stair-cabin preset
            </button>
            <button
              type="button"
              className={buttonGhost}
              onClick={() => onChange(obstacles.filter((item) => item.id !== obstacle.id))}
            >
              Remove
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput id={`${obstacle.id}-x`} label="X offset (m)" value={obstacle.x_offset_m} error={errors[`obstacle_${index}_x`]} onChange={(value) => patch(obstacle.id, "x_offset_m", value)} />
            <TextInput id={`${obstacle.id}-y`} label="Y offset (m)" value={obstacle.y_offset_m} error={errors[`obstacle_${index}_y`]} onChange={(value) => patch(obstacle.id, "y_offset_m", value)} />
            <TextInput id={`${obstacle.id}-w`} label="Width, east–west (m)" value={obstacle.width_m} error={errors[`obstacle_${index}_w`]} onChange={(value) => patch(obstacle.id, "width_m", value)} />
            <TextInput id={`${obstacle.id}-l`} label="Length, south–north (m)" value={obstacle.length_m} error={errors[`obstacle_${index}_l`]} onChange={(value) => patch(obstacle.id, "length_m", value)} />
            <TextInput id={`${obstacle.id}-h`} label="Height (m)" value={obstacle.height_m} error={errors[`obstacle_${index}_h`]} onChange={(value) => patch(obstacle.id, "height_m", value)} />
          </div>
          {errors[`obstacle_${index}`] ? <p className="text-xs text-danger">{errors[`obstacle_${index}`]}</p> : null}
        </fieldset>
      ))}
    </div>
  );
}

export function azimuthPresets(onPick: (value: string) => void) {
  const options = [
    ["0", "North"],
    ["90", "East"],
    ["180", "South"],
    ["270", "West"],
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([value, label]) => (
        <button key={value} type="button" className={buttonGhost} onClick={() => onPick(value)}>
          {label} {value}°
        </button>
      ))}
    </div>
  );
}

export function RoofConfigurator({
  draft,
  errors,
  onTerrace,
  onArray,
}: {
  draft: AnalysisDraft;
  errors: FieldErrors;
  onTerrace: (patch: Partial<AnalysisDraft["terrace"]>) => void;
  onArray: (patch: Partial<AnalysisDraft["array"]>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput id="length_m" label="East–west length (m)" value={draft.terrace.length_m} error={errors.length_m} onChange={(value) => onTerrace({ length_m: value })} hint="The longer parapet-to-parapet span running east to west." />
        <TextInput id="width_m" label="South–north width (m)" value={draft.terrace.width_m} error={errors.width_m} onChange={(value) => onTerrace({ width_m: value })} />
        <TextInput id="roof_slope_deg" label="Roof slope (degrees)" value={draft.terrace.roof_slope_deg} error={errors.roof_slope_deg} onChange={(value) => onTerrace({ roof_slope_deg: value })} hint="Use 0 for a flat terrace." />
        <TextInput id="roof_azimuth_deg" label="Roof azimuth (degrees)" value={draft.terrace.roof_azimuth_deg} error={errors.roof_azimuth_deg} onChange={(value) => onTerrace({ roof_azimuth_deg: value })} hint="North 0°, east 90°, south 180°, west 270°." />
        <TextInput id="edge_setback_m" label="Edge setback (m)" value={draft.terrace.edge_setback_m} error={errors.edge_setback_m} onChange={(value) => onTerrace({ edge_setback_m: value })} hint="Clear distance you want kept from the parapet. 0 is allowed." />
      </div>
      <div>
        <p className="mb-2 text-sm text-ivory">Azimuth presets</p>
        {azimuthPresets((value) => onTerrace({ roof_azimuth_deg: value }))}
      </div>
      <ObstacleControls obstacles={draft.terrace.obstacles} errors={errors} onChange={(obstacles) => onTerrace({ obstacles })} />
      <div className="space-y-4 border-t border-white/10 pt-4">
        <h3 className="text-sm text-ivory">Module you want checked</h3>
        <p className="text-xs leading-5 text-ivory-dim">
          Use the datasheet if you have the exact model. Otherwise mark a generic assumption. SuryaSathi will not swap in a “similar” module silently.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="panel_model" label="Module model" value={draft.array.panel_model} error={errors.panel_model} inputMode="text" onChange={(value) => onArray({ panel_model: value })} />
          <TextInput id="panel_rated_power_w" label="Rated power (W)" value={draft.array.panel_rated_power_w} error={errors.panel_rated_power_w} onChange={(value) => onArray({ panel_rated_power_w: value })} />
          <TextInput id="panel_length_m" label="Module length (m)" value={draft.array.panel_length_m} error={errors.panel_length_m} onChange={(value) => onArray({ panel_length_m: value })} />
          <TextInput id="panel_width_m" label="Module width (m)" value={draft.array.panel_width_m} error={errors.panel_width_m} onChange={(value) => onArray({ panel_width_m: value })} />
          <TextInput id="panel_tilt_deg" label="Tilt (degrees)" value={draft.array.panel_tilt_deg} error={errors.panel_tilt_deg} onChange={(value) => onArray({ panel_tilt_deg: value })} />
          <TextInput id="panel_azimuth_deg" label="Array azimuth (degrees)" value={draft.array.panel_azimuth_deg} error={errors.panel_azimuth_deg} onChange={(value) => onArray({ panel_azimuth_deg: value })} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonGhost} onClick={() => onArray({ panel_assumption: "generic" })}>
            {draft.array.panel_assumption === "generic" ? "Marked as a generic assumption" : "Mark as a generic assumption"}
          </button>
          <button type="button" className={buttonGhost} onClick={() => onArray({ panel_assumption: "user-confirmed" })}>
            {draft.array.panel_assumption === "user-confirmed" ? "Marked as datasheet values" : "I checked a datasheet"}
          </button>
        </div>
      </div>
    </div>
  );
}
