"use server";

import { GoogleSheetsProjectRepository } from "@/server/contexts/shared/infrastructure/repositories/google-sheets-project.repository";
import type { CreateProjectInput, UpdateProjectInput } from "@/shared/models/project";
import { revalidatePath } from "next/cache";

export async function saveProjectAction(input: CreateProjectInput | (UpdateProjectInput & { id: string })) {
    try {
        const repository = new GoogleSheetsProjectRepository();

        if ("id" in input && input.id) {
            const { id, ...updateData } = input;
            await repository.update(id, updateData);
        } else {
            await repository.create(input as CreateProjectInput);
        }

        revalidatePath("/projects");
        revalidatePath("/project-master");
        revalidatePath("/");

        return { success: true };
    } catch (error) {
        console.error("Save project error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
