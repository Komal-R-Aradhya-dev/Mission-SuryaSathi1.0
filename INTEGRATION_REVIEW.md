# SuryaSathi Frontend + Backend Integration Review

## Result

The supplied Next.js frontend and FastAPI backend source have been combined into this repository layout. The frontend remains under `apps/web/`; backend modules are organized under `backend/app/` following their Python imports. `API_CONTRACTS.md` and the frontend typed API client are kept alongside both applications.

## Contract mapping reviewed

| Frontend request | Backend route | Review |
|---|---|---|
| `getHealth()` | `GET /health` | Matching response shape |
| `simulate()` | `POST /api/v1/simulate` | Request and response fields align |
| `audit()` | `POST /api/v1/audit` | `simulation_id`, `quote_claims`, and `confirmed_fields` align; signed stateless token is decoded server-side |
| `presignUpload()` | `POST /api/v1/uploads/presign` | Request/response types align |
| `extractDocument()` | `POST /api/v1/documents/extract` | Request/response types align |
| `uploadToPresignedUrl()` | `PUT` to presigned S3 URL or local connectivity endpoint | S3 bucket CORS is now included in the SAM template |

Audit status strings in the backend match the frontend's `AuditStatus` union.

## Backend changes made during integration

- Arranged the individually supplied Python files into `backend/app`, `backend/app/api`, and `backend/app/services` so the imports resolve.
- Added tests for the health route, simulation route contract, stateless-token audit route, presign response, deterministic panel packing, invalid geometry/angles, token tampering, upload validation, Textract field extraction, offline PVGIS behavior, and production secret validation.
- Replaced the truncated 64-bit HMAC suffix with the full SHA-256 HMAC signature and removed the unbounded process-local token cache. Simulation tokens are signed and compressed, **not encrypted**.
- Required a non-default `TOKEN_SECRET_KEY` in production and made it a masked deployment parameter.
- Updated AWS runtime settings to Python 3.12, added exact frontend-origin parameters for API Gateway and S3 CORS, and kept the upload bucket private.
- Changed S3 keys to opaque generated names rather than retaining user-provided filenames.
- Added conservative labelled-line parsing for Textract LINE blocks. It only uses actual source text/page/confidence metadata, flags values for review, and does not claim Bedrock extraction is implemented.
- Added a price/scope check that reports missing amounts and requests an itemized breakdown without claiming a quote is market-fair or unfair.
- Corrected roof usable-area calculation so overlapping obstacle exclusion rectangles are not subtracted more than once.
- Updated documentation and made the frontend upload message distinguish extracted candidate values from an empty/manual-entry result.

## Verification performed in this workspace

- `python -m compileall -q app tests`: passed.
- `pytest -q`: **14 tests passed**.
- The runtime environment did not have `mangum` installed and outbound package downloads were unavailable. To exercise FastAPI routes, the test run used a temporary external test-only `mangum` import shim; the actual Lambda adapter was not tested. `mangum` remains in `backend/requirements.txt` and is required for real Lambda deployment.
- The SAM template parsed as YAML, but `sam validate --lint`, a real SAM build, and deployment were not run because AWS SAM CLI/Docker are not present in this workspace.
- `npm ci --offline --ignore-scripts` could not complete because the npm cache lacked `zustand-5.0.15.tgz`. Therefore the Next.js production build and lint have **not** been verified here.
- No AWS resources were deployed and no real S3/Textract/PVGIS service calls were demonstrated by this review.

## Remaining known limitations

- Bedrock is not invoked. Textract only returns candidate fields when explicit supported labels match; all candidates need user review.
- If S3 is not configured, the local PUT endpoint only checks connectivity and does not persist the upload. Extraction returns blank review-required fields with a warning; manual entry is the reliable local path.
- `data/policy/pm-surya-ghar-central-cfa.json` is still `not_retrieved`; PM Surya Ghar subsidy and ALMM checks remain `UNVERIFIED`.
- PVGIS requires an available network request. Its failure produces an explicit unavailable range instead of a fabricated estimate.
- Obstacle shading is an approximate 2D exclusion. The lower bound of the feasible system-size range is a planning heuristic, not a certified electrical design.
- Before deployment, pass the actual Amplify frontend origin and a unique secret to SAM, confirm pricing/permissions in the target AWS region, run backend tests with real requirements installed, run `npm ci`, `npm run lint`, and `npm run build`, and test browser CORS against the live API and S3 bucket.
