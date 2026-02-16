
import { GoogleSheetsClient } from "../google-sheets/client";
import type { ITransactionRepository, PaginatedResult, PaginationOptions } from "../../domain/repositories/transaction-repository.interface";
import type { TransactionFilters, CreateTransactionInput, UpdateTransactionInput, TransactionWithOrganization } from "../../domain/transaction";
import type { Transaction } from "@/shared/models/transaction";

export class GoogleSheetsTransactionRepository implements ITransactionRepository {
    private client: GoogleSheetsClient;
    private readonly SHEET_NAME = "Transactions";
    private readonly HEADERS = [
        "id", "project_id", "transaction_no", "transaction_date", "financial_year",
        "transaction_type", "debit_account", "debit_sub_account", "debit_department",
        "debit_partner", "debit_tax_category", "debit_amount", "credit_account",
        "credit_sub_account", "credit_department", "credit_partner", "credit_tax_category",
        "credit_amount", "description", "friendly_category", "memo", "category_key",
        "label", "hash", "created_at", "updated_at"
    ];

    constructor() {
        this.client = GoogleSheetsClient.getInstance();
    }

    private async fetchAll(): Promise<Transaction[]> {
        const service = await this.client.getSheetsService();
        const spreadsheetId = this.client.getSpreadsheetId();

        const response = await service.spreadsheets.values.get({
            spreadsheetId,
            range: `${this.SHEET_NAME}!A2:Z`,
        });

        const rows = response.data.values || [];
        // Filter out empty rows (at least id or transaction_date should exist)
        return rows
            .filter(row => row && row.length > 0 && (row[0] || row[3]))
            .map(row => this.mapRowToTransaction(row));
    }

    private mapRowToTransaction(row: any[]): Transaction {
        const parseDate = (val: any) => {
            if (!val) return new Date();
            const date = new Date(val);
            return isNaN(date.getTime()) ? new Date() : date;
        };

        const parseFloatSafe = (val: any) => {
            if (!val) return 0;
            const parsed = parseFloat(String(val).replace(/,/g, ""));
            return isNaN(parsed) ? 0 : parsed;
        };

        return {
            id: row[0] || "",
            project_id: row[1] || undefined,
            transaction_no: row[2] || "",
            transaction_date: parseDate(row[3]),
            financial_year: parseInt(row[4] || "0", 10),
            transaction_type: (row[5] as "income" | "expense" | "non_cash_journal") || "expense",
            debit_account: row[6] || "",
            debit_sub_account: row[7] || undefined,
            debit_department: row[8] || undefined,
            debit_partner: row[9] || undefined,
            debit_tax_category: row[10] || undefined,
            debit_amount: parseFloatSafe(row[11]),
            credit_account: row[12] || "",
            credit_sub_account: row[13] || undefined,
            credit_department: row[14] || undefined,
            credit_partner: row[15] || undefined,
            credit_tax_category: row[16] || undefined,
            credit_amount: parseFloatSafe(row[17]),
            description: row[18] || undefined,
            friendly_category: row[19] || undefined,
            memo: row[20] || undefined,
            category_key: row[21] || undefined,
            label: row[22] || "",
            hash: row[23] || "",
            created_at: parseDate(row[24]),
            updated_at: parseDate(row[25]),
        };
    }

    private mapTransactionToRow(t: Transaction): any[] {
        return [
            t.id, t.project_id || "", t.transaction_no, t.transaction_date.toISOString(), t.financial_year,
            t.transaction_type, t.debit_account, t.debit_sub_account || "", t.debit_department || "",
            t.debit_partner || "", t.debit_tax_category || "", t.debit_amount, t.credit_account,
            t.credit_sub_account || "", t.credit_department || "", t.credit_partner || "", t.credit_tax_category || "",
            t.credit_amount, t.description || "", t.friendly_category || "", t.memo || "", t.category_key || "",
            t.label, t.hash, t.created_at.toISOString(), t.updated_at.toISOString()
        ];
    }

    async findWithPagination(
        filters?: TransactionFilters,
        pagination?: PaginationOptions
    ): Promise<PaginatedResult<TransactionWithOrganization>> {
        const all = await this.fetchAll();

        // In-memory filtering
        let filtered = all.filter(t => {
            if (filters?.project_ids && filters.project_ids.length > 0 && (!t.project_id || !filters.project_ids.includes(t.project_id))) return false;
            if (filters?.transaction_type && t.transaction_type !== filters.transaction_type) return false;
            // ... more filters
            if (filters?.date_from && new Date(t.transaction_date) < filters.date_from) return false;
            if (filters?.date_to && new Date(t.transaction_date) > filters.date_to) return false;
            return true;
        });

        const total = filtered.length;
        const page = pagination?.page || 1;
        const perPage = pagination?.perPage || 50;
        const startIndex = (page - 1) * perPage;

        const items = filtered.slice(startIndex, startIndex + perPage) as TransactionWithOrganization[];

        return {
            items,
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage),
        };
    }

    async findByTransactionNos(transactionNos: string[]): Promise<Transaction[]> {
        const all = await this.fetchAll();
        return all.filter(t => transactionNos.includes(t.transaction_no));
    }

    async createMany(inputs: CreateTransactionInput[]): Promise<Transaction[]> {
        // Generate simple IDs and timestamps
        const now = new Date();
        const transactions: Transaction[] = inputs.map((input, idx) => ({
            id: `${now.getTime()}-${idx}`, // Simple ID generation
            ...input,
            label: input.label || "", // Default to empty string
            created_at: now,
            updated_at: now,
        }));

        const rows = transactions.map(t => this.mapTransactionToRow(t));

        const service = await this.client.getSheetsService();
        const spreadsheetId = this.client.getSpreadsheetId();

        await service.spreadsheets.values.append({
            spreadsheetId,
            range: `${this.SHEET_NAME}!A:A`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: rows,
            },
        });

        return transactions;
    }

    async updateMany(
        data: Array<{
            where: { transactionNo: string };
            update: UpdateTransactionInput;
        }>
    ): Promise<Transaction[]> {
        // This is inefficient in Sheets API without keeping track of row indices.
        // For now, read all, update in memory, write back all (Safe for single user)
        // OR: create a map of transactionNo -> rowIndex and issue batch updates.

        const service = await this.client.getSheetsService();
        const spreadsheetId = this.client.getSpreadsheetId();

        // Fetch all to get current state and row indices
        // A2:Z
        const response = await service.spreadsheets.values.get({
            spreadsheetId,
            range: `${this.SHEET_NAME}!A2:Z`,
        });

        const rows = response.data.values || [];
        const updatedTransactions: Transaction[] = [];
        const updates: any[] = []; // for batchUpdate if we went that route, but value ranges are easier if contiguous.

        // Optimistic approach: We will rewrite the WHOLE sheet if we have updates.
        // Actually, let's try to update specific rows if possible.
        // Finding row index for each transactionNo

        // Map transactionNo -> Row Index (0-based from rows array, so +2 for A1 notation)
        const transactionRowMap = new Map<string, number>();
        rows.forEach((row, index) => {
            const transactionNo = row[2]; // transaction_no is at index 2
            if (transactionNo) {
                transactionRowMap.set(transactionNo, index + 2);
            }
        });

        // We can use spreadsheets.values.batchUpdate
        const dataToUpdate: any[] = [];

        for (const item of data) {
            const rowIndex = transactionRowMap.get(item.where.transactionNo);
            if (rowIndex) {
                // Construct the new row. We need the existing row data to merge.
                const existingRow = rows[rowIndex - 2];
                const existingTransaction = this.mapRowToTransaction(existingRow);

                const updatedTransaction = {
                    ...existingTransaction,
                    ...item.update,
                    updated_at: new Date(),
                };

                const newRow = this.mapTransactionToRow(updatedTransaction);

                dataToUpdate.push({
                    range: `${this.SHEET_NAME}!A${rowIndex}:Z${rowIndex}`,
                    values: [newRow],
                });

                updatedTransactions.push(updatedTransaction);
            }
        }

        if (dataToUpdate.length > 0) {
            await service.spreadsheets.values.batchUpdate({
                spreadsheetId,
                requestBody: {
                    valueInputOption: "USER_ENTERED",
                    data: dataToUpdate,
                },
            });
        }

        return updatedTransactions;
    }

    async deleteAll(filters?: TransactionFilters): Promise<number> {
        const service = await this.client.getSheetsService();
        const spreadsheetId = this.client.getSpreadsheetId();

        if (!filters || Object.keys(filters).length === 0) {
            // Clear all data except header
            await service.spreadsheets.values.clear({
                spreadsheetId,
                range: `${this.SHEET_NAME}!A2:Z`,
            });
            return 1000; // Unknown count
        }

        // Filter-based delete is hard using clear. 
        // We have to read all, filter out, clear all, write back remaining.
        const all = await this.fetchAll();
        const kept = all.filter(t => {
            // INVERT logic of findWithPagination
            if (filters?.project_ids && filters.project_ids.length > 0 && (t.project_id && filters.project_ids.includes(t.project_id))) return false; // Should delete
            // ... full implementation needed
            return true;
        });

        // Write back `kept`
        // Clear first
        await service.spreadsheets.values.clear({
            spreadsheetId,
            range: `${this.SHEET_NAME}!A2:Z`,
        });

        if (kept.length > 0) {
            const rows = kept.map(t => this.mapTransactionToRow(t));
            await service.spreadsheets.values.append({
                spreadsheetId,
                range: `${this.SHEET_NAME}!A:A`,
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: rows,
                },
            });
        }

        return all.length - kept.length;
    }
}
