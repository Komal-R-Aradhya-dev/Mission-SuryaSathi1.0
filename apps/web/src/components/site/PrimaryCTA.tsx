import Link from "next/link";
import type { ReactNode } from "react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

export function PrimaryCTA({
  href = "/analyze",
  children = "Analyse my quote",
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <LiquidButton asChild size="xl" className="rounded-full text-ivory">
      <Link href={href}>{children}</Link>
    </LiquidButton>
  );
}
