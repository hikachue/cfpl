"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Project } from "@/shared/models/project";
import type { TransactionWithOrganization } from "@/server/contexts/shared/domain/transaction";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/client/components/ui/select"; // Assuming this exists or I will create it
import { Card } from "@/client/components/ui/card"; // Assuming this exists

interface ProjectAnalysisClientProps {
    projects: Project[];
    transactions: TransactionWithOrganization[];
}

export default function ProjectAnalysisClient({ projects, transactions }: ProjectAnalysisClientProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "all");

    const filteredTransactions = useMemo(() => {
        if (selectedProjectId === "all") return transactions;
        return transactions.filter((t) => t.project_id === selectedProjectId);
    }, [selectedProjectId, transactions]);

    const stats = useMemo(() => {
        let revenue = 0;
        let variableCosts = 0;
        let fixedCosts = 0;
        let others = 0;

        const monthlyData: Record<string, { revenue: number; variable: number; fixed: number; others: number }> = {};

        for (const t of filteredTransactions) {
            const date = new Date(t.transaction_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { revenue: 0, variable: 0, fixed: 0, others: 0 };
            }

            const amount = Math.abs(t.debit_amount || t.credit_amount || 0);

            if (t.transaction_type === "income") {
                revenue += amount;
                monthlyData[monthKey].revenue += amount;
            } else if (t.transaction_type === "expense") {
                const cat = t.category_key || "";
                if (cat.includes("variable") || cat.includes("cost-of-sales")) {
                    variableCosts += amount;
                    monthlyData[monthKey].variable += amount;
                } else if (cat.includes("non-operating") || cat.includes("extraordinary")) {
                    others += amount;
                    monthlyData[monthKey].others += amount;
                } else {
                    fixedCosts += amount;
                    monthlyData[monthKey].fixed += amount;
                }
            }
        }

        const chartSeries = [
            { name: "売上", data: Object.keys(monthlyData).sort().map(k => monthlyData[k].revenue) },
            { name: "変動費", data: Object.keys(monthlyData).sort().map(k => monthlyData[k].variable) },
            { name: "固定費", data: Object.keys(monthlyData).sort().map(k => monthlyData[k].fixed) },
            { name: "その他/特別損益", data: Object.keys(monthlyData).sort().map(k => monthlyData[k].others) },
        ];

        const chartCategories = Object.keys(monthlyData).sort();

        return {
            revenue,
            variableCosts,
            marginalProfit: revenue - variableCosts,
            operatingProfit: (revenue - variableCosts) - fixedCosts,
            chartSeries,
            chartCategories
        };
    }, [filteredTransactions]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(val);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="プロジェクトを選択" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全プロジェクト合計</SelectItem>
                        {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-6">収支トレンド</h2>
                    <div className="h-[400px] w-full relative">
                        {stats.chartSeries[0].data.length > 0 ? (
                            <div className="w-full h-full pt-4">
                                <SVGLineChart series={stats.chartSeries} categories={stats.chartCategories} />
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                データがありません
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <StatsCard label="売上高" value={formatCurrency(stats.revenue)} color="text-blue-400" />
                    <StatsCard label="限界利益" value={formatCurrency(stats.marginalProfit)} color="text-emerald-400" sub={`利益率: ${stats.revenue ? ((stats.marginalProfit / stats.revenue) * 100).toFixed(1) : 0}%`} />
                    <StatsCard label="営業利益" value={formatCurrency(stats.operatingProfit)} color="text-orange-400" />
                </div>
            </div>
        </div>
    );
}

function SVGLineChart({ series, categories }: { series: { name: string; data: number[] }[], categories: string[] }) {
    const height = 300;
    const width = 800;
    const padding = 40;

    const allValues = series.flatMap(s => s.data);
    const maxValue = Math.max(...allValues, 1000000);

    const getX = (index: number) => padding + (index * (width - padding * 2) / (categories.length - 1 || 1));
    const getY = (value: number) => padding + (height - padding * 2) - (value * (height - padding * 2) / maxValue);

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                    <line
                        key={i}
                        x1={padding} y1={getY(maxValue * p)}
                        x2={width - padding} y2={getY(maxValue * p)}
                        stroke="#1e293b" strokeWidth="1"
                    />
                ))}

                {/* Series lines */}
                {series.map((s, si) => {
                    const points = s.data.map((v: number, i: number) => `${getX(i)},${getY(v)}`).join(" ");
                    const colors = ["#60A5FA", "#F87171", "#FBBF24", "#A78BFA"];
                    return (
                        <polyline
                            key={si}
                            fill="none"
                            stroke={colors[si % colors.length]}
                            strokeWidth={si === 0 ? "4" : "2"}
                            points={points}
                            className="transition-all duration-1000"
                        />
                    );
                })}

                {/* X labels */}
                {categories.map((c, i) => (
                    <text
                        key={i}
                        x={getX(i)} y={height - 5}
                        textAnchor="middle" fill="#94A3B8" fontSize="10"
                    >
                        {c}
                    </text>
                ))}
            </svg>
            <div className="mt-4 flex flex-wrap gap-4 justify-center">
                {series.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${["bg-blue-400", "bg-red-400", "bg-yellow-400", "bg-purple-400"][i % 4]}`}></div>
                        <span className="text-xs text-muted-foreground">{s.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatsCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
    return (
        <div className="bg-card border border-border/50 rounded-2xl p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        </div>
    );
}
