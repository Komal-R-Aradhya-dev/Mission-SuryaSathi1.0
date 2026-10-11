# Project Brief — SuryaSathi

## 1. Product statement

**SuryaSathi is a consumer-side solar decision-intelligence tool that checks a rooftop-solar vendor's claims against the homeowner's entered electricity usage, roof geometry, deterministic calculations, and dated official-source snapshots.**

## 2. Primary user

An Indian homeowner who is considering or has received a rooftop-solar quote and wants to understand it before paying an advance. The user is not expected to understand PV engineering or policy language.

## 3. User pain

- Quotes use technical terms and model numbers that are difficult to compare.
- Capacity, module count, and inverter fields may be inconsistent.
- Annual-generation claims are difficult for a homeowner to validate.
- Costs and subsidy descriptions may omit assumptions or eligibility conditions.
- Key details such as inverter model, warranty scope, net-metering/application charges, and balance-of-system components may be missing.

These are problems SuryaSathi helps check; do not claim that all vendors mislead consumers or that every mismatch indicates misconduct.

## 4. Core value proposition

Before committing money, the user receives an explainable audit showing:

- what the bill/quote appears to say;
- which fields were manually confirmed versus extracted;
- what the geometry/capacity arithmetic says;
- the modelled generation estimate/range and assumptions;
- which policy/model information was verified against a dated snapshot;
- what is inconsistent, missing, or outside the modelled range;
- what the homeowner should ask the installer next.

## 5. Product category

Consumer-side Solar Decision Intelligence. Not an installer marketplace, a certified design tool, a subsidy approval service, or a replacement for an on-site engineer.

## 6. Outcome

The immediate outcome is **better-informed questions and a clearer pre-purchase decision**, not a guaranteed reduction in installation cost or a measured increase in solar adoption. Any environmental-impact claims must be framed as intended/possible impact unless measured.

## 7. The signature interaction

### Solar Quote X-Ray

A focused comparison between:

1. Vendor claim (with source document/page/text where available)
2. SuryaSathi result (calculation/model and assumptions)
3. Evidence/source (PV model, module data, policy snapshot, or quote arithmetic)
4. Status and suggested next action

A good result says, for example: “The vendor's annual-generation claim is above SuryaSathi's modelled range for the stated assumptions. Ask the installer for the simulation report and assumptions.” It does not say: “The vendor is fraudulent” or “we proved the installer is wrong.”

## 8. MVP journey

1. Visitor sees an immersive, original solar-themed landing experience.
2. Visitor starts an analysis without having to sign in.
3. Visitor uploads a bill or enters consumption manually.
4. Visitor configures a simple roof and obstacles.
5. The backend calculates a feasible layout/size estimate and yield reference/range.
6. Visitor uploads a quote or enters quote claims manually.
7. Visitor reviews editable extracted fields.
8. The audit engine runs deterministic checks.
9. The results page displays a single-quote X-Ray and evidence.
10. Visitor downloads or prints a concise report and sees targeted installer questions.

## 9. Explicit non-goals for this sprint

- National-scale rollout or multiple DISCOMs.
- Certified electrical/structural engineering.
- Legal determinations or fraud accusations.
- Fully automated panel eligibility/legal certification.
- Full annual 3D ray tracing or pixel-accurate 3D-to-Python shade mapping.
- User marketplace, payment, social features, chatbot, or mobile app.
- Two-quote comparison before the single-quote workflow is reliable.

## 10. Product success criteria

A first-time user can, in under two minutes, reach a useful result through uploaded or manual input; at least one clear quote inconsistency can be demonstrated end-to-end; the result explains its evidence and limitations; the deployment genuinely uses AWS; and the 3-minute video shows that workflow clearly.
