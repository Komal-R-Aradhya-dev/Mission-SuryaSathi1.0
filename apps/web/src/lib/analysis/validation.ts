import type { ObstacleInput, QuoteClaims, SimulateRequest } from "@/lib/api/types";
import type { AnalysisDraft } from "@/lib/analysis/draft";

export type FieldErrors = Record<string, string>;

function readNumber(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : null;
}

function requirePositive(errors: FieldErrors, key: string, label: string, raw: string, max?: number) {
  const number = readNumber(raw);
  if (number === null) {
    errors[key] = `Enter ${label}.`;
    return null;
  }
  if (number <= 0) {
    errors[key] = `${label} must be greater than zero.`;
    return null;
  }
  if (max !== undefined && number > max) {
    errors[key] = `${label} must be ${max} or less.`;
    return null;
  }
  return number;
}

function requireRange(
  errors: FieldErrors,
  key: string,
  label: string,
  raw: string,
  min: number,
  max: number,
) {
  const number = readNumber(raw);
  if (number === null) {
    errors[key] = `Enter ${label}.`;
    return null;
  }
  if (number < min || number > max) {
    errors[key] = `${label} must be between ${min} and ${max}.`;
    return null;
  }
  return number;
}

export type ValidatedAnalysis = {
  simulate: SimulateRequest;
  auditClaims: QuoteClaims;
  confirmedFields: string[];
};

export function validateAnalysis(draft: AnalysisDraft): { errors: FieldErrors; value: ValidatedAnalysis | null } {
  const errors: FieldErrors = {};

  const annual = requirePositive(errors, "annual_units_kwh", "annual electricity use in kWh", draft.bill.annual_units_kwh, 200000);
  const sanctioned = requirePositive(errors, "sanctioned_load_kw", "sanctioned load in kW", draft.bill.sanctioned_load_kw, 100);
  if (!draft.bill.confirmed) {
    errors.bill_confirmed = "Confirm the bill figures before running an audit.";
  }

  const latitude = requireRange(errors, "latitude", "latitude", draft.location.latitude, 6, 38);
  const longitude = requireRange(errors, "longitude", "longitude", draft.location.longitude, 68, 98);
  const pincode = draft.location.pincode.trim();
  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    errors.pincode = "Enter a 6-digit PIN code.";
  }

  const length = requirePositive(errors, "length_m", "east–west roof length", draft.terrace.length_m, 80);
  const width = requirePositive(errors, "width_m", "south–north roof width", draft.terrace.width_m, 80);
  const slope = requireRange(errors, "roof_slope_deg", "roof slope", draft.terrace.roof_slope_deg, 0, 60);
  const azimuth = requireRange(errors, "roof_azimuth_deg", "roof azimuth", draft.terrace.roof_azimuth_deg, 0, 360);
  const setback = requireRange(errors, "edge_setback_m", "edge setback", draft.terrace.edge_setback_m, 0, 5);

  const obstacles: ObstacleInput[] = [];
  draft.terrace.obstacles.forEach((obstacle, index) => {
    const prefix = `obstacle_${index}`;
    const x = requireRange(errors, `${prefix}_x`, `obstacle ${index + 1} X offset`, obstacle.x_offset_m, 0, 80);
    const y = requireRange(errors, `${prefix}_y`, `obstacle ${index + 1} Y offset`, obstacle.y_offset_m, 0, 80);
    const ow = requirePositive(errors, `${prefix}_w`, `obstacle ${index + 1} width`, obstacle.width_m, 40);
    const ol = requirePositive(errors, `${prefix}_l`, `obstacle ${index + 1} length`, obstacle.length_m, 40);
    const oh = requirePositive(errors, `${prefix}_h`, `obstacle ${index + 1} height`, obstacle.height_m, 15);
    if (length !== null && width !== null && x !== null && y !== null && ow !== null && ol !== null) {
      if (x + ow > length + 0.001 || y + ol > width + 0.001) {
        errors[prefix] = `Obstacle ${index + 1} extends outside the roof. X is from the west edge, Y from the south edge.`;
      }
    }
    if (x !== null && y !== null && ow !== null && ol !== null && oh !== null && !errors[prefix]) {
      obstacles.push({
        type: "rectangular_block",
        x_offset_m: x,
        y_offset_m: y,
        width_m: ow,
        length_m: ol,
        height_m: oh,
      });
    }
  });

  const panelWatts = requirePositive(errors, "panel_rated_power_w", "module rated power", draft.array.panel_rated_power_w, 900);
  const panelLength = requirePositive(errors, "panel_length_m", "module length", draft.array.panel_length_m, 4);
  const panelWidth = requirePositive(errors, "panel_width_m", "module width", draft.array.panel_width_m, 3);
  const tilt = requireRange(errors, "panel_tilt_deg", "module tilt", draft.array.panel_tilt_deg, 0, 60);
  const panelAzimuth = requireRange(errors, "panel_azimuth_deg", "module azimuth", draft.array.panel_azimuth_deg, 0, 360);
  const panelModel = draft.array.panel_model.trim();
  if (!panelModel && draft.array.panel_assumption !== "generic") {
    errors.panel_model = "Name the module, or mark these dimensions as a generic assumption.";
  }
  if (!draft.array.dimensions_confirmed) {
    errors.array_confirmed = "Confirm that the module dimensions are either from a datasheet you checked or an explicit generic assumption.";
  }

  const claimedKw = requirePositive(errors, "claimed_system_size_kw", "claimed system size", draft.quote.claimed_system_size_kw, 100);
  const claimedKwh = requirePositive(
    errors,
    "claimed_annual_generation_kwh",
    "claimed annual generation",
    draft.quote.claimed_annual_generation_kwh,
    200000,
  );
  const quoteWatts = requirePositive(errors, "quote_panel_w", "quoted module watts", draft.quote.panel_rated_power_w, 900);
  const quoteCount = requirePositive(errors, "panel_count", "quoted module count", draft.quote.panel_count, 500);
  if (!draft.quote.confirmed.claimed_system_size_kw || !draft.quote.confirmed.claimed_annual_generation_kwh || !draft.quote.confirmed.panel_count) {
    errors.quote_confirmed = "Confirm system size, annual generation, and module count before the audit.";
  }

  const price = readNumber(draft.quote.quoted_price_inr);
  if (draft.quote.quoted_price_inr.trim() && (price === null || price < 0)) {
    errors.quoted_price_inr = "Quoted price must be a number of rupees, or left blank.";
  }
  const subsidy = readNumber(draft.quote.claimed_subsidy_inr);
  if (draft.quote.claimed_subsidy_inr.trim() && (subsidy === null || subsidy < 0)) {
    errors.claimed_subsidy_inr = "Subsidy must be a number of rupees, or left blank.";
  }
  const inverterKw = readNumber(draft.quote.inverter_capacity_kw);
  if (draft.quote.inverter_capacity_kw.trim() && (inverterKw === null || inverterKw <= 0)) {
    errors.inverter_capacity_kw = "Inverter capacity must be greater than zero, or left blank.";
  }

  if (Object.keys(errors).length > 0 || annual === null || sanctioned === null || latitude === null || longitude === null || length === null || width === null || slope === null || azimuth === null || setback === null || panelWatts === null || panelLength === null || panelWidth === null || tilt === null || panelAzimuth === null || claimedKw === null || claimedKwh === null || quoteWatts === null || quoteCount === null) {
    return { errors, value: null };
  }

  const confirmedFields = [
    "annual_units_kwh",
    "sanctioned_load_kw",
    ...(draft.quote.confirmed.claimed_system_size_kw ? ["claimed_system_size_kw"] : []),
    ...(draft.quote.confirmed.claimed_annual_generation_kwh ? ["claimed_annual_generation_kwh"] : []),
    ...(draft.quote.confirmed.panel_count ? ["panel_count"] : []),
    ...(draft.quote.confirmed.panel_rated_power_w ? ["panel_rated_power_w"] : []),
    ...(draft.quote.confirmed.quoted_price_inr ? ["quoted_price_inr"] : []),
    ...(draft.quote.confirmed.claimed_subsidy_inr ? ["claimed_subsidy_inr"] : []),
  ];

  const net =
    draft.quote.net_metering_included === "yes"
      ? true
      : draft.quote.net_metering_included === "no"
        ? false
        : null;

  return {
    errors,
    value: {
      simulate: {
        location: { latitude, longitude, pincode },
        terrace: {
          length_m: length,
          width_m: width,
          roof_slope_deg: slope,
          roof_azimuth_deg: azimuth,
          edge_setback_m: setback,
          obstacles,
        },
        array: {
          panel_model: panelModel || "generic-assumption-confirmed-by-user",
          panel_rated_power_w: panelWatts,
          panel_length_m: panelLength,
          panel_width_m: panelWidth,
          panel_tilt_deg: tilt,
          panel_azimuth_deg: panelAzimuth,
        },
        consumption: {
          annual_units_kwh: annual,
          sanctioned_load_kw: sanctioned,
        },
      },
      auditClaims: {
        vendor_name: draft.quote.vendor_name.trim() || null,
        claimed_system_size_kw: claimedKw,
        claimed_annual_generation_kwh: claimedKwh,
        panel_model: draft.quote.panel_model.trim() || panelModel || null,
        panel_rated_power_w: quoteWatts,
        panel_count: quoteCount,
        inverter_model: draft.quote.inverter_model.trim() || null,
        inverter_capacity_kw: inverterKw,
        quoted_price_inr: price,
        claimed_subsidy_inr: subsidy,
        warranty_text: draft.quote.warranty_text.trim() || null,
        net_metering_included: net,
      },
      confirmedFields,
    },
  };
}
