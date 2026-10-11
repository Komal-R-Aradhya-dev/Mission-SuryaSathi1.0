import type { AuditResponse, SimulationResponse } from "@/lib/api/types";
import { emptyDraft, type AnalysisDraft } from "@/lib/analysis/draft";
import { sampleAudit, sampleSimulation } from "@/lib/analysis/sampleFixture";

export type AnalysisResult =
  | { kind: "api"; simulation: SimulationResponse; audit: AuditResponse }
  | { kind: "sample"; simulation: SimulationResponse; audit: AuditResponse }
  | { kind: "unavailable"; message: string };

type Store = {
  draft: AnalysisDraft;
  result: AnalysisResult | null;
};

const STORAGE_KEY = "suryasathi-analysis-v1";

const serverStore: Store = { draft: emptyDraft(), result: null };
let clientStore: Store | null = null;
const listeners = new Set<() => void>();

function isDraft(value: unknown): value is AnalysisDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as AnalysisDraft;
  return Boolean(draft.bill && draft.terrace && draft.quote && draft.array && draft.location);
}

function loadStore(): Store {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { draft: emptyDraft(), result: null };
    const parsed = JSON.parse(raw) as { draft?: unknown; result?: AnalysisResult | null };
    return {
      draft: isDraft(parsed.draft) ? parsed.draft : emptyDraft(),
      result: parsed.result ?? null,
    };
  } catch {
    return { draft: emptyDraft(), result: null };
  }
}

export function subscribeAnalysis(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAnalysisSnapshot(): Store {
  if (clientStore === null) clientStore = loadStore();
  return clientStore;
}

export function getAnalysisServerSnapshot(): Store {
  return serverStore;
}

function commit(next: Store) {
  clientStore = next;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

export function setDraftStore(next: AnalysisDraft) {
  commit({ draft: next, result: getAnalysisSnapshot().result });
}

export function setResultStore(result: AnalysisResult | null) {
  commit({ draft: getAnalysisSnapshot().draft, result });
}

export function openSampleStore() {
  setResultStore({ kind: "sample", simulation: sampleSimulation, audit: sampleAudit });
}
