# Cursor Start Prompt — Paste After the Copied ThreeUI Kage Prompt

**Usage:** Extract this documentation pack into a new repository folder named `suryasathi`. Keep the Markdown documents and the root `README.md` at the repository root. On the first Cursor Agent message, paste the full prompt copied from ThreeUI’s Kage page, then paste the instruction below. The Next.js frontend should be scaffolded inside `apps/web/` so the root project README/specification files are not overwritten. The FastAPI backend can live in `backend/`. Do not copy Kage source/assets.

---

## PROJECT OVERRIDE AND IMPLEMENTATION BRIEF

The preceding prompt is the visual/interaction starting point. Now reinterpret it as an original product called **SURYASATHI**, not Kage. Read these project documents first and treat them as the implementation specification:

1. `README.md`
2. `PROJECT_BRIEF.md`
3. `FRONTEND_SPEC.md`
4. `TECH_STACK.md`
5. `SYSTEM_ARCHITECTURE.md`
6. `API_CONTRACTS.md`
7. `PHYSICS_AND_XRAY_RULES.md`
8. `DATA_AND_POLICY_SOURCES.md`
9. `AWS_DEPLOYMENT_AND_SECURITY.md`
10. `TASK_PLAN_AND_TEAM_ROLES.md`
11. `HACKATHON_SUBMISSION.md`
12. `ORIGINALITY_AND_ASSETS.md`
13. `DESIGN_REFERENCES.md`
14. `CURSOR_CHECKLIST.md`

If any document is missing, build only what the prompt and available files support; do not invent that a backend, AWS resource, source snapshot, or model result already exists.

### 1. Start from a new project, but build correctly

- Inspect the current repository and all root Markdown files first.
- Preserve the root `README.md` and project specification documents.
- Scaffold a Next.js App Router + TypeScript + Tailwind project in `apps/web/` (do not overwrite the project root docs and do not create two frontend apps).
- Keep backend code, when added, in `backend/`; infrastructure definitions in `infra/`; panel/policy snapshots in `data/`.
- Use compatible versions of Three.js, React Three Fiber and Drei; inspect dependencies after scaffolding.
- Use a persistent client-side React Three Fiber canvas for the cinematic hero/story where practical.
- Keep the website and app route structure maintainable. Do not produce an all-in-one unmaintainable HTML file if it prevents our required Next.js/backend integration.
- Do not install or migrate to a large stack without need.

### 2. Adapt the complete Kage-style experience

Preserve the creative intent and interaction quality from the preceding prompt: full-viewport WebGL environment, chapter-based storytelling, continuous camera path, composed shots, atmospheric lighting, texture/depth, typography and motion.

Replace the entire Kyoto/Japanese temple narrative and visual content with original SuryaSathi content:

**Chapter 1 — The Sun:** dark architectural atmosphere, luminous amber solar orb, roof linework, headline “Before you pay for solar, make the numbers prove themselves.”

**Chapter 2 — The Rooftop:** an original Indian terrace model with solar panels, a water tank and stair enclosure. Procedural geometry is preferred.

**Chapter 3 — Solar Physics:** sun direction/selected time-of-day visual, roof orientation and obstacle story. Clearly label frontend shadows as visualization, not a validated annual shading simulation.

**Chapter 4 — The Quote:** a vendor quote and relevant claims enter the scene; demo values must be labelled illustrative.

**Chapter 5 — The X-Ray:** introduce the Claim-vs-Physics UI with vendor claim, backend model range, status, evidence and recommended action.

**Chapter 6 — Take Action:** clear transition to the actual analysis/report workflow.

Create all SuryaSathi code, scene geometry and visual assets originally. Do not copy Kage's unlicensed code, artwork, generated images, fonts or branding. Follow `ORIGINALITY_AND_ASSETS.md`.

### 3. Product and data rules

The real journey is:

`Bill → Roof → Simulation → Quote → X-Ray → Evidence → Action`

- Include manual data entry and manual confirmation for uncertain document fields.
- Keep the main flow usable without login.
- Do not fabricate real solar results.
- Do not show sample JSON as a real completed audit.
- Keep all API calls in a typed API client.
- Frontend renders the backend result; backend owns numeric outputs.
- Do not say a vendor is fraudulent. Use `CONSISTENT`, `INCONSISTENT`, `ABOVE_MODEL`, `HIGH_DISCREPANCY`, `UNVERIFIED`, `INFORMATION_MISSING`, or `NEEDS_REVIEW` only when relevant.

### 4. Performance and interaction quality

- Implement loading state, WebGL fallback, mobile/responsive layout, keyboard access, reduced-motion support and skip-to-analysis navigation.
- Avoid scroll trapping and heavy post-processing that risks the deadline.
- Keep hero cinematic but do not let it block the form or X-Ray.
- Use a real CTA route; every control must act or be clearly disabled.

### 5. Scope discipline

- First make the landing scene + first transition work.
- Then make the analysis form/X-Ray shell and typed API client.
- Do not add login, two-quote comparisons, marketplaces, voice, batteries, multi-DISCOM support, or an agent swarm.
- Coordinate with Adish using `API_CONTRACTS.md`. Do not invent endpoints that conflict with it.
- If backend is not ready, use a clearly labelled sample fixture with a visible demo-data label.

### 6. Work autonomously and verify

Make actual code changes instead of returning only a plan. Run lint, type checking and the production build as available. Fix reproducible errors. Do not deploy paid AWS resources or perform destructive operations without asking for approval.

At the end, report:
- files changed;
- routes and interactions built;
- whether the scene is original/procedural;
- which values are sample data;
- commands run and pass/fail results;
- remaining backend integration tasks;
- any licence/asset concern.

**Quality bar:** the site should feel like a carefully art-directed, cinematic digital experience, but every visual choice must serve the SuryaSathi story and lead to a working Solar Quote X-Ray.
