import type { AuditStatus } from "@/lib/api/types";

const presentation: Record<AuditStatus, { label: string; meaning: string; className: string }> = {
  CONSISTENT: {
    label: "CONSISTENT",
    meaning: "The claim sits inside the modelled range and the required inputs were verified.",
    className: "border-mint/40 text-mint",
  },
  INCONSISTENT: {
    label: "INCONSISTENT",
    meaning: "Figures in the quote do not agree with each other.",
    className: "border-danger/50 text-danger",
  },
  ABOVE_MODEL: {
    label: "ABOVE_MODEL",
    meaning: "The claim is above the modelled upper end, inside the stated discrepancy margin.",
    className: "border-amber/50 text-amber",
  },
  HIGH_DISCREPANCY: {
    label: "HIGH_DISCREPANCY",
    meaning: "The claim is materially above the modelled upper end plus the stated margin. This is a heuristic, not a physical law.",
    className: "border-amber-deep/70 text-amber",
  },
  UNVERIFIED: {
    label: "UNVERIFIED",
    meaning: "A source snapshot or match is missing, so the claim is neither confirmed nor rejected.",
    className: "border-ivory/30 text-ivory",
  },
  INFORMATION_MISSING: {
    label: "INFORMATION_MISSING",
    meaning: "A field needed for the check was not in the quote.",
    className: "border-ivory/30 text-ivory",
  },
  NEEDS_REVIEW: {
    label: "NEEDS_REVIEW",
    meaning: "The inputs or the meaning of a unit need a person to confirm them.",
    className: "border-amber/50 text-amber",
  },
};

export function AuditStatusBadge({ status }: { status: AuditStatus }) {
  const item = presentation[status];
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs tracking-wide ${item.className}`} title={item.meaning}>
      {item.label}
    </span>
  );
}

export function statusMeaning(status: AuditStatus) {
  return presentation[status];
}
