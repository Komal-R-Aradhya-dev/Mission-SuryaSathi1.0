"use client";

import { useEffect, useRef } from "react";
import type { AuditCheck } from "@/lib/api/types";
import { AuditStatusBadge } from "@/components/xray/AuditStatusBadge";

export function EvidenceDrawer({ check, onClose }: { check: AuditCheck | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!check) return;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = panelRef.current.querySelectorAll<HTMLElement>("button, a, input, textarea, select, [tabindex]:not([tabindex='-1'])");
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [check, onClose]);

  if (!check) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onMouseDown={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-title"
        className="h-full w-full max-w-md overflow-y-auto bg-ink px-5 py-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="evidence-title" className="font-display text-3xl font-normal text-ivory">
            {check.title}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} className="min-h-11 rounded-full border border-white/15 px-3 text-sm">
            Close
          </button>
        </div>
        <div className="mt-4">
          <AuditStatusBadge status={check.status} />
        </div>
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-ivory-dim">Vendor claim</dt>
            <dd className="mt-1 text-ivory">{check.claim}</dd>
          </div>
          <div>
            <dt className="text-ivory-dim">Calculation or model</dt>
            <dd className="mt-1 text-ivory">{check.calculation}</dd>
          </div>
          <div>
            <dt className="text-ivory-dim">Why this status</dt>
            <dd className="mt-1 leading-6 text-ivory">{check.reason}</dd>
          </div>
          <div>
            <dt className="text-ivory-dim">Evidence</dt>
            <dd className="mt-2 space-y-2">
              {check.evidence.length === 0 ? <p>No evidence items were attached.</p> : null}
              {check.evidence.map((item, index) => (
                <p key={`${item.type}-${index}`} className="rounded-xl border border-white/10 px-3 py-2">
                  <span className="text-amber">{item.type}</span>
                  {item.field ? ` · ${item.field}` : ""}
                  {item.note ? ` — ${item.note}` : ""}
                </p>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-ivory-dim">Ask the installer</dt>
            <dd className="mt-1 leading-6 text-ivory">{check.recommended_question || "No question was returned."}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
