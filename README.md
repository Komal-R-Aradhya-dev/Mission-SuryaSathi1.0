# SuryaSathi

**Consumer-side solar decision intelligence for Indian households.**

> Before you pay for rooftop solar, SuryaSathi helps you compare a vendor's claims with your electricity use, the roof configuration you provide, a solar-yield model, and verifiable policy information.

SuryaSathi is being built for the **WeMakeDevs × AWS Environmental Hacks 2026 — Waste & Energy track**. The product's central experience is the **Solar Quote X-Ray**: a transparent, source-linked audit that distinguishes what a vendor claims, what the current model estimates, what can be verified, and what needs clarification.

## The problem

A homeowner may receive a solar quote with a system capacity, panel count, inverter, price, expected annual energy, subsidy claim, warranty, and installation costs. These fields may be incomplete or inconsistent. Most homeowners cannot independently evaluate the engineering assumptions or policy details before committing money.

SuryaSathi is a **pre-purchase decision-support tool**, not a certified site survey, an installer marketplace, a regulator, or a legal adjudicator.

## The core workflow

1. **Bill** — upload an electricity bill or enter its relevant values manually.
2. **Roof** — enter roof dimensions, orientation, and simple obstacles in a lightweight 3D Solar Twin.
3. **Model** — calculate feasible panel placement and an estimated annual-generation range using documented assumptions and PVGIS/reference data.
4. **Quote** — upload a vendor quotation or enter the claims manually; review extracted values before analysis.
5. **X-Ray** — compare quoted capacity, panel arithmetic, generation claims, available equipment details, and policy claims with the model and source snapshots.
6. **Act** — see an evidence trail, targeted questions for the installer, and a concise “Before You Pay” report.

## Product principle

**Claim → Source → Check → Calculation → Result → Action**

AI may read/structure documents and explain the result. Deterministic code owns arithmetic, geometry, panel packing, modeled output, and policy-rule checks. The product must never present an LLM guess as a physical calculation.

## MVP boundaries

### Must work

- Cinematic landing page based on an original SuryaSathi reinterpretation of the chosen Kage prompt's interaction structure.
- Accessible path into the analysis workflow.
- Bill/quote input with editable, clearly labelled extracted fields and manual-entry fallback.
- Roof dimensions and simple obstacle inputs.
- Deterministic panel arithmetic and basic rectangle packing/usable-area calculation.
- Server-side PVGIS/reference-yield integration or a clearly-labelled fallback if the external service is unavailable.
- Single-quote X-Ray with evidence/status reasons.
- An AWS-hosted frontend and a real AWS-backed processing step shown in the submission video.
- Clear limitations and data-source attribution.

### Defer or cut if behind

- User login and account history.
- Two-quote comparison.
- Satellite roof reconstruction.
- Native/mobile apps, WhatsApp integration, voice, battery modelling, multiple DISCOMs, RWA workflow, complex agent orchestration, or live government-site scraping.
- Full year-long 3D ray tracing or claims of certified annual shading accuracy.

## Architecture summary

- **Frontend:** Next.js App Router + TypeScript + Tailwind CSS + React Three Fiber/Drei/Three.js.
- **Frontend hosting:** AWS Amplify Hosting.
- **API/backend:** FastAPI + Pydantic + Mangum on AWS Lambda (container image if required by numerical dependencies), behind API Gateway.
- **Documents:** private S3 uploads; Textract for OCR/forms/tables; Bedrock only for unstructured normalization/explanations where useful.
- **Reference yield:** PVGIS API, called from the backend and handled with timeouts/caching.
- **Physics:** deterministic Python modules; `pvlib` only for the functions actually implemented and tested; simple 2D obstacle/shadow exclusion, not custom 3D raycasting.
- **Metadata:** DynamoDB only if durable report/session persistence is needed. It is not required to render the core X-Ray.
- **Authentication:** Supabase Auth is optional and not on the critical path. The main demo must work without sign-in. Do not add Supabase database storage merely to add a service.
- **Observability:** CloudWatch logs/metrics. Never log document text or secrets.

See [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md), [TECH_STACK.md](TECH_STACK.md), [API_CONTRACTS.md](API_CONTRACTS.md), and [PHYSICS_AND_XRAY_RULES.md](PHYSICS_AND_XRAY_RULES.md).

## Planned repository layout

```text
suryasathi/
├── README.md
├── PROJECT_BRIEF.md
├── FRONTEND_SPEC.md
├── TECH_STACK.md
├── SYSTEM_ARCHITECTURE.md
├── API_CONTRACTS.md
├── PHYSICS_AND_XRAY_RULES.md
├── DATA_AND_POLICY_SOURCES.md
├── AWS_DEPLOYMENT_AND_SECURITY.md
├── TASK_PLAN_AND_TEAM_ROLES.md
├── HACKATHON_SUBMISSION.md
├── ORIGINALITY_AND_ASSETS.md
├── DESIGN_REFERENCES.md
├── CURSOR_START_PROMPT.md
├── CURSOR_CHECKLIST.md
├── apps/
│   └── web/           # Next.js frontend (Komal)
├── backend/           # FastAPI service (Adish)
├── infra/              # AWS SAM/deployment configuration
└── data/               # verified, dated reference snapshots
```

Cursor should create the Next.js app inside `apps/web/` so the project root README/specifications stay intact. Do not create duplicate frontend apps.

## Repository guide

- `PROJECT_BRIEF.md` — problem, users, product and impact
- `FRONTEND_SPEC.md` — landing chapters, visual language, routes, interaction and accessibility
- `TECH_STACK.md` — approved stack and scope constraints
- `SYSTEM_ARCHITECTURE.md` — service/data flow and boundaries
- `API_CONTRACTS.md` — proposed backend contract for frontend/backend coordination
- `PHYSICS_AND_XRAY_RULES.md` — deterministic calculations, thresholds and limitations
- `DATA_AND_POLICY_SOURCES.md` — sources, provenance and policy snapshot rules
- `AWS_DEPLOYMENT_AND_SECURITY.md` — deployment, PII and cost safety
- `TASK_PLAN_AND_TEAM_ROLES.md` — two-person team responsibilities and build order
- `HACKATHON_SUBMISSION.md` — rule compliance and final submission checklist
- `CURSOR_START_PROMPT.md` — instruction to paste into Cursor **after** the copied ThreeUI Kage prompt
- `ORIGINALITY_AND_ASSETS.md` — licensing, attribution and original-assets policy

## Development status

The uploaded frontend and backend source are now present in one repository layout. The Next.js app remains in `apps/web/`; the FastAPI service is in `backend/`. The browser API client uses `NEXT_PUBLIC_API_BASE_URL` and its main request/response shapes align with the backend Pydantic schemas.

### Included in this integrated workspace

- Original Next.js App Router / TypeScript / React Three Fiber frontend and analysis/X-Ray/report routes.
- FastAPI routes for health, upload presigning, document extraction, solar simulation, audit, and report metadata.
- Deterministic panel packing, PVGIS reference-yield calls, signed stateless simulation tokens, quote arithmetic checks, and unverified policy checks.
- Backend test suite covering health, geometry validation, panel arithmetic, token integrity, audit statuses, upload validation, and offline PVGIS behavior.
- SAM deployment template and Dockerfile with Python 3.12, private S3 storage, explicit CORS origins, and a required production token secret.

### Still not complete or not verified

- AWS infrastructure has **not** been deployed or tested in a real AWS account.
- Bedrock is not implemented in the current backend, despite being listed as a possible architecture option.
- Textract is used to read text lines and only extracts explicitly labelled fields with conservative patterns; every extracted field requires user review. If S3/Textract is not configured, upload does not create a persistent local document and manual entry is the supported path.
- The policy snapshot at `data/policy/pm-surya-ghar-central-cfa.json` is `not_retrieved`; subsidy and ALMM status must remain unverified.
- PVGIS requires network access; its unavailability produces an explicit unverified-yield response, not a made-up estimate.
- Full frontend production build and real AWS deployment checks depend on installing project dependencies and AWS tooling in the target environment. Do not describe them as passing until run there.

See `backend/README.md` for backend setup, tests, limitations, and deployment notes.

## Local development

Open separate terminals for the frontend and backend. From the repository root, the frontend commands are:

```bash
cd apps/web
npm install
npm run dev
```

### Backend (second terminal)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
pytest -v
uvicorn app.main:app --reload --port 8000
```

Set a unique random `TOKEN_SECRET_KEY` in `backend/.env` before running locally. The deployment template requires a production secret and the exact frontend origin.

## Privacy and limitations

- Do not store more personal information than required.
- Use private object storage and short-lived upload access.
- Delete raw bill/quote files promptly (target: 24-hour lifecycle where supported and validated).
- The estimate depends on user-entered geometry, module specifications, local solar resources, losses, and assumptions.
- Obstacle preview is an approximation. Do not call it a validated annual shade-loss model.
- Policy and ALMM results must be described as a dated snapshot/check, not a blanket legal certification.
- Vendor results are **not accusations of fraud**. Use “inconsistent,” “above model,” “unverified,” or “information missing.”

## Official references

- Hackathon overview: https://www.wemakedevs.org/aws/env
- Official rules: https://www.wemakedevs.org/aws/env/rules
- Official schedule: https://www.wemakedevs.org/aws/env/schedule
- WeMakeDevs Oct 6 event update (says submissions stay open until Oct 11, 8:00 PM IST): https://www.wemakedevs.org/blogs/what-is-happening-in-delhi-on-10-october
- Kage prompt reference: https://github.com/MengTo/kage/blob/main/PROMPT.md
- Kage README/licence statement: https://github.com/MengTo/kage/blob/main/README.md
- PVGIS API docs: https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-6/using-pvgis_en
- AWS Lambda Python container docs: https://docs.aws.amazon.com/lambda/latest/dg/python-image.html
