# Frontend Specification — SuryaSathi

## 1. Creative direction

Use the copied ThreeUI **Kage prompt** as the starting creative brief for cinematic chapter-based interaction, continuous camera movement, and an immersive WebGL environment. Then apply `CURSOR_START_PROMPT.md` so that the content becomes an original SuryaSathi experience.

**Do not copy Kage's original artwork, scene plates, source code, or branding.** Its repository currently states that no licence is granted for reuse/redistribution of the original code or artwork. Use the prompt supplied in the ThreeUI interface as the user-provided starting instruction, but create original SuryaSathi code and assets. Read `ORIGINALITY_AND_ASSETS.md`.

The bar is a high-craft, Active-Theory-inspired experience: strong composition, deliberate camera choreography, fluid transitions, editorial typography, atmospheric lighting, restraint, and a meaningful story. Do not promise exact imitation of any studio.

## 2. Visual system

- Background: deep evergreen / near-black.
- Primary text: warm ivory.
- Primary light/accent: solar amber.
- Status/success accent: restrained renewable mint.
- Warning: amber; critical: restrained red used only for actual audit statuses.
- Type: confident editorial display face paired with a highly legible UI sans-serif. Use fonts only where usage terms permit; fallback system fonts must work.
- Surface treatment: mostly clean, low-chrome; use glass only where it improves hierarchy.
- Motion: purposeful, eased, and synchronized; no random particles or spinning objects just to look “3D”.

## 3. Cinematic chapters

### Chapter 1 — The Sun
A dark environment, original luminous solar orb, technical roof lines, SuryaSathi wordmark and the headline:

> Before you pay for solar, make the numbers prove themselves.

CTA: **Analyse my quote**. Secondary action: **Explore how it works**.

### Chapter 2 — The Rooftop
Blueprint becomes a dimensional Indian rooftop with a parapet, solar panels, water tank and stair enclosure. The scene should feel architectural and intentional.

### Chapter 3 — Solar Physics
Sun direction changes through a small number of times of day. The visual helps users understand orientation/obstacles. Clearly distinguish the visual preview from validated annual simulation.

### Chapter 4 — The Quote
The narrative transitions into the quote-ingestion/review experience. Any example numbers must be labelled sample/demo data until calculated by the API.

### Chapter 5 — X-Ray
A vendor's claim is placed beside the backend-produced range/status. Each status can open an evidence explanation: claim source, calculation, assumptions, source snapshot, and recommended question.

### Chapter 6 — Take Action
A concise action panel and a clear way into the working analysis/report. Animation must never trap the user or delay access to the core task.

## 4. Routes

Keep the app small. Use routes already generated if reasonable; don't create duplicate routes just to match these names.

- `/` — cinematic landing and product story.
- `/analyze` — guided bill/roof/quote input workflow.
- `/xray` — audit results; can be a stateful step or route depending on the app structure.
- `/report` — print/download-friendly summary; if PDF generation costs too much time, make a print stylesheet as fallback.

The core flow must work without login. An example/sample run is acceptable if clearly marked **Illustrative sample — not a real audit**.

## 5. Shared components

- `SiteHeader` / `Navigation`
- `CinematicCanvas` (persistent R3F scene)
- `StoryChapter` / chapter content
- `PrimaryCTA`
- `UploadDropzone`
- `ManualFieldReview`
- `RoofConfigurator`
- `SolarTwin`
- `ObstacleControls`
- `SunTimeControl`
- `ClaimCard`
- `AuditStatusBadge`
- `EvidenceDrawer`
- `InstallerQuestions`
- `ReportSummary`
- `Toast/ErrorState/LoadingState`

Keep API functions and request/response types out of presentation components.

## 6. 3D behaviour and safety

- Use the existing Next.js App Router and React Three Fiber/Drei/Three.js stack where compatible.
- Prefer one persistent canvas for the cinematic chapters; synchronize camera changes with scroll without remounting everything per section.
- Dynamic import WebGL scene as client-only where required.
- Provide a static/2D fallback if WebGL fails.
- Honour `prefers-reduced-motion` and provide an option to skip the cinematic intro.
- Pause or reduce expensive animation when the scene is not visible.
- Keep lighting, bloom, particles, geometry and textures restrained enough for mid-range devices.
- Avoid heavy asset downloads. Prefer procedural, original geometry for roof, panels, tank and stair cabin.
- The frontend scene is a visualization; the backend owns numeric results. Do not imply that Three.js visual shadows are the annual-yield model.

## 7. Responsive rules

- Test at 360, 390, 430, 768, 1024 and 1440 px widths.
- Main CTA must be visible without a long forced scroll.
- On narrow screens, reduce scene complexity or swap to static imagery/2D diagram.
- Avoid horizontal overflow, tiny controls, text over bright scene details, or interactive menus that require hover.
- All important actions must be keyboard-operable and have visible focus states.

## 8. Interaction rules

- Every visible button must have a real action or be disabled/labelled clearly.
- Upload flow needs progress, parse errors, empty state, retry, and manual-entry fallback.
- The user must be able to edit uncertain extracted fields.
- X-Ray labels must explain themselves; color alone must not carry meaning.
- Source, assumptions, model range and status must be readable without animation.
- Sample output must never masquerade as an actual API result.

## 9. Landing-page quality checklist

- The first frame has a clear focal point and readable headline.
- At least one transition visibly connects the 3D environment to the product story.
- Motion has no abrupt camera teleport or scroll deadlock.
- Scene loads with a deliberate loading state and fails gracefully.
- Main CTA enters the analysis workflow.
- Performance and mobile fallback pass.
- The site still communicates the problem with reduced motion enabled.

## 10. Reference pages

- ThreeUI Kage listing: https://threeui.com/landing-pages/kage-landing-page
- Kage copied prompt source: https://github.com/MengTo/kage/blob/main/PROMPT.md
- Kage licence statement: https://github.com/MengTo/kage/blob/main/README.md
- ThreeUI landing pages: https://threeui.com/landing-pages
- React Three Fiber examples: https://r3f.docs.pmnd.rs/getting-started/examples
- Spline web code export: https://docs.spline.design/exporting-your-scene/web/exporting-as-code

References are inspiration, not permission to copy protected code/artwork. Verify each third-party asset licence.
