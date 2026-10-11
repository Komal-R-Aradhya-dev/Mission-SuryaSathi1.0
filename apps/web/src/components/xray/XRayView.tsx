"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAnalysis } from "@/components/providers/AnalysisProvider";
import { buttonPrimary, buttonSecondary } from "@/components/site/styles";
import { LoadingState } from "@/components/ui/LoadingState";
import { ClaimCard } from "@/components/xray/ClaimCard";
import { InstallerQuestions } from "@/components/xray/InstallerQuestions";
import { statusMeaning } from "@/components/xray/AuditStatusBadge";
import { AUDIT_STATUSES, type SimulationResponse } from "@/lib/api/types";
import { SAMPLE_BANNER } from "@/lib/analysis/sampleFixture";

export function XRayView() {
  const router = useRouter();
  const params = useSearchParams();
  const { result, draft, openSample, hydrated } = useAnalysis();
  const consumed = useRef(false);

  useEffect(() => {
    if (!hydrated || consumed.current) return;
    if (params.get("sample") === "1") {
      consumed.current = true;
      openSample();
    }
  }, [hydrated, openSample, params]);

  if (!hydrated) return <LoadingState label="Restoring the X-Ray" />;

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs tracking-[0.18em] text-amber uppercase">Solar Quote X-Ray</p>
      <h1 className="font-display mt-2 text-4xl font-normal text-ivory sm:text-6xl">Claim, model, evidence.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-ivory-dim">
        Status words carry the meaning. Colour only repeats them. This screen does not call a vendor fraudulent.
      </p>

      {!result ? (
        <div className="mt-8 rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl text-ivory">No audit is loaded</h2>
          <p className="mt-2 text-sm leading-6 text-ivory-dim">
            Run the analysis, or open the fixed sample. An empty page is not a passing result.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/analyze" className={buttonPrimary}>Go to analysis</Link>
            <button type="button" className={buttonSecondary} onClick={() => { openSample(); router.push("/xray"); }}>
              Open illustrative sample
            </button>
          </div>
        </div>
      ) : null}

      {result?.kind === "unavailable" ? (
        <div className="mt-8 space-y-6">
          <div role="status" className="rounded-3xl border border-amber/40 bg-amber/10 p-6">
            <h2 className="text-xl text-ivory">Audit not available</h2>
            <p className="mt-2 text-sm leading-6 text-ivory">{result.message}</p>
            <p className="mt-3 text-sm leading-6 text-ivory-dim">
              The entries below are what you typed. They have not been checked, and they do not have a status.
            </p>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Item label="Annual use" value={draft.bill.annual_units_kwh || "—"} />
            <Item label="Sanctioned load" value={draft.bill.sanctioned_load_kw || "—"} />
            <Item label="Roof" value={draft.terrace.length_m && draft.terrace.width_m ? `${draft.terrace.length_m} × ${draft.terrace.width_m} m` : "—"} />
            <Item label="Claimed size" value={draft.quote.claimed_system_size_kw || "—"} />
            <Item label="Claimed generation" value={draft.quote.claimed_annual_generation_kwh || "—"} />
            <Item label="Module count" value={draft.quote.panel_count || "—"} />
          </dl>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/analyze" className={buttonPrimary}>Edit entries</Link>
            <button type="button" className={buttonSecondary} onClick={() => openSample()}>
              Open illustrative sample instead
            </button>
          </div>
        </div>
      ) : null}

      {result && result.kind !== "unavailable" ? (
        <div className="mt-8 space-y-8">
          {result.kind === "sample" ? (
            <div className="rounded-3xl border border-dashed border-amber bg-amber/10 p-5">
              <p className="text-sm font-medium tracking-wide text-amber uppercase">{SAMPLE_BANNER}</p>
              <p className="mt-2 text-sm leading-6 text-ivory">
                These figures are a fixed demonstration. They were not calculated from your bill, roof, or quote, and they are not a PVGIS result.
              </p>
            </div>
          ) : (
            <p className="text-sm text-mint">Showing the audit returned by the API. Simulation {result.simulation.simulation_id}.</p>
          )}
          <p className="max-w-3xl text-lg leading-8 text-ivory">{result.audit.summary}</p>
          <SimulationPanel simulation={result.simulation} sample={result.kind === "sample"} />
          <div className="space-y-4">
            {result.audit.checks.map((check) => (
              <ClaimCard key={check.id} check={check} />
            ))}
            {result.audit.policy_checks.map((check) => (
              <ClaimCard key={check.id} check={check} />
            ))}
          </div>
          <section>
            <h2 className="font-display text-3xl font-normal text-ivory">Ask before you pay</h2>
            <div className="mt-4">
              <InstallerQuestions
                questions={[
                  ...result.audit.recommended_questions,
                  ...result.audit.checks.map((check) => check.recommended_question),
                  ...result.audit.policy_checks.map((check) => check.recommended_question),
                ]}
              />
            </div>
          </section>
          <section>
            <h2 className="text-sm tracking-[0.16em] text-ivory-dim uppercase">What the statuses mean</h2>
            <ul className="mt-3 space-y-2 text-sm text-ivory-dim">
              {AUDIT_STATUSES.map((status) => (
                <li key={status}>
                  <span className="text-ivory">{statusMeaning(status).label}.</span> {statusMeaning(status).meaning}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-sm tracking-[0.16em] text-ivory-dim uppercase">Limitations</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ivory-dim">
              {result.audit.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
              <li>Frontend shadows are a visualization, not the annual shading model.</li>
            </ul>
          </section>
          <Link href="/report" className={buttonPrimary}>Open the Before You Pay report</Link>
        </div>
      ) : null}
    </div>
  );
}

function SimulationPanel({ simulation, sample }: { simulation: SimulationResponse; sample: boolean }) {
  return (
    <section className="rounded-3xl border border-white/10 p-5">
      <h2 className="text-lg text-ivory">{sample ? "Sample band" : "Model range from the API"}</h2>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <Item label="Feasible system" value={`${simulation.feasible_system_kw.min.toLocaleString("en-IN")}–${simulation.feasible_system_kw.max.toLocaleString("en-IN")} kW`} />
        <Item label="Module count in this result" value={String(simulation.panel_count)} />
        <Item label="Nameplate in this result" value={`${simulation.panel_capacity_kwp.toLocaleString("en-IN")} kWp`} />
        <Item label="Usable roof area" value={`${simulation.usable_roof_area_m2.toLocaleString("en-IN")} m²`} />
        <Item label="Annual generation range" value={`${simulation.estimated_generation_kwh_year.min.toLocaleString("en-IN")}–${simulation.estimated_generation_kwh_year.max.toLocaleString("en-IN")} kWh/year`} />
      </dl>
      <p className="mt-4 text-sm leading-6 text-ivory-dim">{simulation.generation_method}</p>
      <p className="mt-2 text-sm leading-6 text-ivory-dim">{simulation.shadow_method}</p>
      {simulation.assumptions.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ivory-dim">
          {simulation.assumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ivory-dim">{label}</dt>
      <dd className="mt-1 font-mono text-ivory">{value}</dd>
    </div>
  );
}
