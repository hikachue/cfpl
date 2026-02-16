
import { NextRequest, NextResponse } from "next/server";
import { GoogleSheetsProjectRepository } from "@/server/contexts/shared/infrastructure/repositories/google-sheets-project.repository";
import type { CreateProjectInput } from "@/shared/models/project";

export async function GET() {
    try {
        const repository = new GoogleSheetsProjectRepository();
        const projects = await repository.findAll();
        return NextResponse.json(projects);
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const repository = new GoogleSheetsProjectRepository();

        // Basic validation
        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const input: CreateProjectInput = {
            name: body.name,
            code: body.code,
            description: body.description,
            status: body.status || "active",
            start_date: body.start_date ? new Date(body.start_date) : undefined,
            end_date: body.end_date ? new Date(body.end_date) : undefined,
        };

        const project = await repository.create(input);
        return NextResponse.json(project);
    } catch (error) {
        console.error("Failed to create project:", error);
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
