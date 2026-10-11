export type ObstacleDraft = {
  id: string;
  x_offset_m: string;
  y_offset_m: string;
  width_m: string;
  length_m: string;
  height_m: string;
};

export type AnalysisDraft = {
  bill: {
    annual_units_kwh: string;
    sanctioned_load_kw: string;
    confirmed: boolean;
  };
  location: {
    latitude: string;
    longitude: string;
    pincode: string;
  };
  terrace: {
    length_m: string;
    width_m: string;
    roof_slope_deg: string;
    roof_azimuth_deg: string;
    edge_setback_m: string;
    obstacles: ObstacleDraft[];
  };
  array: {
    panel_model: string;
    panel_assumption: "unset" | "generic" | "user-confirmed";
    panel_rated_power_w: string;
    panel_length_m: string;
    panel_width_m: string;
    panel_tilt_deg: string;
    panel_azimuth_deg: string;
    dimensions_confirmed: boolean;
  };
  quote: {
    vendor_name: string;
    claimed_system_size_kw: string;
    claimed_annual_generation_kwh: string;
    panel_model: string;
    panel_rated_power_w: string;
    panel_count: string;
    inverter_model: string;
    inverter_capacity_kw: string;
    quoted_price_inr: string;
    claimed_subsidy_inr: string;
    warranty_text: string;
    net_metering_included: "" | "yes" | "no" | "unknown";
    confirmed: {
      claimed_system_size_kw: boolean;
      claimed_annual_generation_kwh: boolean;
      panel_count: boolean;
      panel_rated_power_w: boolean;
      quoted_price_inr: boolean;
      claimed_subsidy_inr: boolean;
    };
  };
  sunHour: number;
};

export const emptyDraft = (): AnalysisDraft => ({
  bill: { annual_units_kwh: "", sanctioned_load_kw: "", confirmed: false },
  location: { latitude: "", longitude: "", pincode: "" },
  terrace: {
    length_m: "",
    width_m: "",
    roof_slope_deg: "",
    roof_azimuth_deg: "",
    edge_setback_m: "",
    obstacles: [],
  },
  array: {
    panel_model: "",
    panel_assumption: "unset",
    panel_rated_power_w: "",
    panel_length_m: "",
    panel_width_m: "",
    panel_tilt_deg: "",
    panel_azimuth_deg: "",
    dimensions_confirmed: false,
  },
  quote: {
    vendor_name: "",
    claimed_system_size_kw: "",
    claimed_annual_generation_kwh: "",
    panel_model: "",
    panel_rated_power_w: "",
    panel_count: "",
    inverter_model: "",
    inverter_capacity_kw: "",
    quoted_price_inr: "",
    claimed_subsidy_inr: "",
    warranty_text: "",
    net_metering_included: "",
    confirmed: {
      claimed_system_size_kw: false,
      claimed_annual_generation_kwh: false,
      panel_count: false,
      panel_rated_power_w: false,
      quoted_price_inr: false,
      claimed_subsidy_inr: false,
    },
  },
  sunHour: 11,
});

export function newObstacle(): ObstacleDraft {
  return {
    id: `obs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    x_offset_m: "",
    y_offset_m: "",
    width_m: "",
    length_m: "",
    height_m: "",
  };
}
