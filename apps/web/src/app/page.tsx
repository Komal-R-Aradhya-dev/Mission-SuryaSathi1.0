import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";
import { Card } from "@/components/ui/card";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import { PrimaryCTA } from "@/components/site/PrimaryCTA";
import { HomeExperience } from "@/components/story/HomeExperience";

const rooftopSrc =
  "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1600&q=80";
const fieldSrc =
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1920&q=80";

export default function Home() {
  return (
    <>
      <div className="relative z-[35]">
        <ScrollExpandMedia
          mediaType="image"
          mediaSrc={rooftopSrc}
          bgImageSrc={fieldSrc}
          title="Prove the numbers"
          date="SuryaSathi"
          scrollToExpand="Scroll to expand"
          textBlend
        >
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-3xl text-ivory">Before you pay for solar</h2>
            <p className="mt-4 text-lg leading-8 text-ivory-dim">
              The terrace, the bill, and the vendor’s quote stay separate until you confirm them. This picture is not a yield, a shade study, or a subsidy result.
            </p>
            <div className="mt-8">
              <PrimaryCTA />
            </div>
          </div>
        </ScrollExpandMedia>
      </div>
      <HomeExperience />
      <section aria-label="Spline scene" className="relative z-10 bg-ink px-4 py-16 sm:px-8">
        <Card className="relative mx-auto h-auto min-h-[500px] w-full max-w-6xl overflow-hidden bg-black/[0.96] md:h-[500px]">
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" />
          <div className="flex h-full flex-col md:flex-row">
            <div className="relative z-10 flex flex-1 flex-col justify-center p-8">
              <h2 className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                A picture beside the model
              </h2>
              <p className="mt-4 max-w-lg text-neutral-300">
                This scene is not the terrace in the story, and it does not calculate generation, shade, or a subsidy.
              </p>
            </div>
            <div className="relative min-h-[320px] flex-1">
              <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="h-full w-full" />
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
