"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import { MotionConfig, motion } from "framer-motion";

interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

function subscribeReduced(listener: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function reducedSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeMobile(listener: () => void) {
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}

function mobileSnapshot() {
  return window.innerWidth < 768;
}

function serverFalse() {
  return false;
}

function isSectionActive(el: HTMLElement | null) {
  if (!el?.isConnected) return false;
  let node: HTMLElement | null = el;
  while (node) {
    if (node.hidden) return false;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return false;
    node = node.parentElement;
  }
  return true;
}

const ScrollExpandMedia = ({
  mediaType = "video",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  children,
}: ScrollExpandMediaProps) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const [trackedType, setTrackedType] = useState(mediaType);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const expandedRef = useRef(false);
  const touchStartRef = useRef(0);

  if (trackedType !== mediaType) {
    setTrackedType(mediaType);
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }

  useEffect(() => {
    progressRef.current = scrollProgress;
    expandedRef.current = mediaFullyExpanded;
  }, [scrollProgress, mediaFullyExpanded]);

  const reduced = useSyncExternalStore(subscribeReduced, reducedSnapshot, serverFalse);
  const isMobileState = useSyncExternalStore(subscribeMobile, mobileSnapshot, serverFalse);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (reduced || !isSectionActive(sectionRef.current)) return;
      if (expandedRef.current && e.deltaY < 0 && window.scrollY <= 5) {
        expandedRef.current = false;
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!expandedRef.current) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        const newProgress = Math.min(Math.max(progressRef.current + scrollDelta, 0), 1);
        progressRef.current = newProgress;
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          expandedRef.current = true;
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (reduced || !isSectionActive(sectionRef.current)) return;
      const startY = touchStartRef.current;
      if (!startY) return;

      const touchY = e.touches[0]?.clientY ?? startY;
      const deltaY = startY - touchY;

      if (expandedRef.current && deltaY < -20 && window.scrollY <= 5) {
        expandedRef.current = false;
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!expandedRef.current) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(Math.max(progressRef.current + scrollDelta, 0), 1);
        progressRef.current = newProgress;
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          expandedRef.current = true;
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }

        touchStartRef.current = touchY;
      }
    };

    const handleTouchEnd = (): void => {
      touchStartRef.current = 0;
    };

    const handleScroll = (): void => {
      if (reduced || !isSectionActive(sectionRef.current)) return;
      if (!expandedRef.current) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [reduced]);

  const progress = reduced ? 1 : scrollProgress;
  const mediaWidth = 300 + progress * (isMobileState ? 650 : 1250);
  const mediaHeight = 400 + progress * (isMobileState ? 200 : 400);
  const textTranslateX = progress * (isMobileState ? 180 : 150);

  const firstWord = title ? title.split(" ")[0] : "";
  const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

  return (
    <MotionConfig reducedMotion="user">
      <div ref={sectionRef} className="overflow-x-hidden transition-colors duration-700 ease-in-out">
        <section className="relative flex min-h-[100dvh] flex-col items-center justify-start">
          <div className="relative flex min-h-[100dvh] w-full flex-col items-center">
            <motion.div
              className="absolute inset-0 z-0 h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 - progress }}
              transition={{ duration: 0.1 }}
            >
              <Image
                src={bgImageSrc}
                alt="Solar field behind the opening picture"
                width={1920}
                height={1080}
                className="h-screen w-screen"
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                }}
                priority
              />
              <div className="absolute inset-0 bg-black/10" />
            </motion.div>

            <div className="relative z-10 container mx-auto flex flex-col items-center justify-start">
              <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center">
                <div
                  className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 transform rounded-2xl transition-none"
                  style={{
                    width: `${mediaWidth}px`,
                    height: `${mediaHeight}px`,
                    maxWidth: "95vw",
                    maxHeight: "85vh",
                    boxShadow: "0px 0px 50px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {mediaType === "video" ? (
                    mediaSrc.includes("youtube.com") ? (
                      <div className="pointer-events-none relative h-full w-full">
                        <iframe
                          width="100%"
                          height="100%"
                          src={
                            mediaSrc.includes("embed")
                              ? mediaSrc +
                                (mediaSrc.includes("?") ? "&" : "?") +
                                "autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1"
                              : mediaSrc.replace("watch?v=", "embed/") +
                                "?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=" +
                                mediaSrc.split("v=")[1]
                          }
                          className="h-full w-full rounded-xl"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={title || "Video"}
                        />
                        <div className="absolute inset-0 z-10" style={{ pointerEvents: "none" }} />
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-black/30"
                          initial={{ opacity: 0.7 }}
                          animate={{ opacity: 0.5 - progress * 0.3 }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    ) : (
                      <div className="pointer-events-none relative h-full w-full">
                        <video
                          src={mediaSrc}
                          poster={posterSrc}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="auto"
                          className="h-full w-full rounded-xl object-cover"
                          controls={false}
                          disablePictureInPicture
                          disableRemotePlayback
                        />
                        <div className="absolute inset-0 z-10" style={{ pointerEvents: "none" }} />
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-black/30"
                          initial={{ opacity: 0.7 }}
                          animate={{ opacity: 0.5 - progress * 0.3 }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    )
                  ) : (
                    <div className="relative h-full w-full">
                      <Image
                        src={mediaSrc}
                        alt={title || "Rooftop solar"}
                        width={1280}
                        height={720}
                        className="h-full w-full rounded-xl object-cover"
                      />
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-black/50"
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.7 - progress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  )}

                  <div className="relative z-10 mt-4 flex flex-col items-center text-center transition-none">
                    {date && (
                      <p className="text-2xl text-blue-200" style={{ transform: `translateX(-${textTranslateX}vw)` }}>
                        {date}
                      </p>
                    )}
                    {scrollToExpand && (
                      <p
                        className="text-center font-medium text-blue-200"
                        style={{ transform: `translateX(${textTranslateX}vw)` }}
                      >
                        {scrollToExpand}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={`relative z-10 flex w-full flex-col items-center justify-center gap-4 text-center transition-none ${
                    textBlend ? "mix-blend-difference" : "mix-blend-normal"
                  }`}
                >
                  <motion.h2
                    className="text-4xl font-bold text-blue-200 transition-none md:text-5xl lg:text-6xl"
                    style={{ transform: `translateX(-${textTranslateX}vw)` }}
                  >
                    {firstWord}
                  </motion.h2>
                  <motion.h2
                    className="text-center text-4xl font-bold text-blue-200 transition-none md:text-5xl lg:text-6xl"
                    style={{ transform: `translateX(${textTranslateX}vw)` }}
                  >
                    {restOfTitle}
                  </motion.h2>
                </div>
              </div>

              <motion.section
                className="flex w-full flex-col px-8 py-10 md:px-16 lg:py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: showContent || reduced ? 1 : 0 }}
                transition={{ duration: 0.7 }}
              >
                {children}
              </motion.section>
            </div>
          </div>
        </section>
      </div>
    </MotionConfig>
  );
};

export default ScrollExpandMedia;
