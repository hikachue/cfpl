
import type { Project, CreateProjectInput, UpdateProjectInput } from "@/shared/models/project";

export interface IProjectRepository {
    findAll(): Promise<Project[]>;
    findById(id: string): Promise<Project | null>;
    create(input: CreateProjectInput): Promise<Project>;
    update(id: string, input: UpdateProjectInput): Promise<Project>;
    delete(id: string): Promise<void>;
}
