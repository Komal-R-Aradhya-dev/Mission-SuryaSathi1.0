# Physics and X-Ray Rules

## 1. Core principle

**AI extracts and explains. Deterministic code calculates and validates.** Every displayed result must be traceable to an input, calculation, source or clearly labelled assumption.

## 2. Unit conventions

- Roof dimensions: metres (m)
- Area: square metres (m²)
- Module rated power: watts (W)
- System DC nameplate: kWp
- Inverter/AC capacity: kW
- Annual energy: kWh/year
- Azimuth convention: document it (recommended: north 0°, east 90°, south 180°, west 270°)
- Currency: INR

Never mix kW (power) and kWh (energy). Distinguish DC module nameplate capacity from AC inverter capacity.

## 3. Internal quote arithmetic

For `panel_count = N` and verified `panel_rated_power_w = P`:

`module_capacity_kwp = N * P / 1000`

Example: 8 × 540 W = 4.32 kWp. If the quote says 4.0 kW, flag the discrepancy and explain that the quote may be stating AC capacity or using another convention. Do not automatically assert the quote is wrong until DC vs AC meaning is understood.

## 4. Roof capacity / panel packing

MVP approach:

1. Validate positive roof dimensions and obstacle positions.
2. Apply a declared edge setback.
3. Remove obstacle footprint plus a configured conservative clearance.
4. Use a deterministic rectangle/grid packing method and test both portrait/landscape orientations if panel dimensions permit.
5. Return panel count/layout and assumptions.

Do not calculate max panels by simply dividing total area by panel area; that ignores geometry/packing gaps. Keep the algorithm simple, deterministic and tested.

Panel size is model-specific. A 540 W or 550 W label does not imply universal dimensions. Use a verifiable manufacturer's datasheet or label generic assumptions explicitly.

## 5. Shadow approximation

Do not build custom 3D raycasting or claim a perfect 365-day shading engine in this sprint.

Use a limited, defensible approach:

- calculate solar position for representative dates/times if the library/data setup allows;
- estimate shadow direction and length from obstacle geometry and solar altitude;
- exclude conservative shadow polygons/zones from panel-placement area;
- document the sample dates/times and assumptions;
- if this is not implemented reliably, provide a visual preview only and do not claim the panel packing math accounts for annual shadow losses.

At sunrise/sunset the solar altitude approaches zero and the simple `height / tan(altitude)` shadow-length relation becomes unbounded. Set a clearly documented minimum usable altitude or exclude those times; do not use the “lowest sun angle” without a bound.

The R3F sun/shadow animation is an explanatory visual. The backend's panel-fit method and annual generation estimate must not claim to be derived from pixel-perfect frontend shadows.

## 6. PVGIS and generation estimates

- Query PVGIS server-side, not on every frontend slider movement.
- Use timeouts, input validation and cached/reference responses where reasonable.
- Provide exact location, system capacity, tilt, aspect/azimuth and loss assumptions.
- Do not double-apply losses if they are already represented in the PVGIS request/model output.
- Keep the result an estimate/range, not a guarantee.
- If PVGIS is unavailable, return an explicit error or labelled sample mode; do not silently produce invented values.
- Compare a few documented configurations against PVGIS as a sanity/reference test. Report actual measured deviations only.

Official PVGIS API documentation: https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-6/using-pvgis_en

## 7. Generation X-Ray logic

Do not use “vendor claim ≤ model = automatically verified” because a very low claim could be consistent but still not complete, and model uncertainty matters.

Suggested MVP rule:

- `CONSISTENT`: claimed generation falls inside the current modelled range plus a configurable, documented tolerance.
- `ABOVE_MODEL`: claim is above the upper end of the model range but within the chosen discrepancy threshold.
- `HIGH_DISCREPANCY`: claim is materially above the upper range plus the configured margin. Label this as an application heuristic, not a physical law.
- `UNVERIFIED`: missing or unreliable inputs prevent assessment.
- `NEEDS_REVIEW`: model/source/input needs manual confirmation.

Do not call an output `CRITICAL` or `physically impossible` based only on an arbitrary 10% threshold. If a threshold such as 10% is used in the MVP, disclose it as a heuristic and show the actual range/difference.

Every status response should contain: claim, model range, difference if meaningful, assumptions, source/model identifier, reason, and next action.

## 8. Policy checks

Use dated, versioned local JSON snapshots sourced from current official information. No live scraping in the critical request path. If the snapshot is stale or the exact case isn't covered, label it `UNVERIFIED` and direct the user to the official portal.

Central subsidy arithmetic should be parameterized in the policy file, not scattered/hard-coded throughout Python. Verify the applicable category, residence type and current effective date before applying a number. Do not apply residential subsidy rules to a different case without verification.

ALMM/model check: `VERIFIED`, `NOT_FOUND_IN_SNAPSHOT`, or `UNVERIFIED`. `NOT_FOUND_IN_SNAPSHOT` does not automatically prove non-compliance. Record list version/retrieval date and the relevant model/manufacturer fields.

## 9. Price and fairness

Do not declare a quote “fair/unfair” or vendor “fraudulent”. A price depends on equipment, structure, location, roof height, wiring, taxes, net-metering, installation terms, warranties and other details.

MVP should flag missing cost components and internal arithmetic inconsistency. Avoid an unsupported market-price fairness score unless there is a reliable, sourced, comparable benchmark.

## 10. Automated tests to prepare

1. `8 × 540 W = 4.32 kWp` arithmetic.
2. Missing panel count/model returns `NEEDS_REVIEW`, not an invented value.
3. Negative roof size/obstacle outside roof returns validation error.
4. Adding an obstacle cannot increase usable area/panel count for the same packing model.
5. A higher generation claim should not lower discrepancy severity when inputs remain identical.
6. A claim within the modelled range produces `CONSISTENT` only if required inputs are verified.
7. Unavailable PVGIS never returns made-up production.
8. Unknown policy/model returns `UNVERIFIED`.
9. Manual corrections flow into the final audit.
10. Demo/sample values are labelled and never shown as verified actual analysis.
