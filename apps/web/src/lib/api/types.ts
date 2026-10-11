/** Shared API shapes from API_CONTRACTS.md. Numeric examples in that document are not used as results. */

export type DocumentType = "bill" | "quote";

export type AuditStatus =
  | "CONSISTENT"
  | "INCONSISTENT"
  | "ABOVE_MODEL"
  | "HIGH_DISCREPANCY"
  | "UNVERIFIED"
  | "INFORMATION_MISSING"
  | "NEEDS_REVIEW";

export const AUDIT_STATUSES: readonly AuditStatus[] = [
  "CONSISTENT",
  "INCONSISTENT",
  "ABOVE_MODEL",
  "HIGH_DISCREPANCY",
  "UNVERIFIED",
  "INFORMATION_MISSING",
  "NEEDS_REVIEW",
];

export type HealthResponse = {
  status: string;
  service: string;
  version: string;
};

export type PresignRequest = {
  document_type: DocumentType;
  file_name: string;
  content_type: string;
  file_size_bytes: number;
};

export type PresignResponse = {
  upload_url: string;
  object_key: string;
  expires_in_seconds: number;
};

export type ExtractedField = {
  value: string | number | boolean | null;
  source_text: string | null;
  page: number | null;
  confidence: number | null;
  needs_review: boolean;
};

export type ExtractResponse = {
  document_type: DocumentType;
  fields: Record<string, ExtractedField>;
  warnings: string[];
};

export type ObstacleInput = {
  type: "rectangular_block";
  x_offset_m: number;
  y_offset_m: number;
  width_m: number;
  length_m: number;
  height_m: number;
};

export type SimulateRequest = {
  location: {
    latitude: number;
    longitude: number;
    pincode: string;
  };
  terrace: {
    length_m: number;
    width_m: number;
    roof_slope_deg: number;
    roof_azimuth_deg: number;
    edge_setback_m: number;
    obstacles: ObstacleInput[];
  };
  array: {
    panel_model: string;
    panel_rated_power_w: number;
    panel_length_m: number;
    panel_width_m: number;
    panel_tilt_deg: number;
    panel_azimuth_deg: number;
  };
  consumption: {
    annual_units_kwh: number;
    sanctioned_load_kw: number;
  };
};

export type RangeKwh = { min: number; max: number };

export type SimulationResponse = {
  simulation_id: string;
  feasible_system_kw: RangeKwh;
  panel_count: number;
  panel_capacity_kwp: number;
  usable_roof_area_m2: number;
  estimated_generation_kwh_year: RangeKwh;
  generation_method: string;
  shadow_method: string;
  assumptions: string[];
  warnings: string[];
};

export type QuoteClaims = {
  vendor_name: string | null;
  claimed_system_size_kw: number | null;
  claimed_annual_generation_kwh: number | null;
  panel_model: string | null;
  panel_rated_power_w: number | null;
  panel_count: number | null;
  inverter_model: string | null;
  inverter_capacity_kw: number | null;
  quoted_price_inr: number | null;
  claimed_subsidy_inr: number | null;
  warranty_text: string | null;
  net_metering_included: boolean | null;
};

export type AuditRequest = {
  simulation_id: string;
  quote_claims: QuoteClaims;
  confirmed_fields: string[];
};

export type AuditEvidence = {
  type: string;
  field?: string;
  note?: string;
};

export type AuditCheck = {
  id: string;
  status: AuditStatus;
  title: string;
  claim: string;
  calculation: string;
  reason: string;
  evidence: AuditEvidence[];
  recommended_question: string;
};

export type AuditResponse = {
  audit_id: string;
  summary: string;
  checks: AuditCheck[];
  policy_checks: AuditCheck[];
  recommended_questions: string[];
  limitations: string[];
};

export type ApiFailure = {
  message: string;
  status: number;
  body: unknown;
};
