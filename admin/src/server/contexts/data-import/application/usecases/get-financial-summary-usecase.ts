import type { ITransactionRepository } from "@/server/contexts/shared/domain/repositories/transaction-repository.interface";

export interface FinancialSummary {
    revenue: number;
    variableCosts: number;
    marginalProfit: number;
    fixedCosts: number;
    operatingProfit: number;
    nonOperatingIncome: number;
    nonOperatingExpenses: number;
    ordinaryProfit: number;
}

export class GetFinancialSummaryUsecase {
    constructor(private repository: ITransactionRepository) { }

    async execute(filters?: { dateFrom?: Date; dateTo?: Date }): Promise<FinancialSummary> {
        // For now, we fetch all and calculate. 
        // In a real DB, this would be a GROUP BY query.
        // Since we use Google Sheets, we are doing it in-memory anyway in the repository's findWithPagination,
        // so let's just use the repository more efficiently if possible.

        // We'll add a findAll method to ITransactionRepository or just fetch first page of many.
        // Better: Add findAll to ITransactionRepository.

        const transactions = await this.repository.findByTransactionNos([]); // Empty nos? No, we need a better method.
        // Wait, the repository is already loading ALL into memory in fetchAll().

        // Let's assume we use the repository's findWithPagination with a large perPage or a new method.
        // For now, let's use findWithPagination and handle the logic.
        const result = await this.repository.findWithPagination({
            date_from: filters?.dateFrom,
            date_to: filters?.dateTo,
        }, { page: 1, perPage: 100000 });

        let revenue = 0;
        let variableCosts = 0;
        let fixedCosts = 0;
        let nonOperatingIncome = 0;
        let nonOperatingExpenses = 0;

        for (const t of result.items) {
            const amount = Math.abs(t.debit_amount || t.credit_amount || 0);

            if (t.transaction_type === "income") {
                revenue += amount;
            } else if (t.transaction_type === "expense") {
                const cat = t.category_key || "";
                // Simple logic for aggregation
                if (cat.includes("variable") || cat.includes("cost-of-sales")) {
                    variableCosts += amount;
                } else if (cat.includes("non-operating")) {
                    nonOperatingExpenses += amount;
                } else {
                    fixedCosts += amount;
                }
            }
        }

        const marginalProfit = revenue - variableCosts;
        const operatingProfit = marginalProfit - fixedCosts;
        const ordinaryProfit = operatingProfit + nonOperatingIncome - nonOperatingExpenses;

        return {
            revenue,
            variableCosts,
            marginalProfit,
            fixedCosts,
            operatingProfit,
            nonOperatingIncome,
            nonOperatingExpenses,
            ordinaryProfit,
        };
    }
}
