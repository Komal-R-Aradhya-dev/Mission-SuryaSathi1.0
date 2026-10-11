# SuryaSathi Backend Service

FastAPI service for rooftop panel-fit estimates, PVGIS reference-yield retrieval, deterministic Solar Quote X-Ray checks, and optional S3/Textract document processing. The service is designed to run locally and can be adapted for AWS Lambda through Mangum.

## Implemented in this source package

- `GET /health` and `/api/v1/health`.
- `POST /api/v1/simulate`: deterministic rectangle/grid packing plus a server-side PVGIS reference call. If PVGIS is unavailable, the response explicitly reports an unavailable yield instead of making one up.
- `POST /api/v1/audit`: panel-count × wattage arithmetic, generation comparison, inverter checks, missing warranty/net-metering/price-scope information, and policy status. It does not produce a market-price fairness score.
- Stateless simulation IDs authenticated with HMAC-SHA256. The token is compressed and signed, **not encrypted**. Do not put confidential data in it.
- Presigned S3 upload support when a private bucket and AWS credentials are configured.
- Optional Textract text-line extraction with conservative labelled-field parsing. Extracted values remain marked for user review. Bedrock is not currently invoked by this implementation.
- An honest manual-entry fallback when S3/Textract is unavailable.

## Local development

From the repository root, open a terminal and run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

Edit `.env` and use a unique random `TOKEN_SECRET_KEY` of at least 32 characters. For tests, open a second terminal, activate the same environment, and run `pytest -v`. The API docs are at `http://127.0.0.1:8000/docs` and health at `http://127.0.0.1:8000/health`.

The frontend defaults to `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` in `apps/web/.env.example`. Copy it to `apps/web/.env.local`, then start the frontend separately with `npm run dev` from `apps/web`. Restart Next.js after changing its environment.

## Document handling

If AWS is not configured, the local upload route only checks connectivity; it does not persist the uploaded bytes, and extraction returns blank, review-required fields. Manual entry remains the supported local path. For actual document processing, configure a private S3 bucket and the appropriate Textract permissions. Browser PUTs to S3 require the frontend origin in the bucket's CORS allowlist.

## AWS SAM deployment

Install and configure the AWS CLI, AWS SAM CLI, and Docker if using the container workflow. From this directory:

```bash
sam validate --lint
sam build
sam deploy --guided
```

The template uses Python 3.12, a private S3 bucket with a one-day lifecycle target, API Gateway HTTP API, explicit API/S3 CORS origins, and Textract permissions. During deployment provide the exact deployed frontend origin and a unique `TokenSecretKey` value (at least 32 characters). Do not commit `.env`, `samconfig.toml`, or credentials. Check AWS service pricing and create a budget alert before enabling public requests.

## Known limitations

- No Bedrock integration is present yet.
- PM Surya Ghar and ALMM results remain `UNVERIFIED` until dated official data is added and checked.
- PVGIS output is a reference estimate with a disclosed uncertainty band, not a generation guarantee or rooftop-specific annual shade simulation.
- Obstacle/shadow placement is a conservative 2D approximation, not an engineering design.
- The local mocked upload route does not store or OCR data.
