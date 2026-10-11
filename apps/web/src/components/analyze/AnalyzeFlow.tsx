"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, audit, getHealth, isApiConfigured, simulate } from "@/lib/api/apiClient";
import type { ExtractedField } from "@/lib/api/types";
import { useAnalysis } from "@/components/providers/AnalysisProvider";
import { UploadDropzone } from "@/components/analyze/UploadDropzone";
import { CheckField, TextInput } from "@/components/analyze/fields";
import { RoofConfigurator } from "@/components/analyze/RoofConfigurator";
import { SolarTwin } from "@/components/analyze/SolarTwin";
import { buttonPrimary, buttonSecondary } from "@/components/site/styles";
import { LoadingState, ErrorState } from "@/components/ui/LoadingState";
import { validateAnalysis, type FieldErrors } from "@/lib/analysis/validation";

const steps = ["Bill", "Roof", "Quote", "Review"];

export function AnalyzeFlow() {
  const router = useRouter();
  const { draft, setDraft, setResult, openSample, hydrated } = useAnalysis();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [apiNote, setApiNote] = useState(() =>
    isApiConfigured()
      ? "Checking the API…"
      : "Backend URL is not set. You can still enter everything. A yield will not be invented if you run the audit.",
  );
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!isApiConfigured()) return;
    let cancelled = false;
    getHealth()
      .then((health) => {
        if (!cancelled) setApiNote(`API responded: ${health.service} ${health.version} (${health.status}).`);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof ApiError ? error.message : "The health check failed.";
        setApiNote(`${message} Manual entry still works.`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hydrated) return <LoadingState label="Restoring your entries" />;

  function applyFields(target: "bill" | "quote", fields: Record<string, ExtractedField>, nextWarnings: string[]) {
    setWarnings(nextWarnings);
    setDraft((current) => {
      const next = structuredClone(current);
      const write = (key: string, assign: (value: string) => void) => {
        const field = fields[key];
        if (!field || field.value === null || field.value === undefined) return;
        assign(String(field.value));
      };
      if (target === "bill") {
        write("annual_units_kwh", (value) => {
          next.bill.annual_units_kwh = value;
        });
        write("sanctioned_load_kw", (value) => {
          next.bill.sanctioned_load_kw = value;
        });
        next.bill.confirmed = false;
      } else {
        write("vendor_name", (value) => {
          next.quote.vendor_name = value;
        });
        write("claimed_system_size_kw", (value) => {
          next.quote.claimed_system_size_kw = value;
        });
        write("claimed_annual_generation_kwh", (value) => {
          next.quote.claimed_annual_generation_kwh = value;
        });
        write("panel_model", (value) => {
          next.quote.panel_model = value;
        });
        write("panel_rated_power_w", (value) => {
          next.quote.panel_rated_power_w = value;
        });
        write("panel_count", (value) => {
          next.quote.panel_count = value;
        });
        write("inverter_model", (value) => {
          next.quote.inverter_model = value;
        });
        write("inverter_capacity_kw", (value) => {
          next.quote.inverter_capacity_kw = value;
        });
        write("quoted_price_inr", (value) => {
          next.quote.quoted_price_inr = value;
        });
        write("claimed_subsidy_inr", (value) => {
          next.quote.claimed_subsidy_inr = value;
        });
        write("warranty_text", (value) => {
          next.quote.warranty_text = value;
        });
        next.quote.confirmed = {
          claimed_system_size_kw: false,
          claimed_annual_generation_kwh: false,
          panel_count: false,
          panel_rated_power_w: false,
          quoted_price_inr: false,
          claimed_subsidy_inr: false,
        };
      }
      return next;
    });
  }

  async function runAudit() {
    const validated = validateAnalysis(draft);
    setErrors(validated.errors);
    if (!validated.value) {
      setStep(stepForErrors(validated.errors));
      return;
    }
    if (!isApiConfigured()) {
      setResult({
        kind: "unavailable",
        message: "No audit was run. NEXT_PUBLIC_API_BASE_URL is empty, so SuryaSathi did not calculate a yield or a status from these entries.",
      });
      router.push("/xray");
      return;
    }
    setBusy(true);
    try {
      const simulation = await simulate(validated.value.simulate);
      const auditResult = await audit({
        simulation_id: simulation.simulation_id,
        quote_claims: validated.value.auditClaims,
        confirmed_fields: validated.value.confirmedFields,
      });
      setResult({ kind: "api", simulation, audit: auditResult });
      router.push("/xray");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "The audit could not be completed.";
      setResult({
        kind: "unavailable",
        message: `${message} No substitute yield was created from your entries.`,
      });
      router.push("/xray");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <p className="text-xs tracking-[0.18em] text-amber uppercase">Analysis</p>
        <h1 className="font-display mt-2 text-4xl font-normal text-ivory sm:text-5xl">Bill, roof, quote.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ivory-dim">{apiNote}</p>
        <ol className="mt-6 flex scroll-mt-28 flex-wrap gap-2" aria-label="Steps">
          {steps.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(index)}
                aria-current={step === index ? "step" : undefined}
                className={`min-h-11 rounded-full px-4 text-sm ${step === index ? "bg-amber text-ink" : "border border-white/15 text-ivory"}`}
              >
                {index + 1}. {label}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-8 space-y-6">
          {step === 0 ? (
            <section aria-labelledby="bill-heading" className="space-y-5">
              <h2 id="bill-heading" className="text-xl text-ivory">Electricity use and place</h2>
              <UploadDropzone documentType="bill" onFields={(fields, notes) => applyFields("bill", fields, notes)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput id="annual_units_kwh" label="Annual use (kWh)" value={draft.bill.annual_units_kwh} error={errors.annual_units_kwh} hint="Units on the bill, summed for a year. Do not enter a rupee amount here." onChange={(value) => setDraft((current) => ({ ...current, bill: { ...current.bill, annual_units_kwh: value, confirmed: false } }))} />
                <TextInput id="sanctioned_load_kw" label="Sanctioned load (kW)" value={draft.bill.sanctioned_load_kw} error={errors.sanctioned_load_kw} onChange={(value) => setDraft((current) => ({ ...current, bill: { ...current.bill, sanctioned_load_kw: value, confirmed: false } }))} />
                <TextInput id="latitude" label="Latitude" value={draft.location.latitude} error={errors.latitude} hint="Decimal degrees inside India, roughly 6 to 38." onChange={(value) => setDraft((current) => ({ ...current, location: { ...current.location, latitude: value } }))} />
                <TextInput id="longitude" label="Longitude" value={draft.location.longitude} error={errors.longitude} hint="Decimal degrees, roughly 68 to 98." onChange={(value) => setDraft((current) => ({ ...current, location: { ...current.location, longitude: value } }))} />
                <TextInput id="pincode" label="PIN code" value={draft.location.pincode} error={errors.pincode} inputMode="numeric" onChange={(value) => setDraft((current) => ({ ...current, location: { ...current.location, pincode: value } }))} />
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section aria-labelledby="roof-heading">
              <h2 id="roof-heading" className="mb-4 text-xl text-ivory">Terrace and modules</h2>
              <RoofConfigurator
                draft={draft}
                errors={errors}
                onTerrace={(patch) => setDraft((current) => ({ ...current, terrace: { ...current.terrace, ...patch } }))}
                onArray={(patch) => setDraft((current) => ({ ...current, array: { ...current.array, ...patch, dimensions_confirmed: false } }))}
              />
            </section>
          ) : null}

          {step === 2 ? (
            <section aria-labelledby="quote-heading" className="space-y-5">
              <h2 id="quote-heading" className="text-xl text-ivory">What the quote claims</h2>
              <UploadDropzone documentType="quote" onFields={(fields, notes) => applyFields("quote", fields, notes)} />
              {warnings.length > 0 ? <ErrorState title="Extraction warnings" message={warnings.join(" ")} /> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput id="vendor_name" label="Vendor name" value={draft.quote.vendor_name} inputMode="text" onChange={(value) => setDraft((current) => ({ ...current, quote: { ...current.quote, vendor_name: value } }))} />
                <TextInput id="claimed_system_size_kw" label="Claimed system size (kW)" value={draft.quote.claimed_system_size_kw} error={errors.claimed_system_size_kw} hint="Keep the unit the quote uses. The audit can ask whether it means DC or AC." onChange={(value) => setDraft((current) => ({ ...current, quote: { ...current.quote, claimed_system_size_kw: value, confirmed: { ...current.quote.confirmed, claimed_system_size_kw: false } } }))} />
                <TextInput id="claimed_annual_generation_kwh" label="Claimed annual generation (kWh/year)" value={draft.quote.claimed_annual_generation_kwh} error={errors.claimed_annual_generation_kwh} onChange={(value) => setDraft((current) => ({ ...current, quote: { ...current.quote, claimed_annual_generation_kwh: value, confirmed: { ...current.quote.confirmed, claimed_annual_generation_kwh: false } } }))} />
                <TextInput id="quote_panel_model" label="Quoted module model" value={draft.quote.panel_model} inputMode="text" onChange={(value) => setDraft((current) => ({ ...current, quote: { ...current.quote, panel_model: value } }))} />
                <TextInput id="quote_panel_w" label="Quoted module watts" value={draft.quote.panel_rated_power_w} error={errors.quote_panel_w} onChange={(value) => setDraft((current) => ({ ...current, quote: { ...current.quote, panel_rated_power_w: value, confirmed: { ...current.quote.confirmed, panel_rated_power_w: false } } }))} />
                <TextInput id="panel_count" label="Module count" value={draft.quote.panel_count} error={errors.panel_count} onChange={(value) => setDraft((current) => ({ ...current, quote: { ...current.quote, panel_count: value, confirmed: { ...current.quote.confirmed, panel_count: false } } }))} />
                <TextInput id="inverter_model" label="Inverter model" value={draft.quote.inverter_model} inputMode="text" hint="Leave blank if the quote does not say." onChange={(value) => setDraft((current) => ({ ...current, quote: { ...current.quote, inverter_model: value } }))} />
                <TextInput id="inverter_capacity_kw" label="Inverter capacity (kW)" value={draft.quote.inverter_capacity_kw} error={errors.inverter_capacity_kw} onChange={(value) => setDraft((current) => ({ ...current, quote: { ...current.quote, inverter_capacity_kw: value } }))} />
                <TextInput id="quoted_price_inr" label="Quoted price (INR)" value={draft.quote.quoted_price_inr} error={errors.quoted_price_inr} onChange={(value) => setDraft((current) => ({ ...current, quote: { ...current.quote, quoted_price_inr: value, confirmed: { ...current.quote.confirmed, quoted_price_inr: false } } }))} />
                <TextInput id="claimed_subsidy_inr" label="Claimed subsidy (INR)" value={draft.quote.claimed_subsidy_inr} error={errors.claimed_subsidy_inr} hint="Stored as a claim. No scheme amount is applied from this app." onChange={(value) => setDraft((current) => ({ ...current, quote: { ...current.quote, claimed_subsidy_inr: value, confirmed: { ...current.quote.confirmed, claimed_subsidy_inr: false } } }))} />
                <TextInput id="warranty_text" label="Warranty wording" value={draft.quote.warranty_text} inputMode="text" onChange={(value) => setDraft((current) => ({ ...current, quote: { ...current.quote, warranty_text: value } }))} />
              </div>
              <fieldset>
                <legend className="mb-2 text-sm text-ivory">Net metering mentioned?</legend>
                <div className="flex flex-wrap gap-2">
                  {(["yes", "no", "unknown"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={draft.quote.net_metering_included === option}
                      className={`min-h-11 rounded-full px-4 text-sm ${draft.quote.net_metering_included === option ? "bg-amber text-ink" : "border border-white/15"}`}
                      onClick={() => setDraft((current) => ({ ...current, quote: { ...current.quote, net_metering_included: option } }))}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            </section>
          ) : null}

          {step === 3 ? (
            <section aria-labelledby="review-heading" className="space-y-5">
              <h2 id="review-heading" className="text-xl text-ivory">Confirm, then run</h2>
              <p className="text-sm leading-6 text-ivory-dim">
                The backend, when it is connected, owns the arithmetic and the statuses. This page only sends what you confirm.
              </p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <ReviewItem label="Annual use" value={draft.bill.annual_units_kwh ? `${draft.bill.annual_units_kwh} kWh` : "—"} />
                <ReviewItem label="Sanctioned load" value={draft.bill.sanctioned_load_kw ? `${draft.bill.sanctioned_load_kw} kW` : "—"} />
                <ReviewItem label="Place" value={[draft.location.latitude, draft.location.longitude, draft.location.pincode].filter(Boolean).join(", ") || "—"} />
                <ReviewItem label="Roof" value={draft.terrace.length_m && draft.terrace.width_m ? `${draft.terrace.length_m} m × ${draft.terrace.width_m} m` : "—"} />
                <ReviewItem label="Obstacles" value={String(draft.terrace.obstacles.length)} />
                <ReviewItem label="Module assumption" value={draft.array.panel_assumption === "unset" ? "Not marked" : draft.array.panel_assumption} />
                <ReviewItem label="Claimed size" value={draft.quote.claimed_system_size_kw ? `${draft.quote.claimed_system_size_kw} kW` : "—"} />
                <ReviewItem label="Claimed generation" value={draft.quote.claimed_annual_generation_kwh ? `${draft.quote.claimed_annual_generation_kwh} kWh/year` : "—"} />
                <ReviewItem label="Quoted modules" value={draft.quote.panel_count ? `${draft.quote.panel_count} × ${draft.quote.panel_rated_power_w || "?"} W` : "—"} />
              </dl>
              <CheckField checked={draft.bill.confirmed} error={errors.bill_confirmed} label="I checked the annual use and sanctioned load against the bill or my own notes." onChange={(checked) => setDraft((current) => ({ ...current, bill: { ...current.bill, confirmed: checked } }))} />
              <CheckField checked={draft.array.dimensions_confirmed} error={errors.array_confirmed} label="The module watts and dimensions are either from a datasheet I checked or an explicit generic assumption." onChange={(checked) => setDraft((current) => ({ ...current, array: { ...current.array, dimensions_confirmed: checked } }))} />
              <CheckField checked={draft.quote.confirmed.claimed_system_size_kw && draft.quote.confirmed.claimed_annual_generation_kwh && draft.quote.confirmed.panel_count} error={errors.quote_confirmed} label="I confirm the claimed system size, annual generation, and module count as entered." onChange={(checked) => setDraft((current) => ({ ...current, quote: { ...current.quote, confirmed: { ...current.quote.confirmed, claimed_system_size_kw: checked, claimed_annual_generation_kwh: checked, panel_count: checked } } }))} />
              {busy ? <LoadingState label="Waiting for the audit API" /> : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" className={buttonPrimary} disabled={busy} onClick={() => void runAudit()}>
                  {busy ? "Running…" : "Run X-Ray"}
                </button>
                <button
                  type="button"
                  className={buttonSecondary}
                  onClick={() => {
                    openSample();
                    router.push("/xray");
                  }}
                >
                  Open illustrative sample instead
                </button>
              </div>
              <p className="text-xs leading-5 text-ivory-dim">
                The sample is a fixed script. It will not use the numbers in this form, and it is not a completed audit.
              </p>
            </section>
          ) : null}

          <div className="flex gap-3">
            <button type="button" className={buttonSecondary} disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>
              Back
            </button>
            {step < 3 ? (
              <button type="button" className={buttonPrimary} onClick={() => setStep((value) => Math.min(3, value + 1))}>
                Continue
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <SolarTwin
          draft={draft}
          onSunHour={(hour) => setDraft((current) => ({ ...current, sunHour: hour }))}
        />
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 px-3 py-2">
      <dt className="text-ivory-dim">{label}</dt>
      <dd className="mt-1 text-ivory">{value}</dd>
    </div>
  );
}

function stepForErrors(errors: FieldErrors) {
  const keys = Object.keys(errors);
  if (keys.some((key) => ["annual_units_kwh", "sanctioned_load_kw", "latitude", "longitude", "pincode"].includes(key))) return 0;
  if (keys.some((key) => key.startsWith("obstacle") || ["length_m", "width_m", "roof_slope_deg", "roof_azimuth_deg", "edge_setback_m", "panel_model", "panel_rated_power_w", "panel_length_m", "panel_width_m", "panel_tilt_deg", "panel_azimuth_deg"].includes(key))) return 1;
  if (keys.some((key) => ["claimed_system_size_kw", "claimed_annual_generation_kwh", "quote_panel_w", "panel_count", "quoted_price_inr", "claimed_subsidy_inr", "inverter_capacity_kw"].includes(key))) return 2;
  return 3;
}
