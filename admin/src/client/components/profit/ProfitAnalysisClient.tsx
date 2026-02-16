"use client";

import { useMemo } from "react";
import type { TransactionWithOrganization } from "@/server/contexts/shared/domain/transaction";
import { Card, CardHeader, CardTitle, CardContent } from "@/client/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/client/components/ui/table";

interface ProfitAnalysisClientProps {
    transactions: TransactionWithOrganization[];
}

export default function ProfitAnalysisClient({ transactions }: ProfitAnalysisClientProps) {
    const breakdown = useMemo(() => {
        const income: Record<string, number> = {};
        const expense: Record<string, number> = {};

        for (const t of transactions) {
            const amount = Math.abs(t.debit_amount || t.credit_amount || 0);
            const category = t.category_key || t.debit_account || t.credit_account || "その他";

            if (t.transaction_type === "income") {
                income[category] = (income[category] || 0) + amount;
            } else if (t.transaction_type === "expense") {
                expense[category] = (expense[category] || 0) + amount;
            }
        }

        const sortEntries = (obj: Record<string, number>) =>
            Object.entries(obj).sort((a, b) => b[1] - a[1]);

        return {
            income: sortEntries(income),
            expense: sortEntries(expense),
            totalIncome: Object.values(income).reduce((a, b) => a + b, 0),
            totalExpense: Object.values(expense).reduce((a, b) => a + b, 0),
        };
    }, [transactions]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(val);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-emerald-400">収入内訳</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>カテゴリ / 科目</TableHead>
                                <TableHead className="text-right">金額</TableHead>
                                <TableHead className="text-right w-[80px]">構成比</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {breakdown.income.map(([cat, val]) => (
                                <TableRow key={cat}>
                                    <TableCell>{cat}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(val)}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-xs">
                                        {((val / breakdown.totalIncome) * 100).toFixed(1)}%
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-secondary/30 font-bold">
                                <TableCell>合計</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(breakdown.totalIncome)}</TableCell>
                                <TableCell className="text-right">100%</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-red-400">支出内訳</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>カテゴリ / 科目</TableHead>
                                <TableHead className="text-right">金額</TableHead>
                                <TableHead className="text-right w-[80px]">構成比</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {breakdown.expense.map(([cat, val]) => (
                                <TableRow key={cat}>
                                    <TableCell>{cat}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(val)}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-xs">
                                        {((val / breakdown.totalExpense) * 100).toFixed(1)}%
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-secondary/30 font-bold">
                                <TableCell>合計</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(breakdown.totalExpense)}</TableCell>
                                <TableCell className="text-right">100%</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
