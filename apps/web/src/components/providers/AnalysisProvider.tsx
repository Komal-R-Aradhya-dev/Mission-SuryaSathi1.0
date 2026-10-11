"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { AnalysisDraft } from "@/lib/analysis/draft";
import {
  getAnalysisServerSnapshot,
  getAnalysisSnapshot,
  openSampleStore,
  setDraftStore,
  setResultStore,
  subscribeAnalysis,
  type AnalysisResult,
} from "@/lib/analysis/sessionStore";

type AnalysisContextValue = {
  draft: AnalysisDraft;
  setDraft: Dispatch<SetStateAction<AnalysisDraft>>;
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;
  openSample: () => void;
  hydrated: boolean;
};

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

function subscribeHydration() {
  return () => undefined;
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const store = useSyncExternalStore(subscribeAnalysis, getAnalysisSnapshot, getAnalysisServerSnapshot);
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);

  const setDraft = useCallback((action: SetStateAction<AnalysisDraft>) => {
    const current = getAnalysisSnapshot().draft;
    setDraftStore(typeof action === "function" ? action(current) : action);
  }, []);

  const setResult = useCallback((result: AnalysisResult | null) => {
    setResultStore(result);
  }, []);

  const value = useMemo(
    () => ({
      draft: store.draft,
      setDraft,
      result: store.result,
      setResult,
      openSample: openSampleStore,
      hydrated,
    }),
    [hydrated, setDraft, setResult, store.draft, store.result],
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const value = useContext(AnalysisContext);
  if (!value) throw new Error("useAnalysis must be used within AnalysisProvider");
  return value;
}

export type { AnalysisResult };
