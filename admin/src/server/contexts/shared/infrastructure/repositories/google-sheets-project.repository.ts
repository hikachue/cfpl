
import { GoogleSheetsClient } from "../google-sheets/client";
import type { IProjectRepository } from "../../domain/repositories/project-repository.interface";
import type { Project, CreateProjectInput, UpdateProjectInput } from "@/shared/models/project";

export class GoogleSheetsProjectRepository implements IProjectRepository {
    private client: GoogleSheetsClient;
    private readonly SHEET_NAME = "Projects";

    constructor() {
        this.client = GoogleSheetsClient.getInstance();
    }

    private async fetchAll(): Promise<Project[]> {
        const service = await this.client.getSheetsService();
        const spreadsheetId = this.client.getSpreadsheetId();

        try {
            const response = await service.spreadsheets.values.get({
                spreadsheetId,
                range: `${this.SHEET_NAME}!A2:I`, // Expanded to A-I (9 columns)
            });

            const rows = response.data.values || [];
            // Filter out empty rows (at least id or name should exist)
            return rows
                .filter(row => row && row.length > 0 && (row[0] || row[1]))
                .map(row => this.mapRowToProject(row));
        } catch (error) {
            console.warn("Failed to fetch projects (sheet might not exist yet):", error);
            return [];
        }
    }

    private mapRowToProject(row: any[]): Project {
        const parseDate = (val: any) => {
            if (!val) return undefined;
            const date = new Date(val);
            return isNaN(date.getTime()) ? undefined : date;
        };

        const now = new Date();

        return {
            id: row[0] || "",
            name: row[1] || "",
            code: row[2] || undefined,
            description: row[3] || undefined,
            status: (row[4] as "active" | "completed" | "archived") || "active",
            start_date: parseDate(row[5]),
            end_date: parseDate(row[6]),
            created_at: parseDate(row[7]) || now,
            updated_at: parseDate(row[8]) || now,
        };
    }

    private mapProjectToRow(p: Project): any[] {
        const formatDate = (d?: Date) => d ? d.toISOString() : "";
        return [
            p.id,
            p.name,
            p.code || "",
            p.description || "",
            p.status,
            formatDate(p.start_date),
            formatDate(p.end_date),
            formatDate(p.created_at),
            formatDate(p.updated_at)
        ];
    }

    async findAll(): Promise<Project[]> {
        return this.fetchAll();
    }

    async findById(id: string): Promise<Project | null> {
        const all = await this.fetchAll();
        return all.find(p => p.id === id) || null;
    }

    async create(input: CreateProjectInput): Promise<Project> {
        const now = new Date();
        const project: Project = {
            id: `${now.getTime()}-${Math.floor(Math.random() * 1000)}`,
            status: "active",
            created_at: now,
            updated_at: now,
            ...input,
        };

        const row = this.mapProjectToRow(project);

        const service = await this.client.getSheetsService();
        const spreadsheetId = this.client.getSpreadsheetId();

        await service.spreadsheets.values.append({
            spreadsheetId,
            range: `${this.SHEET_NAME}!A:A`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [row],
            },
        });

        return project;
    }

    async update(id: string, input: UpdateProjectInput): Promise<Project> {
        // Read all, update one, write back specific row logic similar to TransactionRepo
        // For simplicity, finding the row index is key.

        const service = await this.client.getSheetsService();
        const spreadsheetId = this.client.getSpreadsheetId();

        const response = await service.spreadsheets.values.get({
            spreadsheetId,
            range: `${this.SHEET_NAME}!A2:I`,
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(r => r[0] === id);

        if (rowIndex === -1) {
            throw new Error(`Project with ID ${id} not found`);
        }

        const existingProject = this.mapRowToProject(rows[rowIndex]);
        const updatedProject: Project = {
            ...existingProject,
            ...input,
            updated_at: new Date(),
        };

        const newRow = this.mapProjectToRow(updatedProject);
        const apiRowIndex = rowIndex + 2; // +2 because 1-based index and header row

        await service.spreadsheets.values.update({
            spreadsheetId,
            range: `${this.SHEET_NAME}!A${apiRowIndex}:I${apiRowIndex}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [newRow],
            },
        });

        return updatedProject;
    }

    async delete(id: string): Promise<void> {
        // Deleting rows in Sheets is hard via simple update. 
        // We typically set status to 'archived' or 'deleted' instead of physical delete.
        // Or we read all, filter, clear all, write back.
        // For now, let's implement soft delete by status update to archived?
        // Or truly delete.

        // Let's do true delete (read-filter-writeBack approach for small dataset)
        const all = await this.fetchAll();
        const kept = all.filter(p => p.id !== id);

        if (kept.length === all.length) return; // Not found

        const service = await this.client.getSheetsService();
        const spreadsheetId = this.client.getSpreadsheetId();

        await service.spreadsheets.values.clear({
            spreadsheetId,
            range: `${this.SHEET_NAME}!A2:I`,
        });

        if (kept.length > 0) {
            const rows = kept.map(p => this.mapProjectToRow(p));
            await service.spreadsheets.values.append({
                spreadsheetId,
                range: `${this.SHEET_NAME}!A:A`,
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: rows,
                },
            });
        }
    }
}
