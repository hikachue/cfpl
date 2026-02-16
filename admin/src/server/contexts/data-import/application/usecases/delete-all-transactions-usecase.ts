import type { ITransactionRepository } from "@/server/contexts/shared/domain/repositories/transaction-repository.interface";
import type { TransactionFilters } from "@/server/contexts/shared/domain/transaction";

export interface DeleteAllTransactionsResult {
  deletedCount: number;
}

export class DeleteAllTransactionsUsecase {
  constructor(private repository: ITransactionRepository) { }

  async execute(): Promise<DeleteAllTransactionsResult> {
    try {
      const deletedCount = await this.repository.deleteAll();

      return {
        deletedCount,
      };
    } catch (error) {
      throw new Error(
        `Failed to delete transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
