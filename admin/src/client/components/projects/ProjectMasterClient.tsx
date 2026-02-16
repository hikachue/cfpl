"use client";

import { useState } from "react";
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent
} from "@/client/components/ui/card";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";
import { Label } from "@/client/components/ui/label";
import {
    Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "@/client/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/client/components/ui/dialog";
import { Textarea } from "@/client/components/ui/textarea";
import { saveProjectAction } from "@/server/contexts/data-import/presentation/actions/save-project";
import type { Project } from "@/shared/models/project";
import { Plus, Edit2, FolderPlus } from "lucide-react";
import { toast } from "sonner";

interface ProjectMasterClientProps {
    initialProjects: Project[];
}

export default function ProjectMasterClient({ initialProjects }: ProjectMasterClientProps) {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCreate = () => {
        setEditingProject({ name: "", code: "", description: "" });
        setIsDialogOpen(true);
    };

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject?.name) return;

        setLoading(true);
        try {
            const result = await saveProjectAction(editingProject as any);
            if (result.success) {
                toast.success("プロジェクトを保存しました");
                setIsDialogOpen(false);
                // In a real app, we'd revalidate or refresh data from server.
                // For now, let's just reload.
                window.location.reload();
            } else {
                toast.error("保存失敗: " + result.error);
            }
        } catch (err) {
            toast.error("エラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">案件マスタ</h1>
                    <p className="text-muted-foreground mt-1">集計用のプロジェクト項目を管理します</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    新規案件追加
                </Button>
            </div>

            <Card className="border-border/50 shadow-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">案件名</TableHead>
                            <TableHead className="w-[120px]">コード</TableHead>
                            <TableHead>説明</TableHead>
                            <TableHead className="w-[100px]">ステータス</TableHead>
                            <TableHead className="w-[80px] text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.name}</TableCell>
                                <TableCell>{p.code || "-"}</TableCell>
                                <TableCell className="text-muted-foreground truncate max-w-xs">{p.description || "-"}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${p.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-secondary text-muted-foreground'}`}>
                                        {p.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {projects.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    案件が登録されていません
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingProject?.id ? '案件を編集' : '新規案件登録'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">案件名 (必須)</Label>
                            <Input
                                id="name"
                                required
                                value={editingProject?.name || ""}
                                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">案件コード</Label>
                            <Input
                                id="code"
                                placeholder="PROJ-001"
                                value={editingProject?.code || ""}
                                onChange={(e) => setEditingProject({ ...editingProject, code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">説明</Label>
                            <Textarea
                                id="desc"
                                value={editingProject?.description || ""}
                                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                                キャンセル
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "保存中..." : "保存"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
