"use server";

import { updateTag } from "next/cache";
// import { prisma } from "@/server/contexts/shared/infrastructure/prisma"; // Removed
import { GoogleSheetsTransactionRepository } from "@/server/contexts/shared/infrastructure/repositories/google-sheets-transaction.repository";
import { DeleteAllTransactionsUsecase } from "@/server/contexts/data-import/application/usecases/delete-all-transactions-usecase";

export async function deleteAllTransactionsAction(): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const repository = new GoogleSheetsTransactionRepository();
    const usecase = new DeleteAllTransactionsUsecase(repository);

    const result = await usecase.execute();

    // データキャッシュを無効化してトランザクション一覧を更新
    updateTag("transactions-data");

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
