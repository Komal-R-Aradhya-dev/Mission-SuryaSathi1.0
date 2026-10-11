import { Suspense } from "react";
import { XRayView } from "@/components/xray/XRayView";
import { LoadingState } from "@/components/ui/LoadingState";

export default function XRayPage() {
  return (
    <main className="px-4 pb-24 pt-24 sm:px-6">
      <Suspense fallback={<LoadingState label="Opening the X-Ray" />}>
        <XRayView />
      </Suspense>
    </main>
  );
}
