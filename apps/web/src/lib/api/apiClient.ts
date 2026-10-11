import {
  AUDIT_STATUSES,
  type AuditRequest,
  type AuditResponse,
  type AuditStatus,
  type ExtractResponse,
  type HealthResponse,
  type PresignRequest,
  type PresignResponse,
  type SimulationResponse,
  type SimulateRequest,
} from "@/lib/api/types";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) return record.message;
    if (typeof record.detail === "string" && record.detail.trim()) return record.detail;
    if (Array.isArray(record.detail) && record.detail.length > 0) {
      return "The API rejected the input. Check the fields and try again.";
    }
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const root = getApiBaseUrl();
  if (!root) {
    throw new ApiError(
      "NEXT_PUBLIC_API_BASE_URL is not set, so no backend request was sent.",
      0,
      null,
    );
  }

  let response: Response;
  try {
    response = await fetch(`${root}${path}`, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(20000),
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError("The API timed out before returning a result.", 0, null);
    }
    throw new ApiError("The API could not be reached.", 0, null);
  }

  const text = await response.text();
  const body = text ? safeJson(text) : null;
  if (!response.ok) {
    throw new ApiError(
      messageFromBody(body, `The request failed (${response.status}).`),
      response.status,
      body,
    );
  }
  return body as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRange(value: unknown): value is { min: number; max: number } {
  return (
    isRecord(value) &&
    typeof value.min === "number" &&
    Number.isFinite(value.min) &&
    typeof value.max === "number" &&
    Number.isFinite(value.max)
  );
}

function isStatus(value: unknown): value is AuditStatus {
  return typeof value === "string" && (AUDIT_STATUSES as readonly string[]).includes(value);
}

export function parseSimulationResponse(value: unknown): SimulationResponse {
  if (!isRecord(value) || typeof value.simulation_id !== "string" || !isRange(value.feasible_system_kw)) {
    throw new ApiError("The simulation response was missing required fields.", 200, value);
  }
  if (
    typeof value.panel_count !== "number" ||
    typeof value.panel_capacity_kwp !== "number" ||
    typeof value.usable_roof_area_m2 !== "number" ||
    !isRange(value.estimated_generation_kwh_year) ||
    typeof value.generation_method !== "string" ||
    typeof value.shadow_method !== "string"
  ) {
    throw new ApiError("The simulation response was missing generation or geometry fields.", 200, value);
  }
  return {
    simulation_id: value.simulation_id,
    feasible_system_kw: value.feasible_system_kw,
    panel_count: value.panel_count,
    panel_capacity_kwp: value.panel_capacity_kwp,
    usable_roof_area_m2: value.usable_roof_area_m2,
    estimated_generation_kwh_year: value.estimated_generation_kwh_year,
    generation_method: value.generation_method,
    shadow_method: value.shadow_method,
    assumptions: Array.isArray(value.assumptions)
      ? value.assumptions.filter((item): item is string => typeof item === "string")
      : [],
    warnings: Array.isArray(value.warnings)
      ? value.warnings.filter((item): item is string => typeof item === "string")
      : [],
  };
}

export function parseAuditResponse(value: unknown): AuditResponse {
  if (!isRecord(value) || typeof value.audit_id !== "string" || typeof value.summary !== "string") {
    throw new ApiError("The audit response was missing an id or summary.", 200, value);
  }
  return {
    audit_id: value.audit_id,
    summary: value.summary,
    checks: parseChecks(value.checks),
    policy_checks: parseChecks(value.policy_checks),
    recommended_questions: Array.isArray(value.recommended_questions)
      ? value.recommended_questions.filter((item): item is string => typeof item === "string")
      : [],
    limitations: Array.isArray(value.limitations)
      ? value.limitations.filter((item): item is string => typeof item === "string")
      : [],
  };
}

function parseChecks(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== "string" || !isStatus(item.status)) return [];
    if (
      typeof item.title !== "string" ||
      typeof item.claim !== "string" ||
      typeof item.calculation !== "string" ||
      typeof item.reason !== "string"
    ) {
      return [];
    }
    const evidence = Array.isArray(item.evidence)
      ? item.evidence.flatMap((entry) => {
          if (!isRecord(entry) || typeof entry.type !== "string") return [];
          return [
            {
              type: entry.type,
              ...(typeof entry.field === "string" ? { field: entry.field } : {}),
              ...(typeof entry.note === "string" ? { note: entry.note } : {}),
            },
          ];
        })
      : [];
    return [
      {
        id: item.id,
        status: item.status,
        title: item.title,
        claim: item.claim,
        calculation: item.calculation,
        reason: item.reason,
        evidence,
        recommended_question:
          typeof item.recommended_question === "string" ? item.recommended_question : "",
      },
    ];
  });
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export function presignUpload(body: PresignRequest): Promise<PresignResponse> {
  return request<PresignResponse>("/api/v1/uploads/presign", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function extractDocument(body: {
  document_type: PresignRequest["document_type"];
  object_key: string;
}): Promise<ExtractResponse> {
  return request<ExtractResponse>("/api/v1/documents/extract", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function simulate(body: SimulateRequest): Promise<SimulationResponse> {
  const raw = await request<unknown>("/api/v1/simulate", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return parseSimulationResponse(raw);
}

export async function audit(body: AuditRequest): Promise<AuditResponse> {
  const raw = await request<unknown>("/api/v1/audit", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return parseAuditResponse(raw);
}

export async function uploadToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  let response: Response;
  try {
    response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
  } catch {
    throw new ApiError("The file could not be uploaded to storage.", 0, null);
  }
  if (!response.ok) {
    throw new ApiError(`The file upload failed (${response.status}).`, response.status, null);
  }
}
