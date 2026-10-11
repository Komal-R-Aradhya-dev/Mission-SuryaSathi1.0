import { Suspense } from "react";
import { ReportSummary } from "@/components/report/ReportSummary";
import { LoadingState } from "@/components/ui/LoadingState";

export default function ReportPage() {
  return (
    <main className="px-4 pb-24 pt-24 sm:px-6">
      <Suspense fallback={<LoadingState label="Opening the report" />}>
        <ReportSummary />
      </Suspense>
    </main>
  );
}
