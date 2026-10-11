"use client";

import { useState } from "react";
import type { AuditCheck } from "@/lib/api/types";
import { AuditStatusBadge } from "@/components/xray/AuditStatusBadge";
import { EvidenceDrawer } from "@/components/xray/EvidenceDrawer";

export function ClaimCard({ check }: { check: AuditCheck }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-3xl border border-white/10 bg-ink-2/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="max-w-xl text-lg text-ivory">{check.title}</h3>
        <AuditStatusBadge status={check.status} />
      </div>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ivory-dim">Vendor claim</dt>
          <dd className="mt-1 font-mono text-ivory">{check.claim}</dd>
        </div>
        <div>
          <dt className="text-ivory-dim">Model or arithmetic</dt>
          <dd className="mt-1 text-ivory">{check.calculation}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-6 text-ivory-dim">{check.reason}</p>
      <button type="button" className="mt-4 min-h-11 text-sm text-amber underline-offset-4 hover:underline" onClick={() => setOpen(true)}>
        Evidence and next question
      </button>
      <EvidenceDrawer check={open ? check : null} onClose={() => setOpen(false)} />
    </article>
  );
}
