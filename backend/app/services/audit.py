import uuid
from typing import List, Optional
from app.schemas import (
    AuditCheck,
    AuditEvidence,
    AuditRequest,
    AuditResponse,
    AuditStatus,
    QuoteClaims,
    SimulationResponse,
)
from app.services.policy import run_policy_checks
from app.tokens import decode_simulation_token


def run_audit(
    request: AuditRequest,
    resolved_simulation: Optional[SimulationResponse] = None,
) -> AuditResponse:
    """
    Executes a deterministic audit comparing vendor quote claims against the
    rooftop simulation model and local verified policy snapshots.
    """
    # 1. Resolve simulation object statelessly
    simulation = resolved_simulation
    if simulation is None and request.simulation is not None:
        simulation = request.simulation
    if simulation is None:
        simulation = decode_simulation_token(request.simulation_id)

    claims = request.quote_claims
    confirmed = set(request.confirmed_fields)

    checks: List[AuditCheck] = []
    questions: List[str] = []

    # Check 1: Module Count & Rated Power Arithmetic
    panel_count = claims.panel_count
    panel_w = claims.panel_rated_power_w
    claimed_kw = claims.claimed_system_size_kw

    if panel_count is not None and panel_w is not None and panel_count > 0 and panel_w > 0:
        calc_kwp = round((panel_count * panel_w) / 1000.0, 3)
        calc_str = f"{panel_count} × {panel_w:.0f} W = {calc_kwp:.2f} kWp"

        if claimed_kw is not None and claimed_kw > 0:
            diff = abs(calc_kwp - claimed_kw)
            claim_str = f"{claimed_kw:.2f} kW"

            if diff < 0.05:
                # Arithmetic matches perfectly
                if "claimed_system_size_kw" in confirmed or "panel_count" in confirmed:
                    status = AuditStatus.CONSISTENT
                    reason = (
                        f"The arithmetic module nameplate capacity ({calc_kwp:.2f} kWp) agrees "
                        f"with the quoted system capacity ({claimed_kw:.2f} kW)."
                    )
                else:
                    status = AuditStatus.NEEDS_REVIEW
                    reason = (
                        f"Arithmetic aligns ({calc_kwp:.2f} kWp), but quote fields require user confirmation."
                    )
                q = "Confirm whether the installation will include all specified modules as per the manufacturer datasheet."
            else:
                # Discrepancy
                inv_kw = claims.inverter_capacity_kw
                if inv_kw is not None and abs(inv_kw - claimed_kw) < 0.05:
                    status = AuditStatus.NEEDS_REVIEW
                    title = "Quoted Capacity Reflects Inverter AC Size Rather Than DC Array"
                    reason = (
                        f"The quoted system capacity ({claimed_kw:.2f} kW) matches the AC inverter size ({inv_kw:.2f} kW), "
                        f"while the DC solar array nameplate is {calc_kwp:.2f} kWp. An AC/DC sizing ratio around 1.1–1.3 is common, "
                        f"but vendors should clearly label DC vs AC capacity."
                    )
                    q = "Can you confirm whether the quoted system size refers to DC peak capacity (kWp) or AC inverter output (kW)?"
                else:
                    status = AuditStatus.INCONSISTENT
                    title = "Module Count and Quoted Capacity Differ"
                    reason = (
                        f"The arithmetic nameplate capacity ({calc_kwp:.2f} kWp) differs from the stated system capacity ({claimed_kw:.2f} kW). "
                        f"Confirm whether the quote refers to AC inverter capacity or DC module capacity."
                    )
                    q = "Can you clarify the discrepancy between the stated system capacity and the module arithmetic (count × wattage)?"

            checks.append(
                AuditCheck(
                    id="module_capacity_arithmetic",
                    status=status,
                    title="Module Capacity Arithmetic",
                    claim=claim_str,
                    calculation=calc_str,
                    reason=reason,
                    evidence=[
                        AuditEvidence(type="quote_field", field="panel_count", note=str(panel_count)),
                        AuditEvidence(type="quote_field", field="panel_rated_power_w", note=f"{panel_w} W"),
                    ],
                    recommended_question=q,
                )
            )
            questions.append(q)
        else:
            checks.append(
                AuditCheck(
                    id="module_capacity_arithmetic",
                    status=AuditStatus.NEEDS_REVIEW,
                    title="Module Capacity Arithmetic",
                    claim="System capacity unstated",
                    calculation=calc_str,
                    reason=f"Calculated nameplate is {calc_kwp:.2f} kWp, but the quote does not explicitly state a total system size.",
                    evidence=[AuditEvidence(type="quote_field", field="panel_count")],
                    recommended_question="What is the formal stated system capacity (kW/kWp) on the contract?",
                )
            )
    else:
        checks.append(
            AuditCheck(
                id="module_capacity_arithmetic",
                status=AuditStatus.INFORMATION_MISSING,
                title="Module Capacity Specification Incomplete",
                claim=f"{claimed_kw:.2f} kW" if claimed_kw else "Unstated",
                calculation="Requires panel count × panel rated wattage",
                reason=(
                    "The quote does not specify both panel count and panel rated wattage. "
                    "Arithmetic module nameplate capacity cannot be verified without these entries."
                ),
                evidence=[AuditEvidence(type="quote_field", field="panel_count", note="missing")],
                recommended_question="What is the exact panel model, rated wattage (Wp), and total quantity of modules in this quote?",
            )
        )
        questions.append("What is the exact panel model, rated wattage (Wp), and total quantity of modules in this quote?")

    # Check 2: Annual Generation Claim vs Simulation Range
    claimed_gen = claims.claimed_annual_generation_kwh
    if simulation is not None and simulation.estimated_generation_kwh_year is not None:
        min_g = simulation.estimated_generation_kwh_year.min
        max_g = simulation.estimated_generation_kwh_year.max
    else:
        min_g, max_g = 0.0, 0.0

    if claimed_gen is not None and claimed_gen > 0:
        claim_gen_str = f"{claimed_gen:,.0f} kWh/year"

        if max_g == 0.0:
            status = AuditStatus.UNVERIFIED
            reason = (
                "The solar yield reference model is unavailable or unverified. "
                "Vendor generation claims cannot be assessed without an independent yield model."
            )
            q = "Can you share the simulation report (e.g., PVGIS, HelioScope) used to derive this generation claim?"
            calc_gen = "Model yield unavailable (0 kWh/year)"
        elif claimed_gen <= max_g * 1.05 and claimed_gen >= min_g * 0.90:
            if "claimed_annual_generation_kwh" in confirmed:
                status = AuditStatus.CONSISTENT
                reason = (
                    f"The vendor's generation claim ({claimed_gen:,.0f} kWh/year) falls inside "
                    f"the modelled reference range ({min_g:,.0f}–{max_g:,.0f} kWh/year)."
                )
            else:
                status = AuditStatus.NEEDS_REVIEW
                reason = (
                    f"The vendor's generation claim ({claimed_gen:,.0f} kWh/year) is within the modelled range "
                    f"({min_g:,.0f}–{max_g:,.0f} kWh/year), but requires confirmation of input values."
                )
            calc_gen = f"Model range: {min_g:,.0f}–{max_g:,.0f} kWh/year"
            q = "Does the quote include a performance degradation guarantee for subsequent years?"
        elif claimed_gen > max_g * 1.05 and claimed_gen <= max_g * 1.15:
            status = AuditStatus.ABOVE_MODEL
            pct = ((claimed_gen - max_g) / max_g) * 100.0
            calc_gen = f"Model upper bound: {max_g:,.0f} kWh/year (diff: +{pct:.1f}%)"
            reason = (
                f"The vendor's generation claim ({claimed_gen:,.0f} kWh/year) is {pct:.1f}% above the modelled "
                f"upper range ({max_g:,.0f} kWh/year). Disclosed heuristic: 5% to 15% above model."
            )
            q = "What specific tilt, orientation, and loss assumptions were used to estimate this yield above reference benchmarks?"
        elif claimed_gen > max_g * 1.15:
            status = AuditStatus.HIGH_DISCREPANCY
            pct = ((claimed_gen - max_g) / max_g) * 100.0
            calc_gen = f"Model upper bound: {max_g:,.0f} kWh/year (diff: +{pct:.1f}%)"
            reason = (
                f"The vendor's generation claim ({claimed_gen:,.0f} kWh/year) materially exceeds the modelled "
                f"upper range ({max_g:,.0f} kWh/year) by {pct:.1f}%. Disclosed application heuristic: >15% above model."
            )
            q = "Can the installer provide a formal yield simulation and an output guarantee for this generation figure?"
        else:  # Below minimum
            status = AuditStatus.NEEDS_REVIEW
            calc_gen = f"Model lower bound: {min_g:,.0f} kWh/year"
            reason = (
                f"The vendor's generation claim ({claimed_gen:,.0f} kWh/year) is lower than the expected "
                f"modelled range ({min_g:,.0f}–{max_g:,.0f} kWh/year). Verify whether conservative shading was factored in."
            )
            q = "Are conservative local shading factors or special loss parameters incorporated into this generation figure?"

        checks.append(
            AuditCheck(
                id="annual_generation_claim",
                status=status,
                title="Annual Generation Claim vs Model Range",
                claim=claim_gen_str,
                calculation=calc_gen,
                reason=reason,
                evidence=[
                    AuditEvidence(type="quote_field", field="claimed_annual_generation_kwh"),
                    AuditEvidence(type="model_range", note=f"{min_g:.0f}–{max_g:.0f} kWh/year"),
                ],
                recommended_question=q,
            )
        )
        questions.append(q)
    else:
        checks.append(
            AuditCheck(
                id="annual_generation_claim",
                status=AuditStatus.INFORMATION_MISSING,
                title="Annual Generation Estimate Unstated",
                claim="No generation estimate stated",
                calculation=f"Model range: {min_g:,.0f}–{max_g:,.0f} kWh/year" if max_g > 0 else "Model uncomputed",
                reason="The quotation does not state expected annual electricity generation in kWh (units/year).",
                evidence=[AuditEvidence(type="quote_field", field="claimed_annual_generation_kwh", note="missing")],
                recommended_question="What is the guaranteed or expected first-year generation in kWh (units) under normal weather?",
            )
        )
        questions.append("What is the guaranteed or expected first-year generation in kWh (units) under normal weather?")

    # Check 3: Inverter Specification and Sizing
    inv_kw = claims.inverter_capacity_kw
    inv_model = claims.inverter_model
    if inv_kw is not None and inv_kw > 0:
        claim_inv = f"{inv_kw:.2f} kW ({inv_model or 'Model unstated'})"
        if panel_count and panel_w:
            dc_kwp = (panel_count * panel_w) / 1000.0
            ratio = dc_kwp / inv_kw
            calc_inv = f"DC/AC ratio: {dc_kwp:.2f} kWp / {inv_kw:.2f} kW = {ratio:.2f}"
            if 1.0 <= ratio <= 1.35:
                status_inv = AuditStatus.CONSISTENT
                reason_inv = (
                    f"DC/AC ratio is {ratio:.2f}, inside SuryaSathi's broad screening interval (1.0–1.35). "
                    "Confirm the final ratio against the inverter datasheet and installer design."
                )
                q_inv = "What is the warranty coverage on the inverter (standard 5-year vs extended 10-year)?"
            else:
                status_inv = AuditStatus.NEEDS_REVIEW
                reason_inv = (
                    f"DC/AC ratio is {ratio:.2f}. A ratio outside 1.0–1.35 may cause inverter clipping or inefficient low-load operation."
                )
                q_inv = "What is the engineering rationale for the chosen DC-to-AC sizing ratio?"
        else:
            calc_inv = f"Inverter capacity: {inv_kw:.2f} kW"
            status_inv = AuditStatus.NEEDS_REVIEW
            reason_inv = "Inverter capacity is specified, but DC module capacity is incomplete so sizing ratio cannot be verified."
            q_inv = "Confirm DC module peak capacity to evaluate inverter matching."

        checks.append(
            AuditCheck(
                id="inverter_specification",
                status=status_inv,
                title="Inverter Specification and Sizing",
                claim=claim_inv,
                calculation=calc_inv,
                reason=reason_inv,
                evidence=[AuditEvidence(type="quote_field", field="inverter_capacity_kw")],
                recommended_question=q_inv,
            )
        )
        questions.append(q_inv)
    else:
        checks.append(
            AuditCheck(
                id="inverter_specification",
                status=AuditStatus.INFORMATION_MISSING,
                title="Inverter Specification Missing",
                claim="No inverter model or capacity specified",
                calculation="Requires inverter model and capacity (kW)",
                reason="The quotation does not state an inverter model or capacity. The inverter is the primary active electronic component.",
                evidence=[AuditEvidence(type="quote_field", field="inverter_model", note="missing")],
                recommended_question="Which inverter brand, model, and rated capacity (kW) are included in this quotation?",
            )
        )
        questions.append("Which inverter brand, model, and rated capacity (kW) are included in this quotation?")

    # Check 4: Net Metering Scope
    if claims.net_metering_included is None:
        q_nm = "Are DISCOM net-metering liaison fees, meter charges, and CEIG inspection fees included in the total quote price?"
        checks.append(
            AuditCheck(
                id="net_metering_scope",
                status=AuditStatus.INFORMATION_MISSING,
                title="Net Metering and DISCOM Approval Scope",
                claim="Net metering scope unstated",
                calculation="Verify inclusion of DISCOM liaison and meter charges",
                reason=(
                    "The quote does not state whether DISCOM net-metering application, inspection, "
                    "and bi-directional meter charges are included in the price."
                ),
                evidence=[AuditEvidence(type="quote_field", field="net_metering_included", note="missing")],
                recommended_question=q_nm,
            )
        )
        questions.append(q_nm)

    # Check 5: Warranty Scope
    if not claims.warranty_text:
        q_war = "What are the exact separate warranty terms for module product (10-12 yrs), module performance (25 yrs), inverter (5-10 yrs), and EPC workmanship?"
        checks.append(
            AuditCheck(
                id="warranty_scope",
                status=AuditStatus.INFORMATION_MISSING,
                title="Warranty Terms Scope",
                claim="No warranty text specified",
                calculation="Requires module product, performance, inverter, and workmanship warranties",
                reason="The quote lacks explicit itemized warranty durations for panels, inverter, structure, and workmanship.",
                evidence=[AuditEvidence(type="quote_field", field="warranty_text", note="missing")],
                recommended_question=q_war,
            )
        )
        questions.append(q_war)

    # Check 6: Price presence and scope (no unsupported market-fairness score)
    if claims.quoted_price_inr is None or claims.quoted_price_inr <= 0:
        price_status = AuditStatus.INFORMATION_MISSING
        price_claim = "Total quoted price unstated"
        price_reason = (
            "The quotation total was not provided, so SuryaSathi cannot review the stated amount "
            "or whether the contract includes the major installation components."
        )
        price_question = (
            "Please provide the complete itemized price, including modules, inverter, mounting structure, "
            "wiring/protection, installation, taxes, net-metering/inspection fees, and any exclusions."
        )
        price_calculation = "Requires a positive total price and an itemized scope"
    else:
        price_status = AuditStatus.NEEDS_REVIEW
        price_claim = f"₹{claims.quoted_price_inr:,.0f} total quoted price"
        price_reason = (
            "A total amount is present, but SuryaSathi has no verified like-for-like local price benchmark "
            "and cannot label this quote fair or unfair. Confirm the itemized scope and exclusions."
        )
        price_question = (
            "Can you provide an itemized breakdown and confirm whether taxes, mounting, wiring/protection, "
            "installation, net-metering, and inspection charges are included?"
        )
        price_calculation = "No market-price fairness score is applied"
    checks.append(
        AuditCheck(
            id="quoted_price_and_scope",
            status=price_status,
            title="Quoted Price and Included Scope",
            claim=price_claim,
            calculation=price_calculation,
            reason=price_reason,
            evidence=[AuditEvidence(type="quote_field", field="quoted_price_inr")],
            recommended_question=price_question,
        )
    )
    questions.append(price_question)

    # Policy and ALMM checks
    policy_checks = run_policy_checks(claims)
    for pc in policy_checks:
        if pc.recommended_question:
            questions.append(pc.recommended_question)

    # Summary synthesis
    inconsistent_count = sum(1 for c in checks if c.status == AuditStatus.INCONSISTENT)
    high_disc_count = sum(1 for c in checks if c.status == AuditStatus.HIGH_DISCREPANCY)
    above_model_count = sum(1 for c in checks if c.status == AuditStatus.ABOVE_MODEL)
    missing_count = sum(1 for c in checks if c.status == AuditStatus.INFORMATION_MISSING)

    if inconsistent_count > 0 or high_disc_count > 0:
        summary = (
            f"The audit found {inconsistent_count + high_disc_count} critical discrepancy item(s) "
            f"and {missing_count} missing specification(s). Review vendor claims and ask the recommended questions before paying."
        )
    elif above_model_count > 0:
        summary = (
            f"The vendor's generation claim is above the reference model range ({above_model_count} item). "
            f"Clarify system assumptions and inverter sizing before committing."
        )
    else:
        summary = (
            "Preliminary checks completed. Several key fields and subsidy policies require official verification "
            "before contract signing."
        )

    limitations = [
        "SuryaSathi is a pre-purchase consumer decision support tool, not a certified site survey or structural engineering audit.",
        "Deterministic panel packing uses 2D geometric clearance and conservative representative shadow exclusions.",
        "Yield estimates are based on JRC PVGIS reference meteorology and standard 14% system loss assumptions.",
        "Central subsidy rules reflect official snapshot verification status; no subsidy amounts are estimated without dated portal confirmation.",
        "Check all findings directly with your installer and local DISCOM before signing a contract or paying an advance.",
    ]

    # Deduplicate questions preserving order
    dedup_questions = []
    seen = set()
    for q in questions:
        if q and q not in seen:
            seen.add(q)
            dedup_questions.append(q)

    return AuditResponse(
        audit_id=f"audit_{uuid.uuid4().hex[:12]}",
        summary=summary,
        checks=checks,
        policy_checks=policy_checks,
        recommended_questions=dedup_questions,
        limitations=limitations,
    )
