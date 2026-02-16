
import { GoogleSheetsProjectRepository } from "@/server/contexts/shared/infrastructure/repositories/google-sheets-project.repository";
import { GoogleSheetsTransactionRepository } from "@/server/contexts/shared/infrastructure/repositories/google-sheets-transaction.repository";
import ProjectAnalysisClient from "@/client/components/projects/ProjectAnalysisClient";

export default async function ProjectsPage() {
    const projectRepo = new GoogleSheetsProjectRepository();
    const transactionRepo = new GoogleSheetsTransactionRepository();

    const [projects, allTransactions] = await Promise.all([
        projectRepo.findAll(),
        transactionRepo.findWithPagination({}, { page: 1, perPage: 100000 }), // Fetch all for now
    ]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">案件分析</h1>
                <p className="text-muted-foreground mt-1">プロジェクトごとの収支・利益率を分析します</p>
            </div>

            <ProjectAnalysisClient projects={projects} transactions={allTransactions.items} />
        </div>
    );
}
