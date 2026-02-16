"use client";

import type { FinancialSummary } from "@/server/contexts/data-import/application/usecases/get-financial-summary-usecase";
import React from "react";

interface IntegratedProfitDashboardProps {
    summary: FinancialSummary;
}

export default function IntegratedProfitDashboard({ summary }: IntegratedProfitDashboardProps) {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(val);

    const profitCards = [
        { label: "売上高", value: summary.revenue, color: "text-blue-400" },
        { label: "限界利益", value: summary.marginalProfit, color: "text-emerald-400", sub: `率: ${summary.revenue ? ((summary.marginalProfit / summary.revenue) * 100).toFixed(1) : 0}%` },
        { label: "営業利益", value: summary.operatingProfit, color: "text-orange-400" },
        { label: "経常利益", value: summary.ordinaryProfit, color: "text-purple-400", highlight: true },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {profitCards.map((card) => (
                    <div key={card.label} className={`bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow ${card.highlight ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
                        <div className="text-sm font-medium text-muted-foreground mb-2">{card.label}</div>
                        <div className={`text-2xl font-bold ${card.color}`}>{formatCurrency(card.value)}</div>
                        {card.sub && <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>}
                    </div>
                ))}
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4">利益構造分析</h3>
                <div className="space-y-4">
                    <ProgressBar label="限界利益率" value={summary.revenue ? (summary.marginalProfit / summary.revenue) * 100 : 0} color="bg-emerald-500" />
                    <ProgressBar label="営業利益率" value={summary.revenue ? (summary.operatingProfit / summary.revenue) * 100 : 0} color="bg-orange-500" />
                    <ProgressBar label="経常利益率" value={summary.revenue ? (summary.ordinaryProfit / summary.revenue) * 100 : 0} color="bg-purple-500" />
                </div>
            </div>
        </div>
    );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
    const percentage = Math.max(0, Math.min(100, value));
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span className="font-medium">{value.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-1000 w-[var(--progress-width)]`}
                    style={{ "--progress-width": `${percentage}%` } as React.CSSProperties}
                ></div>
            </div>
        </div>
    );
}
