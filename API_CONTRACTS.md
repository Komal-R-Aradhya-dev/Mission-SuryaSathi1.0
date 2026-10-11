# API Contracts — SuryaSathi

These are the shared contracts for frontend/backend coordination. The frontend TypeScript API client and FastAPI Pydantic schemas use these core request/response shapes. Local automated tests cover representative health, simulation, audit, and upload flows; AWS deployment is not yet verified.

## Conventions

- Base path: `/api/v1`
- JSON UTF-8 for API bodies/responses except direct S3 upload.
- Units are explicit in property names.
- Return 4xx for invalid user input; return structured error JSON for service failures.
- Never return secrets or raw AWS credentials.
- Never put raw electricity bill/quote text in logs.

## `GET /health`

Response:

```json
{"status":"ok","service":"suryasathi-api","version":"0.1.0"}
```

## `POST /api/v1/uploads/presign`

Request:

```json
{
  "document_type": "bill",
  "file_name": "electricity-bill.pdf",
  "content_type": "application/pdf",
  "file_size_bytes": 245000
}
```

`document_type` is `bill` or `quote`. Enforce a configured file-size limit and allow-listed MIME types.

Response:

```json
{
  "upload_url": "https://example-presigned-url",
  "object_key": "temporary/case-token/document-token.pdf",
  "expires_in_seconds": 300
}
```

The example URL/key above is illustrative only. Use private S3 and a short expiration.

## `POST /api/v1/documents/extract`

Request:

```json
{
  "document_type": "quote",
  "object_key": "temporary/.../document.pdf"
}
```

Response:

```json
{
  "document_type": "quote",
  "fields": {
    "claimed_system_size_kw": {
      "value": 4.0,
      "source_text": "4 kW system",
      "page": 1,
      "confidence": 0.94,
      "needs_review": false
    },
    "claimed_annual_generation_kwh": {
      "value": 6200,
      "source_text": "Expected generation 6200 units/year",
      "page": 1,
      "confidence": 0.87,
      "needs_review": true
    }
  },
  "warnings": []
}
```

Field confidence should use the available extractor/model metadata or a documented application rule. Do not fabricate probability-like confidence.

## `POST /api/v1/simulate`

Request:

```json
{
  "location": {
    "latitude": 13.3409,
    "longitude": 77.1010,
    "pincode": "572106"
  },
  "terrace": {
    "length_m": 12.0,
    "width_m": 8.0,
    "roof_slope_deg": 0.0,
    "roof_azimuth_deg": 180.0,
    "edge_setback_m": 0.5,
    "obstacles": [
      {
        "type": "rectangular_block",
        "x_offset_m": 4.0,
        "y_offset_m": 2.0,
        "width_m": 1.5,
        "length_m": 1.5,
        "height_m": 1.8
      }
    ]
  },
  "array": {
    "panel_model": "user-confirmed-model-or-generic-assumption",
    "panel_rated_power_w": 540,
    "panel_length_m": 2.28,
    "panel_width_m": 1.13,
    "panel_tilt_deg": 15.0,
    "panel_azimuth_deg": 180.0
  },
  "consumption": {
    "annual_units_kwh": 4800,
    "sanctioned_load_kw": 5.0
  }
}
```

Panel dimensions in this example are not universal. Use exact values from verified manufacturer datasheets when the model is known. If using a generic panel assumption, label it.

Response:

```json
{
  "simulation_id": "sim_example",
  "feasible_system_kw": {"min": 3.2, "max": 3.8},
  "panel_count": 7,
  "panel_capacity_kwp": 3.78,
  "usable_roof_area_m2": 62.0,
  "estimated_generation_kwh_year": {"min": 4300, "max": 5100},
  "generation_method": "PVGIS reference yield plus documented geometry/assumptions",
  "shadow_method": "representative-time conservative 2D exclusion; not annual ray tracing",
  "assumptions": ["..."],
  "warnings": []
}
```

The values above are an example of response shape, **not validated outputs**. Never copy the example numeric values into a real result.

## `POST /api/v1/audit`

Request:

```json
{
  "simulation_id": "sim_example",
  "quote_claims": {
    "vendor_name": "Example Solar EPC",
    "claimed_system_size_kw": 4.0,
    "claimed_annual_generation_kwh": 6200,
    "panel_model": "Example 540 W module",
    "panel_rated_power_w": 540,
    "panel_count": 8,
    "inverter_model": null,
    "inverter_capacity_kw": 4.0,
    "quoted_price_inr": 230000,
    "claimed_subsidy_inr": 78000,
    "warranty_text": null,
    "net_metering_included": null
  },
  "confirmed_fields": ["claimed_system_size_kw", "claimed_annual_generation_kwh"]
}
```

Response:

```json
{
  "audit_id": "audit_example",
  "summary": "One or more claims need clarification under the stated assumptions.",
  "checks": [
    {
      "id": "module_capacity_arithmetic",
      "status": "INCONSISTENT",
      "title": "Module count and quoted capacity differ",
      "claim": "4.0 kW",
      "calculation": "8 × 540 W = 4.32 kWp",
      "reason": "The arithmetic nameplate capacity differs from the stated system capacity. Confirm whether the quote refers to AC inverter capacity or DC module capacity.",
      "evidence": [{"type": "quote_field", "field": "panel_count"}],
      "recommended_question": "Can you clarify the DC module capacity and AC inverter capacity for this system?"
    }
  ],
  "policy_checks": [],
  "recommended_questions": [],
  "limitations": ["Preliminary decision support; not a certified site survey."]
}
```

Statuses: `CONSISTENT`, `INCONSISTENT`, `ABOVE_MODEL`, `HIGH_DISCREPANCY`, `UNVERIFIED`, `INFORMATION_MISSING`, `NEEDS_REVIEW`. Use only statuses relevant to a check; do not force every check into a red/yellow/green rating.

## `GET /api/v1/reports/{audit_id}`

Optional if report persistence is implemented. Otherwise generate a print-friendly report on the frontend from the validated audit response. Do not block MVP on PDF rendering.

## Frontend integration requirements

- Create one typed `apiClient.ts` with configurable `NEXT_PUBLIC_API_BASE_URL`.
- Never expose AWS credentials or Bedrock keys in frontend environment variables.
- Parse error bodies and show user-readable failures.
- Keep manual input fallback if document extraction or external APIs fail.
- Add a demo/sample path that clearly marks every value as illustrative.
