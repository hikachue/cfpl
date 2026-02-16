import { GoogleSheetsTransactionRepository } from "@/server/contexts/shared/infrastructure/repositories/google-sheets-transaction.repository";
import ProfitAnalysisClient from "@/client/components/profit/ProfitAnalysisClient";

export default async function ProfitAnalysisPage() {
    const transactionRepo = new GoogleSheetsTransactionRepository();
    const allTransactions = await transactionRepo.findWithPagination({}, { page: 1, perPage: 100000 });

    return (
        <div className="space-y-6 max-w-7xl mx-auto py-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">収支分析</h1>
                <p className="text-muted-foreground mt-1">収入と支出の詳細な内訳を確認します</p>
            </div>

            <ProfitAnalysisClient transactions={allTransactions.items} />
        </div>
    );
}
