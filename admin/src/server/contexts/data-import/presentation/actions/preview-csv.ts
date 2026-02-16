"use server";

import { bufferToString } from "@/server/contexts/data-import/domain/services/encoding-converter";
// import { prisma } from "@/server/contexts/shared/infrastructure/prisma"; // Removed
import { GoogleSheetsTransactionRepository } from "@/server/contexts/shared/infrastructure/repositories/google-sheets-transaction.repository";
import { PreviewMfCsvUsecase } from "@/server/contexts/data-import/application/usecases/preview-mf-csv-usecase";
import type { PreviewMfCsvResult } from "@/server/contexts/data-import/application/usecases/preview-mf-csv-usecase";

const transactionRepository = new GoogleSheetsTransactionRepository();
const previewUsecase = new PreviewMfCsvUsecase(transactionRepository);

export interface PreviewCsvRequest {
  file: File;
  // politicalOrganizationId: string; // Removed
}

export async function previewCsv(data: PreviewCsvRequest): Promise<PreviewMfCsvResult> {
  "use server";
  try {
    const { file } = data;

    if (!file) {
      throw new Error("ファイルが選択されていません");
    }

    // if (!politicalOrganizationId) { ... } // Removed

    // Convert file to buffer and then to properly encoded string
    const csvBuffer = Buffer.from(await file.arrayBuffer());
    const csvContent = bufferToString(csvBuffer);

    const result = await previewUsecase.execute({
      csvContent,
      // politicalOrganizationId, // Removed
    });

    return result;
  } catch (error) {
    console.error("Preview CSV error:", error);
    throw error instanceof Error ? error : new Error("サーバー内部エラーが発生しました");
  }
  // finally { await prisma.$disconnect(); } // Removed
}
