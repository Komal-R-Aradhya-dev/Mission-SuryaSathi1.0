# Task Plan and Team Roles

## Reality check

The official event runs October 8–11, 2026. The WeMakeDevs blog published October 6 says online submissions stay open until **Sunday, October 11, 2026, 8:00 PM IST**; the schedule page still has a generic “hours are being finalised” notice. Treat 8:00 PM IST as the announced deadline and verify the submission form/official communications before final upload.

This leaves a short window. Build the end-to-end working flow before spending time on cinematic polish. Make backend/frontend API agreements today, not after the UI is finished.

## Team: two people is sufficient

### Komal — Frontend / cinematic experience

- New Next.js project scaffold generated from the copied ThreeUI Kage prompt plus `CURSOR_START_PROMPT.md`.
- Original SuryaSathi art direction and 3D assets.
- Landing narrative, responsive layout, upload/field-review UI, Solar Twin controls, X-Ray screen and report screen.
- Typed API client and visible errors/loading states.
- Keep a 2D fallback and mobile performance budget.

### Adish — Backend / AWS / audit engine

- FastAPI and Pydantic schemas matching `API_CONTRACTS.md`.
- API Gateway/Lambda or a deployment shape agreed with the team; AWS service usage must be real and visible.
- S3 upload, Textract, Bedrock only if account access works promptly.
- Deterministic quote arithmetic, policy checks, simulation calculation and evidence JSON.
- PVGIS integration and fallback errors.
- README backend instructions, CloudWatch/AWS proof for demo.

### Joint

- Agree exact API schemas before parallel coding.
- Keep a shared `sample-audit.json` test response clearly labelled illustrative; never present it as a live result.
- Test end-to-end together early.
- Record the video and submit with buffer.

Do not add a third team member just to increase headcount. Add only a proven solar/PV/math specialist who can contribute immediately and who is registered/eligible under the rules. For the remaining sprint, a third member may increase coordination overhead more than output.

## Order of work

### Phase 0 — First 30 minutes

1. Create a fresh project directory/repository during the hackathon window.
2. Save these documentation files in the root.
3. Paste ThreeUI's copied Kage prompt, then the contents of `CURSOR_START_PROMPT.md` into Cursor Agent.
4. Scaffold the Next.js app and start the dev server.
5. Adish starts the FastAPI health endpoint and audit response schema in parallel.
6. Commit the initial scaffold with a real timestamp.

### Phase 1 — Get a real vertical slice running

Frontend: landing CTA → input form → X-Ray page.

Backend: `GET /health` → `POST /api/v1/simulate` or `/api/v1/audit` returning deterministic, tested JSON.

Wire the deployed frontend to the backend as soon as possible.

### Phase 2 — Documents

Add bill/quote upload and OCR if AWS permissions/model access are available. Preserve manual-entry fallback. Do not wait for OCR to finish the entire UI.

### Phase 3 — Solar estimate

Panel arithmetic, simple geometry, PVGIS yield with declared assumptions; add limited obstacle/shadow exclusion only if reliable and testable.

### Phase 4 — X-Ray

Implement statuses and source-linked evidence. Ensure the UI distinguishes modelled results from sample results.

### Phase 5 — Ship and prove

Deploy, run real browser checks, inspect mobile, record the submission video and submit early.

## Scope/timebox rules

- Cinematic hero: timebox. If it is blocking the flow, keep the strongest opening and reduce chapters.
- Do not build full 365-day shadow engine.
- Do not add login until all core steps work.
- Do not add multi-quote comparison until single-quote audit works.
- Do not build a custom PDF engine if print CSS can produce the required report.
- Do not add live scraping of MNRE/ALMM into runtime.
- The final submission needs evidence of a working product, not merely a beautiful canvas.
