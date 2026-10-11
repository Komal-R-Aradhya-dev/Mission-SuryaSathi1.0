import type { AuditResponse, SimulationResponse } from "@/lib/api/types";

export const SAMPLE_BANNER = "Illustrative sample — not a real audit";

/**
 * Fixed teaching fixture. These figures are not computed from user input,
 * not copied from the API contract examples, and not a PVGIS or policy result.
 */
export const sampleSimulation: SimulationResponse = {
  simulation_id: "sample_not_a_simulation",
  feasible_system_kw: { min: 4.2, max: 4.9 },
  panel_count: 9,
  panel_capacity_kwp: 4.905,
  usable_roof_area_m2: 48,
  estimated_generation_kwh_year: { min: 5100, max: 5900 },
  generation_method:
    "Illustrative sample range written for the interface. This is not a PVGIS response and not a yield calculated for a real roof.",
  shadow_method:
    "No shading calculation was run for this sample. The 3D sun path remains a visualization only.",
  assumptions: [
    "Fixed sample terrace, not the dimensions entered in the form.",
    "Sample module used only inside this fixture: 9 modules at 545 W.",
    "The 5,100–5,900 kWh/year band is invented for the demonstration and must not be quoted as a model result.",
  ],
  warnings: [SAMPLE_BANNER],
};

export const sampleAudit: AuditResponse = {
  audit_id: "sample_not_a_real_audit",
  summary:
    "Illustrative sample only. Nothing here was calculated from your bill, roof, or quote, and no vendor has been assessed.",
  checks: [
    {
      id: "sample_nameplate",
      status: "NEEDS_REVIEW",
      title: "Quoted size and sample nameplate need a DC/AC clarification",
      claim: "Sample quote says 5.0 kW",
      calculation: "Sample arithmetic shown for the story: 9 × 545 W = 4.905 kWp. This was not computed from your entries.",
      reason:
        "A small gap like this can mean the quote is stating AC inverter capacity while the modules sum to a different DC nameplate. The sample asks for clarification. It does not call the figure wrong.",
      evidence: [
        { type: "illustrative_sample", note: "Fixed fixture, not an API calculation." },
        { type: "quote_field", field: "claimed_system_size_kw" },
      ],
      recommended_question:
        "Is 5.0 kW the DC module nameplate or the AC inverter rating, and can you share the module datasheet?",
    },
    {
      id: "sample_generation",
      status: "HIGH_DISCREPANCY",
      title: "Sample generation claim sits above the sample band",
      claim: "Sample quote expects 7,900 kWh/year",
      calculation:
        "Sample band 5,100–5,900 kWh/year. The fixture’s stated heuristic treats a claim more than 15% above the upper end (above 6,785) as HIGH_DISCREPANCY. 7,900 exceeds that sample threshold. This heuristic is not a physical law and was not applied to your inputs.",
      reason:
        "In a real audit this status would mean the claim needs the installer’s simulation assumptions. Here it only shows how the screen reads.",
      evidence: [
        { type: "illustrative_sample", note: "Generation numbers are fictional." },
        { type: "model_range", note: "Not returned by PVGIS." },
      ],
      recommended_question:
        "Can you share the simulation report, weather file, tilt, azimuth, and loss assumptions behind the annual-generation claim?",
    },
    {
      id: "sample_inverter",
      status: "INFORMATION_MISSING",
      title: "Inverter model and warranty text are absent in the sample quote",
      claim: "No inverter model or warranty wording in the sample",
      calculation: "No comparison was possible.",
      reason: "Missing equipment details stay unresolved until the quote states them. Nothing is inferred.",
      evidence: [{ type: "illustrative_sample", field: "inverter_model" }],
      recommended_question:
        "Which inverter model is included, and what do the module, inverter, and workmanship warranties cover?",
    },
  ],
  policy_checks: [
    {
      id: "sample_subsidy",
      status: "UNVERIFIED",
      title: "Sample subsidy figure is not checked against a policy snapshot",
      claim: "Sample quote states a subsidy of ₹90,000",
      calculation:
        "No subsidy rule was applied. data/policy/pm-surya-ghar-central-cfa.json is marked not_retrieved and contains no amounts.",
      reason:
        "Without a dated official snapshot matched to this household, the subsidy claim cannot be confirmed or rejected.",
      evidence: [
        {
          type: "policy_snapshot",
          note: "verification_status=not_retrieved; rules empty",
        },
      ],
      recommended_question:
        "Which scheme category, consumer type, and official calculator produced this subsidy figure?",
    },
    {
      id: "sample_almm",
      status: "UNVERIFIED",
      title: "Sample module name is not matched to an ALMM list",
      claim: "Module name in the sample: SampleModule 545",
      calculation: "No approved-list snapshot is loaded, so the model was not looked up.",
      reason:
        "Not found in a snapshot is different from a legal finding. This sample does not claim non-compliance.",
      evidence: [{ type: "illustrative_sample", note: "No ALMM file is shipped as verified." }],
      recommended_question: "What is the exact manufacturer and model code printed on the module datasheet?",
    },
  ],
  recommended_questions: [
    "Is 5.0 kW the DC module nameplate or the AC inverter rating?",
    "Can you share the simulation assumptions behind 7,900 kWh/year?",
    "Which official scheme category does the subsidy figure use?",
  ],
  limitations: [
    SAMPLE_BANNER + ". These checks are a fixed script for the interface.",
    "Preliminary decision support; not a certified site survey.",
    "No PVGIS call, no Textract extraction, and no reviewed subsidy amount were used.",
    "The on-screen sun and shadows are visualizations, not an annual shade-loss model.",
  ],
};
