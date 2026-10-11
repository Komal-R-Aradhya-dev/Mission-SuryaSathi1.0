"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useAnalysis } from "@/components/providers/AnalysisProvider";
import { buttonSecondary } from "@/components/site/styles";
import { LoadingState } from "@/components/ui/LoadingState";
import { AuditStatusBadge } from "@/components/xray/AuditStatusBadge";
import { InstallerQuestions } from "@/components/xray/InstallerQuestions";
import { SAMPLE_BANNER } from "@/lib/analysis/sampleFixture";

let stamp = "";

function subscribeStamp() {
  return () => undefined;
}

function getStamp() {
  if (!stamp) stamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return stamp;
}

export function ReportSummary() {
  const { result, hydrated } = useAnalysis();
  const printedAt = useSyncExternalStore(subscribeStamp, getStamp, () => "");

  if (!hydrated) return <LoadingState label="Restoring the report" />;

  if (!result || result.kind === "unavailable") {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-normal">Before You Pay</h1>
        <p className="mt-4 text-sm leading-6 text-ivory-dim">
          {result?.kind === "unavailable"
            ? result.message
            : "There is no audit to print yet. A blank report is not a result."}
        </p>
        <Link href="/analyze" className={`${buttonSecondary} mt-6`}>
          Return to analysis
        </Link>
      </div>
    );
  }

  const sample = result.kind === "sample";

  return (
    <article className="report-sheet mx-auto max-w-3xl">
      <div className="no-print mb-6">
        <button type="button" className={buttonSecondary} onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>
      {sample ? (
        <p className="mb-4 border border-dashed border-amber px-3 py-2 text-sm text-amber uppercase">{SAMPLE_BANNER}</p>
      ) : (
        <p className="mb-4 text-sm text-mint">API audit {result.audit.audit_id}</p>
      )}
      <p className="text-xs tracking-[0.18em] text-amber uppercase">SuryaSathi</p>
      <h1 className="font-display mt-2 text-5xl font-normal">Before You Pay</h1>
      <p className="mt-2 text-sm text-ivory-dim">{printedAt ? `Prepared ${printedAt} IST` : "Prepared locally"}</p>
      <p className="mt-6 text-lg leading-8">{result.audit.summary}</p>
      <section className="mt-8">
        <h2 className="text-xl">Model range</h2>
        <p className="mt-2 text-sm leading-6 text-ivory-dim">
          {result.simulation.estimated_generation_kwh_year.min.toLocaleString("en-IN")}–
          {result.simulation.estimated_generation_kwh_year.max.toLocaleString("en-IN")} kWh/year. {result.simulation.generation_method}
        </p>
        <p className="mt-2 text-sm leading-6 text-ivory-dim">{result.simulation.shadow_method}</p>
      </section>
      <section className="mt-8 space-y-6">
        {[...result.audit.checks, ...result.audit.policy_checks].map((check) => (
          <section key={check.id} className="border-t border-white/15 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg">{check.title}</h2>
              <AuditStatusBadge status={check.status} />
            </div>
            <p className="mt-2 text-sm"><span className="text-ivory-dim">Claim. </span>{check.claim}</p>
            <p className="mt-2 text-sm"><span className="text-ivory-dim">Calculation. </span>{check.calculation}</p>
            <p className="mt-2 text-sm leading-6">{check.reason}</p>
            {check.recommended_question ? <p className="mt-2 text-sm">Ask: {check.recommended_question}</p> : null}
          </section>
        ))}
      </section>
      <section className="mt-8">
        <h2 className="text-xl">Questions to take to the installer</h2>
        <div className="mt-3">
          <InstallerQuestions
            questions={[
              ...result.audit.recommended_questions,
              ...result.audit.checks.map((check) => check.recommended_question),
            ]}
          />
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-xl">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ivory-dim">
          {result.audit.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>This report is decision support. It is not a certified electrical, structural, or shading survey.</li>
          <li>No subsidy rupee amount in this project has been verified against the official portal.</li>
        </ul>
      </section>
    </article>
  );
}
