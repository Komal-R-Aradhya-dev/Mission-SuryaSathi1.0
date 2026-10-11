"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { PrimaryCTA } from "@/components/site/PrimaryCTA";
import { buttonSecondary } from "@/components/site/styles";
import { SunTimeControl } from "@/components/analyze/SunTimeControl";
import InkOrbitFeatures from "@/components/ui/ink-orbit-features";
import { LoadingState } from "@/components/ui/LoadingState";
import { formatHour, readMotionPreference, sceneBridge, subscribeScene } from "@/lib/scene/sceneBridge";
import { SAMPLE_BANNER } from "@/lib/analysis/sampleFixture";

const CinematicCanvas = dynamic(() => import("@/components/scene/CinematicCanvas"), {
  ssr: false,
  loading: () => <LoadingState label="Preparing the terrace" />,
});

const chapters = [
  { id: "chapter-sun", label: "Sun" },
  { id: "chapter-rooftop", label: "Rooftop" },
  { id: "chapter-physics", label: "Physics" },
  { id: "chapter-quote", label: "Quote" },
  { id: "chapter-xray", label: "X-Ray" },
  { id: "chapter-action", label: "Action" },
];

export function HomeExperience() {
  return (
    <div>
      <CinematicCanvas />
      <div className="relative z-10">
        <nav aria-label="Chapters" className="no-print fixed bottom-4 right-4 z-30 hidden flex-col gap-2 md:flex">
          {chapters.map((chapter, index) => (
            <a key={chapter.id} href={`#${chapter.id}`} className="rounded-full bg-ink/75 px-2.5 py-1 text-right text-xs tracking-[0.14em] text-ivory/85 uppercase backdrop-blur-sm hover:text-amber">
              {String(index + 1).padStart(2, "0")} {chapter.label}
            </a>
          ))}
        </nav>

        <section id="chapter-sun" className="chapter flex min-h-svh items-end px-4 pb-16 pt-28 sm:px-8 md:items-center md:pb-0">
          <div className="max-w-xl rounded-3xl border border-white/10 bg-ink/85 p-6 shadow-[0_24px_60px_rgba(7,17,14,0.35)] backdrop-blur-md md:max-w-md">
            <p className="text-xs tracking-[0.22em] text-amber uppercase">SuryaSathi</p>
            <h1 className="font-display mt-4 max-w-[14ch] text-[clamp(2.5rem,6vw,4.6rem)] leading-[1.02] font-normal tracking-[-0.03em] text-ivory">
              Before you pay for solar, make the numbers prove themselves.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-ivory-dim sm:text-[1.05rem]">
              A pre-purchase check for an Indian household: your electricity use, the terrace you describe, a yield model, and the vendor’s quote — kept separate, then compared.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryCTA />
              <a href="#chapter-rooftop" className={buttonSecondary}>
                Explore how it works
              </a>
            </div>
          </div>
        </section>

        <section id="chapter-rooftop" className="chapter flex min-h-svh items-end px-4 pb-16 pt-28 sm:px-8 md:items-center">
          <article className="max-w-xl rounded-3xl border border-white/10 bg-ink/85 p-6 shadow-[0_24px_60px_rgba(7,17,14,0.35)] backdrop-blur-md md:max-w-md">
            <p className="text-xs tracking-[0.22em] text-amber uppercase">02 — The rooftop</p>
            <h2 className="font-display mt-3 text-4xl leading-tight font-normal text-ivory sm:text-5xl">A terrace is not a blank rectangle.</h2>
            <p className="mt-4 text-base leading-7 text-ivory-dim">
              The model in this scene is original geometry: a flat roof, a parapet, six tilted modules, a cylindrical water tank and a stair cabin. It is here so the problem is visible. It is not your building, and it is not a panel-count result.
            </p>
          </article>
        </section>

        <section id="chapter-physics" className="chapter flex min-h-svh items-end px-4 pb-16 pt-28 sm:px-8 md:items-center">
          <div className="max-w-xl">
            <article className="rounded-3xl border border-white/10 bg-ink/85 p-6 shadow-[0_24px_60px_rgba(7,17,14,0.35)] backdrop-blur-md md:max-w-md">
              <p className="text-xs tracking-[0.22em] text-amber uppercase">03 — Solar physics</p>
              <h2 className="font-display mt-3 text-4xl leading-tight font-normal text-ivory sm:text-5xl">Direction first. Shade claims later.</h2>
              <p className="mt-4 text-base leading-7 text-ivory-dim">
                Move the sun across this terrace to see how a tank or stair cabin sits in the light. The shadow on screen is a picture. Annual generation, if it is calculated, comes from the backend — not from these pixels.
              </p>
            </article>
            <div className="mt-4 md:mt-6">
              <LandingSunControl />
            </div>
          </div>
        </section>

        <section id="chapter-quote" className="chapter flex min-h-svh items-end px-4 pb-16 pt-28 sm:px-8 md:items-center">
          <article className="max-w-xl rounded-3xl border border-white/10 bg-ink/85 p-6 shadow-[0_24px_60px_rgba(7,17,14,0.35)] backdrop-blur-md md:max-w-md">
            <p className="text-xs tracking-[0.22em] text-amber uppercase">04 — The quote</p>
            <h2 className="font-display mt-3 text-4xl leading-tight font-normal text-ivory sm:text-5xl">A claim is not a measurement.</h2>
            <p className="mt-4 text-base leading-7 text-ivory-dim">
              Capacity, module count, annual units, price and a subsidy line can arrive together. SuryaSathi keeps each one editable until you confirm it. Nothing below is your quote.
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-dashed border-amber/50 p-4 text-sm">
              <div>
                <dt className="text-ivory-dim">Sample system size</dt>
                <dd className="font-mono text-lg text-ivory">5.0 kW</dd>
              </div>
              <div>
                <dt className="text-ivory-dim">Sample annual claim</dt>
                <dd className="font-mono text-lg text-ivory">7,900 kWh</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs tracking-wide text-amber uppercase">{SAMPLE_BANNER}</p>
          </article>
        </section>

        <section id="chapter-xray" className="chapter flex min-h-svh items-end px-4 pb-16 pt-28 sm:px-8 md:items-center">
          <article className="max-w-xl rounded-3xl border border-white/10 bg-ink/85 p-6 shadow-[0_24px_60px_rgba(7,17,14,0.35)] backdrop-blur-md md:max-w-md">
            <p className="text-xs tracking-[0.22em] text-amber uppercase">05 — The X-Ray</p>
            <h2 className="font-display mt-3 text-4xl leading-tight font-normal text-ivory sm:text-5xl">Claim beside the model. Then the question.</h2>
            <p className="mt-4 text-base leading-7 text-ivory-dim">
              A finished audit shows the vendor’s words, the backend range, the evidence, a status, and one thing to ask the installer. Statuses stay specific: consistent, inconsistent, above model, high discrepancy, unverified, information missing, or needs review.
            </p>
            <p className="mt-4 text-sm text-ivory">
              The sample story marks 7,900 kWh/year as <span className="text-amber">HIGH_DISCREPANCY</span> against a fictional band. That label is a demonstration, not a finding about an installer.
            </p>
            <Link href="/xray?sample=1" className={`${buttonSecondary} mt-6`}>
              View the labelled sample X-Ray
            </Link>
          </article>
        </section>

        <section id="chapter-action" className="chapter flex min-h-svh items-end px-4 pb-20 pt-28 sm:px-8 md:items-center">
          <article className="max-w-xl rounded-3xl border border-white/10 bg-ink/85 p-6 shadow-[0_24px_60px_rgba(7,17,14,0.35)] backdrop-blur-md md:max-w-md">
            <p className="text-xs tracking-[0.22em] text-amber uppercase">06 — Take action</p>
            <h2 className="font-display mt-3 text-4xl leading-tight font-normal text-ivory sm:text-5xl">Start with the bill, or type the numbers.</h2>
            <p className="mt-4 text-base leading-7 text-ivory-dim">
              No account. If the document service is offline, the form still works. If the audit API is offline, SuryaSathi will say so instead of inventing a yield.
            </p>
            <div className="mt-8">
              <PrimaryCTA>Analyse my quote</PrimaryCTA>
            </div>
            <p className="mt-10 max-w-md text-xs leading-5 text-ivory-dim">
              SuryaSathi is decision support before you pay. It is not a certified site survey, a subsidy approval, or a statement that a vendor is fraudulent. Preview shadows are not an annual shade study.
            </p>
          </article>
        </section>

        <section id="features" aria-label="Features" className="relative bg-ink">
          <InkOrbitFeatures
            theme="dark"
            brand="SuryaSathi"
            tag="Features"
            title={"Check the quote\n*before you pay*"}
            collaboration={{
              title: "Bill, roof, and quote stay separate",
              description:
                "You enter electricity use, the terrace, and the vendor’s claims. They stay separate until you confirm each field.",
            }}
            reports={{
              title: "An X-Ray you can print",
              description:
                "Each claim sits beside the model range, a status, and one question for the installer. A vendor is never called fraudulent.",
            }}
            integrations={{
              title: "Four inputs, one check",
              description:
                "The bill, the roof, the quote, and the yield model stay named. If the audit service is offline, the form still says so.",
              tools: ["Bill", "Roof", "Quote", "Model"],
            }}
            insights={{
              title: "A sketch, not a yield",
              description:
                "Scrub the line to see the diagram move. These points are not your generation, a shade study, or a subsidy result.",
              values: [22, 26, 24, 31, 29, 36, 34, 41, 39, 47, 52, 58],
              forecastFrom: 8,
            }}
            style={{
              ["--ib-sans" as string]: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
              ["--ib-mono" as string]: "var(--font-geist-mono), ui-monospace, monospace",
            }}
          />
        </section>
      </div>
    </div>
  );
}

function LandingSunControl() {
  const hour = useSyncExternalStore(subscribeScene, () => sceneBridge.hour, () => 8.4);
  const pinned = useSyncExternalStore(subscribeScene, () => sceneBridge.pinnedHour !== null, () => false);
  const reduced = useSyncExternalStore(subscribeScene, readMotionPreference, () => false);

  return (
    <SunTimeControl
      id="landing-sun-hour"
      hour={reduced && !pinned ? 8.4 : hour}
      onChange={(next) => {
        sceneBridge.pinnedHour = next;
        sceneBridge.hour = next;
        sceneBridge.emit();
      }}
      onFollow={
        reduced
          ? undefined
          : () => {
              sceneBridge.pinnedHour = null;
              sceneBridge.emit();
            }
      }
      following={!pinned && !reduced}
      note={
        reduced
          ? `Motion is reduced, so the camera stays on the opening shot. The clock still moves the light when you drag it. Now showing ${formatHour(hour)}.`
          : undefined
      }
    />
  );
}
