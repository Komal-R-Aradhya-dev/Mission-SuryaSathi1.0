import json
import os
from pathlib import Path
from typing import List, Optional
from app.schemas import AuditCheck, AuditEvidence, AuditStatus, QuoteClaims


def find_policy_file() -> Optional[Path]:
    """Locates the central policy snapshot JSON file."""
    candidates = [
        Path("data/policy/pm-surya-ghar-central-cfa.json"),
        Path("../data/policy/pm-surya-ghar-central-cfa.json"),
        Path(__file__).resolve().parent.parent.parent / "data" / "policy" / "pm-surya-ghar-central-cfa.json",
        Path(__file__).resolve().parent.parent.parent.parent / "data" / "policy" / "pm-surya-ghar-central-cfa.json",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def run_policy_checks(claims: QuoteClaims) -> List[AuditCheck]:
    """
    Evaluates policy checks against dated local snapshots.
    Never invents subsidy amounts. Returns UNVERIFIED until official dated rules are checked.
    """
    checks: List[AuditCheck] = []
    policy_path = find_policy_file()
    
    policy_data = {}
    if policy_path and policy_path.exists():
        try:
            with open(policy_path, "r", encoding="utf-8") as f:
                policy_data = json.load(f)
        except Exception:
            pass

    verification_status = policy_data.get("verification_status", "not_retrieved")
    rules = policy_data.get("rules", [])
    source_url = policy_data.get("source_url", "https://pmsuryaghar.gov.in/")

    # 1. PM Surya Ghar Central CFA Subsidy Check
    claimed_sub = claims.claimed_subsidy_inr
    claim_str = f"₹{claimed_sub:,.0f}" if (claimed_sub is not None and claimed_sub > 0) else (
        "No explicit subsidy claimed" if claimed_sub == 0 else "Subsidy amount unstated in quote"
    )

    if verification_status != "reviewed" or not rules:
        checks.append(
            AuditCheck(
                id="pm_surya_ghar_subsidy_policy",
                status=AuditStatus.UNVERIFIED,
                title="Central PM Surya Ghar CFA Subsidy",
                claim=claim_str,
                calculation="No verified subsidy rules in local snapshot (status: not_retrieved)",
                reason=(
                    "The central PM Surya Ghar subsidy rule snapshot is marked 'not_retrieved' and "
                    "contains no verified rules. SuryaSathi does not invent or estimate subsidy figures "
                    "without dated official verification from the portal."
                ),
                evidence=[
                    AuditEvidence(
                        type="policy_snapshot",
                        field="verification_status",
                        note="data/policy/pm-surya-ghar-central-cfa.json status is not_retrieved",
                    )
                ],
                recommended_question=(
                    f"Please confirm the applicable PM Surya Ghar subsidy directly from {source_url} "
                    f"and confirm whether this quote is inclusive or exclusive of central financial assistance."
                ),
            )
        )
    else:
        # If rules exist in the future, evaluate them here
        checks.append(
            AuditCheck(
                id="pm_surya_ghar_subsidy_policy",
                status=AuditStatus.NEEDS_REVIEW,
                title="Central PM Surya Ghar CFA Subsidy",
                claim=claim_str,
                calculation="Official rule evaluation pending manual case confirmation",
                reason="Subsidy rules exist but require verification against individual consumer connection type.",
                evidence=[AuditEvidence(type="policy_snapshot", field="rules")],
                recommended_question="Confirm exact subsidy eligibility under PM Surya Ghar rules.",
            )
        )

    # 2. ALMM Compliance Check
    module_model = claims.panel_model
    claim_model_str = module_model if module_model else "Module model unstated in quote"

    checks.append(
        AuditCheck(
            id="almm_module_compliance",
            status=AuditStatus.UNVERIFIED,
            title="ALMM Compliance (Approved List of Models & Manufacturers)",
            claim=claim_model_str,
            calculation="No verified ALMM snapshot loaded in local repository",
            reason=(
                "No verified local snapshot of the MNRE ALMM list is available. "
                "Not finding a model in an unretrieved snapshot does not prove non-compliance."
            ),
            evidence=[
                AuditEvidence(
                    type="policy_snapshot",
                    note="Official ALMM snapshot pending dated verified capture",
                )
            ],
            recommended_question=(
                "Is this solar module model explicitly listed on the current MNRE Approved List of "
                "Models and Manufacturers (ALMM) required for subsidy eligibility?"
            ),
        )
    )

    return checks
