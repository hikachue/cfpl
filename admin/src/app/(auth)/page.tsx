import { GoogleSheetsTransactionRepository } from "@/server/contexts/shared/infrastructure/repositories/google-sheets-transaction.repository";
import { GetFinancialSummaryUsecase } from "@/server/contexts/data-import/application/usecases/get-financial-summary-usecase";
import { GetTransactionsUsecase } from "@/server/contexts/data-import/application/usecases/get-transactions-usecase";
import IntegratedProfitDashboard from "@/client/components/dashboard/IntegratedProfitDashboard";
import { Button } from "@/client/components/ui";
import Link from "next/link";
import { ArrowRight, Download, Plus } from "lucide-react";

export default async function DashboardPage() {
  const repository = new GoogleSheetsTransactionRepository();
  const summaryUsecase = new GetFinancialSummaryUsecase(repository);
  const transactionsUsecase = new GetTransactionsUsecase(repository);

  // Fetch summary and recent transactions
  const [summary, recentTransactions] = await Promise.all([
    summaryUsecase.execute(),
    transactionsUsecase.execute({ page: 1, perPage: 5 }),
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Basement Mgt. 経営状況サマリー</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/upload-csv">
              <Download className="mr-2 h-4 w-4" />
              CSVインポート
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/entry">
              <Plus className="mr-2 h-4 w-4" />
              データ入力
            </Link>
          </Button>
        </div>
      </div>

      <IntegratedProfitDashboard summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">最近の取引</h2>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 transition-colors" asChild>
              <Link href="/transactions">
                すべて表示
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-1">
            {recentTransactions.transactions.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{t.description || "名称なし"}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(t.transaction_date).toLocaleDateString("ja-JP")}</span>
                    <span>•</span>
                    <span>{t.debit_account} / {t.credit_account}</span>
                  </div>
                </div>
                <div className={`font-mono font-bold ${t.transaction_type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                  {t.transaction_type === "income" ? "+" : "-"}
                  {new Intl.NumberFormat("ja-JP").format(Math.abs(t.debit_amount || t.credit_amount || 0))}
                </div>
              </div>
            ))}
            {recentTransactions.transactions.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                表示できる取引履歴がありません。
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">目標達成率</h2>
            <div className="space-y-6">
              <TargetProgress label="売上目標" current={summary.revenue} target={50000000} color="text-blue-400" />
              <TargetProgress label="経常利益目標" current={summary.ordinaryProfit} target={10000000} color="text-purple-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TargetProgress({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const percentage = Math.min(100, (current / target) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-1000 w-[var(--target-width)]"
          style={{ "--target-width": `${percentage}%` } as React.CSSProperties}
        ></div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", notation: "compact" }).format(current)}</span>
        <span>目標: {new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", notation: "compact" }).format(target)}</span>
      </div>
    </div>
  );
}
