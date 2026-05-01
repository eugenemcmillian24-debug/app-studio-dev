import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { generatedProjects } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const projectDuplicationRouter = router({
  /**
   * Clone/duplicate an existing project
   */
  cloneProject: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        newName: z.string().min(1).max(128),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get the original project
      const originalProject = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.id, input.projectId));

      if (!originalProject || originalProject.length === 0) {
        throw new Error("Project not found");
      }

      const project = originalProject[0];

      // Check if user owns the project or it's public
      if (project.userId !== ctx.user.id && !project.isPublic) {
        throw new Error("You don't have permission to clone this project");
      }

      // Create a new project with the same content but new name
      const result = await db.insert(generatedProjects).values({
        userId: ctx.user.id,
        prompt: project.prompt,
        appName: input.newName,
        appDescription: project.appDescription,
        appCategory: project.appCategory,
        techStack: project.techStack,
        files: project.files,
        sqlSchema: project.sqlSchema,
        envExample: project.envExample,
        readmeContent: project.readmeContent,
        packageJson: project.packageJson,
        aiModel: project.aiModel,
        isPublic: false, // New clones are private by default
      });

      return {
        success: true,
        newProjectId: (result as any).insertId || input.projectId,
        message: `Project cloned successfully as "${input.newName}"`,
      };
    }),

  /**
   * Get all clones of a project
   */
  getProjectClones: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get the original project to check permissions
      const originalProject = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.id, input.projectId));

      if (!originalProject || originalProject.length === 0) {
        throw new Error("Project not found");
      }

      const project = originalProject[0];

      // Only owner can see clones
      if (project.userId !== ctx.user.id) {
        throw new Error("You don't have permission to view clones");
      }

      // For simplicity, we'll return projects with similar names
      // In production, you'd want to add a `clonedFromId` field to track lineage
      const clones = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.userId, ctx.user.id));

      return clones.filter((p) => p.appName.includes(project.appName));
    }),
});
