# Technology Stack — SuryaSathi

## Decision rule

Use one coherent stack. Do not upgrade major versions or add libraries just for novelty. Cursor must inspect the scaffold it creates and keep compatible dependency versions together. Record actual installed versions in `package.json`; do not claim a version in docs unless installed.

## Frontend

| Layer | Choice | Purpose |
|---|---|---|
| Framework | Next.js App Router + TypeScript | Website, routes, typed components |
| Styling | Tailwind CSS | Responsive UI and design tokens |
| 3D | Three.js + React Three Fiber + Drei | Custom rooftop, panels, atmosphere, scene composition |
| Motion | GSAP + ScrollTrigger if compatible | Cinematic chapter/camera/DOM choreography |
| Smooth scroll | Lenis only if needed and tested with ScrollTrigger | Optional scroll feel; cut if it causes integration issues |
| Tests | Existing lint/typecheck/build; add a few component/unit tests where time permits | Prevent broken submission |

Avoid using Spline as the source of truth for the interactive roof geometry. It can be an optional isolated asset only if licensing and integration are clear.

## Backend

| Layer | Choice | Purpose |
|---|---|---|
| API | FastAPI + Pydantic | Typed HTTP API and request validation |
| Python adapter | Mangum if FastAPI runs on Lambda | ASGI-to-Lambda adaptation |
| Runtime | AWS Lambda, zip or container according to dependencies | Backend execution |
| Cloud API | API Gateway HTTP API | Public API endpoint |
| Documents | Amazon S3 (private) | Temporary bill/quote objects |
| OCR | Amazon Textract | Text/forms/tables extraction |
| LLM | Amazon Bedrock only for schema normalization/explanation where useful | Handle ambiguous, unstructured document text; not numerical truth |
| Yield reference | PVGIS API called server-side | Independent generation reference |
| Solar calculation | Deterministic Python, `pvlib` where genuinely used | Solar position/PV model calculations |
| Geometry | Simple deterministic geometry; `shapely` only if available and useful | 2D obstacle/shadow zones and panel fit |
| Metadata | DynamoDB only if persistence is needed | Audit/session metadata; core demo can work without it |
| Logs | CloudWatch | Health, failures and service traces without sensitive document contents |
| Frontend hosting | AWS Amplify Hosting | Public deployed site |
| Infrastructure | AWS SAM if deployment setup time permits | Repeatable AWS resource definitions |

AWS documents Lambda container images for Python if the numeric package stack is awkward for a zip: https://docs.aws.amazon.com/lambda/latest/dg/python-image.html

## Authentication decision

Supabase Auth was discussed, but **authentication is not required for the winning MVP**. Make the main demo usable without sign-in. If a Supabase project is already configured and auth can be added without blocking the core loop, it may be an optional enhancement. Do not create a dependency on Supabase for the calculations or AWS document-processing pipeline, and do not store bill/quote contents in Supabase.

## Explicitly do not add unless the whole MVP is already stable

- SQS/Step Functions/Strands agent orchestration
- RDS or a multi-service microservice setup
- Login, user profiles, payments, marketplace, chat assistant
- Multiple LLM providers in production code
- A custom ML model or bespoke 3D ray-tracing engine
- Multiple DISCOMs/states or battery sizing

## Minimum useful AWS proof

The public frontend must be hosted on AWS Amplify and at least one meaningful processing step must run on AWS (preferably FastAPI/Lambda plus Textract or Bedrock when available). The final video must visibly show a real AWS-backed operation, not only an architecture diagram. Official hackathon rules accept either an AWS open-source tool or an AWS deployment for prize eligibility, but a real deployment is our chosen strategy.
