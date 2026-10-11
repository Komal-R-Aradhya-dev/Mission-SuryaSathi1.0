"use client";

import { useEffect, useSyncExternalStore } from "react";
import ImmersiveFullscreenNav from "@/components/ui/immersive-full-screen-nav";
import { readMotionPreference, sceneBridge, subscribeScene } from "@/lib/scene/sceneBridge";

const SOLAR_FIELD =
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1400&q=80";
const ROOFTOP_SOLAR =
  "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1400&q=80";

function subscribeMotion(listener: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", listener);
  const unsubscribe = subscribeScene(listener);
  return () => {
    media.removeEventListener("change", listener);
    unsubscribe();
  };
}

function MotionToggle() {
  const reduced = useSyncExternalStore(subscribeMotion, readMotionPreference, () => false);

  useEffect(() => {
    sceneBridge.reducedMotion = reduced;
    document.documentElement.dataset.motion = reduced ? "reduce" : "full";
  }, [reduced]);

  function toggleMotion() {
    const next = !readMotionPreference();
    sceneBridge.reducedMotion = next;
    sessionStorage.setItem("suryasathi-motion", next ? "reduce" : "full");
    document.documentElement.dataset.motion = next ? "reduce" : "full";
    sceneBridge.emit();
  }

  return (
    <button
      type="button"
      onClick={toggleMotion}
      className="min-h-11 rounded-full px-3 text-sm text-ivory-dim hover:text-ivory"
      aria-pressed={reduced}
    >
      {reduced ? "Motion off" : "Motion"}
    </button>
  );
}

export function SiteHeader() {
  return (
    <ImmersiveFullscreenNav
      navConfig={{
        brand: "SuryaSathi",
        brandHref: "/",
        overlayBg: "#07110e",
        headerOpenColor: "#f4efe4",
        headerClosedColor: "#f4efe4",
        clipOrigin: "bottom",
        headerClassName: "border-b border-white/10 bg-ink/80 backdrop-blur-md",
        headerAside: <MotionToggle />,
      }}
      navContent={{
        agencyName: "SuryaSathi",
        tagline: "Before you pay, make the quote meet the roof and the bill.",
        location: "",
        links: [
          { label: "Story", href: "/#chapter-sun" },
          { label: "Analyse", href: "/analyze" },
          { label: "X-Ray", href: "/xray" },
          { label: "Report", href: "/report" },
        ],
        images: [SOLAR_FIELD, ROOFTOP_SOLAR],
        socials: [],
      }}
    />
  );
}
