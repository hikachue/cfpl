"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent
} from "@/client/components/ui/card";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";
import { Label } from "@/client/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/client/components/ui/select";
import { Textarea } from "@/client/components/ui/textarea";
import { saveTransactionAction } from "@/server/contexts/data-import/presentation/actions/save-transaction";
import type { Project } from "@/shared/models/project";
import type { TransactionType } from "@/shared/models/transaction";
import { toast } from "sonner";

interface TransactionEntryFormProps {
    projects: Project[];
}

export default function TransactionEntryForm({ projects }: TransactionEntryFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        transaction_date: new Date().toISOString().split("T")[0],
        transaction_type: "expense" as TransactionType,
        description: "",
        amount: "",
        project_id: "none",
        category_key: "fixed-cost",
        debit_account: "什器備品費",
        credit_account: "普通預金",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await saveTransactionAction({
                ...formData,
                amount: Number(formData.amount),
                project_id: formData.project_id === "none" ? undefined : formData.project_id,
            });

            if (result.success) {
                toast.success("取引を保存しました");
                router.push("/transactions");
            } else {
                toast.error("保存に失敗しました: " + result.error);
            }
        } catch (err) {
            toast.error("エラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto border-border/50 shadow-lg">
            <CardHeader>
                <CardTitle>手入力フォーム</CardTitle>
                <CardDescription>
                    日々の取引データを手動で登録します。
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">取引日</Label>
                            <Input
                                id="date"
                                type="date"
                                required
                                value={formData.transaction_date}
                                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">取引タイプ</Label>
                            <Select
                                value={formData.transaction_type}
                                onValueChange={(val: TransactionType) => setFormData({ ...formData, transaction_type: val })}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="タイプを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="expense">支出 (現金/振込)</SelectItem>
                                    <SelectItem value="income">収入 (売上/雑益)</SelectItem>
                                    <SelectItem value="non_cash_journal">振替伝票 (非現金)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">内容 / 摘要</Label>
                        <Input
                            id="description"
                            placeholder="例: 文房具購入, 〇〇案件売上"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">金額</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project">対象案件</Label>
                            <Select
                                value={formData.project_id}
                                onValueChange={(val) => setFormData({ ...formData, project_id: val })}
                            >
                                <SelectTrigger id="project">
                                    <SelectValue placeholder="案件を選択 (任意)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">(指定なし)</SelectItem>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">管理区分</Label>
                            <Select
                                value={formData.category_key}
                                onValueChange={(val) => setFormData({ ...formData, category_key: val })}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="区分を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="variable-cost">変動費</SelectItem>
                                    <SelectItem value="fixed-cost">固定費</SelectItem>
                                    <SelectItem value="non-operating">営業外</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => router.back()}>
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={loading} className="w-32">
                            {loading ? "保存中..." : "保存する"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
