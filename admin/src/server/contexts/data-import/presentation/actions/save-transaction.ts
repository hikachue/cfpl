"use server";

import { GoogleSheetsTransactionRepository } from "@/server/contexts/shared/infrastructure/repositories/google-sheets-transaction.repository";
import type { TransactionType } from "@/shared/models/transaction";
import { revalidatePath } from "next/cache";

export interface SaveTransactionInput {
    transaction_date: string;
    transaction_type: TransactionType;
    description: string;
    amount: number;
    project_id?: string;
    category_key?: string;
    debit_account: string;
    credit_account: string;
}

export async function saveTransactionAction(input: SaveTransactionInput) {
    try {
        const repository = new GoogleSheetsTransactionRepository();

        // Convert input to repository format
        const createInput = {
            transaction_date: new Date(input.transaction_date),
            transaction_type: input.transaction_type,
            description: input.description,
            debit_amount: input.transaction_type === "income" ? 0 : input.amount,
            credit_amount: input.transaction_type === "income" ? input.amount : 0,
            debit_account: input.debit_account,
            credit_account: input.credit_account,
            project_id: input.project_id,
            category_key: input.category_key,
            transaction_no: `manual-${Date.now()}`,
            financial_year: new Date(input.transaction_date).getFullYear(),
            label: "",
            hash: "",
        };

        await repository.createMany([createInput]);

        revalidatePath("/");
        revalidatePath("/transactions");
        revalidatePath("/projects");

        return { success: true };
    } catch (error) {
        console.error("Save transaction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
