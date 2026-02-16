"use client";
import "client-only";

import { useId, useState } from "react";
import { Button, Input, Label } from "@/client/components/ui";
import CsvPreview from "@/client/components/csv-import/CsvPreview"; // This also needs fixing?
import type { PreviewMfCsvResult } from "@/server/contexts/data-import/presentation/types";
import type {
  UploadCsvRequest,
  UploadCsvResponse,
} from "@/server/contexts/data-import/presentation/actions/upload-csv";
import type { PreviewCsvRequest } from "@/server/contexts/data-import/presentation/actions/preview-csv";

interface CsvUploadClientProps {
  uploadAction: (data: UploadCsvRequest) => Promise<UploadCsvResponse>;
  previewAction: (data: PreviewCsvRequest) => Promise<PreviewMfCsvResult>;
}

export default function CsvUploadClient({
  uploadAction,
  previewAction,
}: CsvUploadClientProps) {
  const csvFileInputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [hasError, setHasError] = useState<boolean>(false);
  const [uploading, setUploading] = useState(false);
  const [previewResult, setPreviewResult] = useState<PreviewMfCsvResult | null>(null);

  const handlePreviewComplete = (result: PreviewMfCsvResult) => {
    setPreviewResult(result);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMessage("");
    setErrors([]);
    setHasError(false);

    try {
      if (!previewResult) {
        setMessage("Preview data not available");
        setHasError(true);
        return;
      }

      const validTransactions = previewResult.transactions.filter(
        (t) => t.status === "insert" || t.status === "update",
      );
      if (validTransactions.length === 0) {
        setMessage("保存可能なデータがありません");
        setHasError(true);
        return;
      }

      const result = await uploadAction({
        validTransactions,
        // politicalOrganizationId removed
      });

      if (!result.ok && result.errors && result.errors.length > 0) {
        setMessage(result.message);
        setErrors(result.errors);
        setHasError(true);
        return;
      }

      const uploadedFileName = file.name;
      const serverMessage =
        result.message ||
        `Successfully processed ${result.processedCount} records and saved ${result.savedCount} transactions`;

      setMessage(`"${uploadedFileName}" の取り込み結果: ${serverMessage}`);

      setFile(null);
      setPreviewResult(null);

      const fileInput = document.getElementById(csvFileInputId) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setHasError(true);
      if (err instanceof Error && err.stack) {
        setErrors([err.stack]);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor={csvFileInputId}>CSV File:</Label>
        <Input
          id={csvFileInputId}
          className="h-10 border-0 bg-transparent shadow-none file:mr-4 file:h-full file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
      </div>

      <CsvPreview
        file={file}
        onPreviewComplete={handlePreviewComplete}
        previewAction={previewAction}
      />

      {(() => {
        const isDisabled =
          !file ||
          !previewResult ||
          previewResult.summary.insertCount + previewResult.summary.updateCount === 0 ||
          uploading;

        return (
          <Button disabled={isDisabled} type="submit">
            {uploading ? "Processing…" : "このデータを保存する"}
          </Button>
        );
      })()}

      {message && (
        <div
          className={`mt-3 p-3 rounded border ${hasError
              ? "text-red-500 bg-red-900/20 border-red-900/30"
              : "text-green-500 bg-green-900/20 border-green-900/30"
            }`}
        >
          {message}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-3 p-3 rounded border text-red-500 bg-red-900/20 border-red-900/30">
          <div className="font-semibold mb-2">エラー詳細:</div>
          {errors.map((error) => (
            <div key={error} className="mb-2 last:mb-0">
              <pre className="whitespace-pre-wrap text-xs font-mono bg-red-950/30 p-2 rounded overflow-x-auto">
                {error}
              </pre>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
