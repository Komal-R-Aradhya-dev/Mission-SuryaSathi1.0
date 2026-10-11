# System Architecture — SuryaSathi

## 1. High-level data flow

```text
Browser (Next.js + R3F)
  ├── cinematic landing / Solar Twin / X-Ray UI
  ├── upload and manual-review controls
  └── typed API client
          │ HTTPS
          ▼
      API Gateway
          │
          ▼
 FastAPI application on Lambda (Mangum; container if needed)
  ├── /health
  ├── upload URL service
  ├── document extraction service
  ├── deterministic solar simulation
  └── audit/evidence service
       │        │        │
       ▼        ▼        ▼
      S3    Textract   PVGIS (outbound server-side, timeout/cache)
       │        │        │
       │        ▼        │
       │   Bedrock (optional schema normalization/explanation)
       │        │        │
       └────────┴────────┘
                 ▼
          Deterministic validation/audit engine
                 │
                 ▼
      X-Ray JSON + installer questions + report data
                 │
                 ▼
          Browser renders the result
```

DynamoDB may store case metadata if persistence is necessary. Do not make a database dependency a blocker for the first working demo. Raw documents should remain in private S3 and expire promptly.

## 2. Service boundaries

### Frontend

Owns rendering, user input, form state, review of extracted fields, animation, and rendering API-produced results. It must not independently calculate final annual generation, subsidy, or audit severity.

### Document service

Calls Textract on an uploaded S3 object. If Bedrock is used, it normalizes extracted text into a strict schema. Each field retains source text/page/available confidence and is marked for manual review if uncertain.

### Solar engine

Pure deterministic Python functions for:
- validating units and geometry;
- computing module nameplate capacity from count × module watts;
- calculating usable roof/obstacle zones and simple panel fit;
- retrieving PVGIS yield/performance output for a specified location/configuration;
- producing model range and assumptions.

Never give the LLM responsibility for numeric calculations.

### Policy engine

Reads versioned local JSON snapshots containing source URL, retrieval date and rule fields. No live scraping dependency in the request path. If a panel/policy record cannot be matched, return `UNVERIFIED` rather than guessing.

### Audit engine

Compares the user's reviewed claims and deterministic model output. Emits structured checks, supporting values, source references, assumptions and recommended questions. It should be testable without AWS or an LLM.

## 3. Document upload flow

Preferred robust flow:

1. Browser calls `POST /api/v1/uploads/presign` with file name, MIME type and document type.
2. API returns a short-lived presigned URL and opaque S3 object key.
3. Browser uploads directly to private S3 using that URL.
4. Browser calls `POST /api/v1/documents/extract` with object key and document type.
5. API calls Textract and, only if needed, Bedrock.
6. API returns editable extracted fields, confidence/source locations, and a `needs_review` flag.

If this costs too much time, keep manual-entry fallback as the guaranteed core workflow. Do not pass huge file bodies through an API Gateway/Lambda request if it creates payload limits or reliability issues.

## 4. Solar simulation flow

1. Validate roof and obstacle inputs using Pydantic.
2. Validate dimensions and coordinate bounds.
3. Read exact panel dimensions/specifications from the known panel catalog; if unknown, require user-confirmed panel data or a clearly-labelled generic assumption.
4. Compute usable rectangle/obstacle exclusions and feasible panel count with simple deterministic packing.
5. Query/cache PVGIS server-side with explicit location, tilt, azimuth and system assumptions. Use timeout and clear error handling.
6. Produce an annual-generation estimate/range and assumptions.
7. Return geometry/result data for the frontend to visualize.

Do not treat an illustrative frontend shadow as a calculated annual shadow-loss percentage.

## 5. Audit flow

1. Take the user-reviewed bill fields, roof/simulation result, and reviewed quote claims.
2. Check module count × module wattage against claimed system size.
3. Compare generation claim against model range using a documented, configurable heuristic.
4. Validate required quote fields and consistency of line-item arithmetic if data is available.
5. Read the dated policy snapshot for relevant subsidy rule comparison.
6. Check exact module model against a dated ALMM snapshot if the applicable list is available.
7. Return status, reason, evidence, confidence/verification state and next question.
8. Generate the report from structured backend results, not a free-form LLM verdict.

## 6. Error strategy

- API/PVGIS unavailable: show an explicit unavailable/error state; do not silently present a fabricated yield. A known reference sample can be offered clearly as sample mode.
- Textract uncertain: editable manual fields.
- Bedrock unavailable: deterministic parsing + manual confirmation.
- Policy/module lookup unknown: `UNVERIFIED`.
- Invalid geometry: show a field-level validation error.
- WebGL unavailable: 2D/static roof diagram and working audit flow.
- No authentication: anonymous demo still works.

## 7. Persistence and privacy

For the MVP, store only what the live workflow needs. If DynamoDB is used, store case ID, timestamps, model result, audit checks and report metadata, not raw bill text unless necessary. Raw objects are private and should expire under an S3 lifecycle policy. Never log request bodies containing personal information.
