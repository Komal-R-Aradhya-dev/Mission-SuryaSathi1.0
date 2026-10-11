import { Suspense } from "react";
import { AnalyzeFlow } from "@/components/analyze/AnalyzeFlow";
import { LoadingState } from "@/components/ui/LoadingState";

export default function AnalyzePage() {
  return (
    <main className="px-4 pb-24 pt-24 sm:px-6">
      <Suspense fallback={<LoadingState label="Opening the analysis" />}>
        <AnalyzeFlow />
      </Suspense>
    </main>
  );
}
