
export interface Project {
    id: string;
    name: string;
    code?: string;
    description?: string;
    status: "active" | "completed" | "archived";
    start_date?: Date;
    end_date?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface CreateProjectInput {
    name: string;
    code?: string;
    description?: string;
    status?: "active" | "completed" | "archived";
    start_date?: Date;
    end_date?: Date;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> { }
