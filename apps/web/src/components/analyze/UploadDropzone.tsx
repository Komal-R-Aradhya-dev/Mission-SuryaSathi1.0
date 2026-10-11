"use client";

import { useState } from "react";
import { ApiError, extractDocument, isApiConfigured, presignUpload, uploadToPresignedUrl } from "@/lib/api/apiClient";
import type { DocumentType, ExtractedField } from "@/lib/api/types";
import { ErrorState } from "@/components/ui/LoadingState";

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_BYTES = 8 * 1024 * 1024;

export function UploadDropzone({
  documentType,
  onFields,
}: {
  documentType: DocumentType;
  onFields: (fields: Record<string, ExtractedField>, warnings: string[]) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | null) {
    setError(null);
    setMessage(null);
    if (!file) return;
    if (!ALLOWED.has(file.type)) {
      setError("Use a PDF, JPEG, or PNG. This file was not uploaded.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Files over 8 MB are not sent. Enter the fields manually.");
      return;
    }
    if (!isApiConfigured()) {
      setMessage("This file stayed on your device. Document upload needs the backend, so nothing was extracted. Enter the fields below.");
      return;
    }
    setBusy(true);
    try {
      const presign = await presignUpload({
        document_type: documentType,
        file_name: file.name,
        content_type: file.type,
        file_size_bytes: file.size,
      });
      await uploadToPresignedUrl(presign.upload_url, file);
      const extracted = await extractDocument({
        document_type: documentType,
        object_key: presign.object_key,
      });
      const extractedFields = extracted.fields ?? {};
      const hasCandidateValues = Object.values(extractedFields).some(
        (field) => field.value !== null && field.value !== undefined,
      );
      onFields(extractedFields, extracted.warnings ?? []);
      setMessage(
        hasCandidateValues
          ? "Candidate fields were extracted. Review every value before confirming it."
          : "No usable values were extracted. Enter the fields manually and confirm them.",
      );
    } catch (caught) {
      const reason = caught instanceof ApiError ? caught.message : "Upload or extraction failed.";
      setError(`${reason} Enter the fields manually.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-white/20 p-4">
      <label className="block text-sm text-ivory" htmlFor={`upload-${documentType}`}>
        {documentType === "bill" ? "Electricity bill" : "Vendor quote"} file
      </label>
      <input
        id={`upload-${documentType}`}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        disabled={busy}
        className="mt-3 block w-full text-sm text-ivory-dim file:mr-3 file:rounded-full file:border-0 file:bg-amber file:px-4 file:py-2 file:text-sm file:text-ink"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          void onFile(file);
          event.target.value = "";
        }}
      />
      <p className="mt-2 text-xs leading-5 text-ivory-dim">
        Optional. PDF, JPEG, or PNG up to 8 MB. You can skip the file and type the values.
      </p>
      {busy ? <p role="status" className="mt-2 text-sm text-amber">Sending the document…</p> : null}
      {message ? <p role="status" className="mt-2 text-sm text-ivory">{message}</p> : null}
      {error ? <div className="mt-3"><ErrorState title="Document not used" message={error} /></div> : null}
    </div>
  );
}
