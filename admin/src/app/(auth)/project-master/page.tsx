import { GoogleSheetsProjectRepository } from "@/server/contexts/shared/infrastructure/repositories/google-sheets-project.repository";
import ProjectMasterClient from "@/client/components/projects/ProjectMasterClient";

export default async function ProjectMasterPage() {
    const projectRepo = new GoogleSheetsProjectRepository();
    const projects = await projectRepo.findAll();

    return (
        <div className="max-w-7xl mx-auto py-4">
            <ProjectMasterClient initialProjects={projects} />
        </div>
    );
}
