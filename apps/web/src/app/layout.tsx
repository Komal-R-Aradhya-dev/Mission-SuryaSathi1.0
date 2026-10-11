import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AnalysisProvider } from "@/components/providers/AnalysisProvider";
import { SiteHeader } from "@/components/site/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SuryaSathi — before you pay for solar",
  description:
    "Compare a rooftop solar quote with your electricity use, the roof you describe, and a yield model before you pay.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-ink text-ivory">
        <AnalysisProvider>
          <a
            href="/analyze"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-amber focus:px-4 focus:py-2 focus:text-ink"
          >
            Skip to analysis
          </a>
          <Suspense fallback={<div className="h-16" />}>
            <SiteHeader />
          </Suspense>
          {children}
        </AnalysisProvider>
      </body>
    </html>
  );
}
