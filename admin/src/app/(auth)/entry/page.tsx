import { GoogleSheetsProjectRepository } from "@/server/contexts/shared/infrastructure/repositories/google-sheets-project.repository";
import TransactionEntryForm from "@/client/components/transactions/TransactionEntryForm";

export default async function EntryPage() {
    const projectRepo = new GoogleSheetsProjectRepository();
    const projects = await projectRepo.findAll();

    return (
        <div className="space-y-6 max-w-7xl mx-auto py-4">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">データ入力</h1>
                <p className="text-muted-foreground mt-1">手動で取引データを登録します</p>
            </div>

            <TransactionEntryForm projects={projects} />
        </div>
    );
}
