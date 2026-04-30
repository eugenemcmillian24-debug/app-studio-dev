import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { exportFormats, generatedProjects } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const exportRouter = router({
  // Get export formats for a project
  getFormats: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify project ownership
      const [project] = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.id, input.projectId))
        .limit(1);

      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or unauthorized");
      }

      const formats = await db
        .select()
        .from(exportFormats)
        .where(eq(exportFormats.projectId, input.projectId));

      return formats;
    }),

  // Export as individual project
  exportIndividual: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify project ownership
      const [project] = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.id, input.projectId))
        .limit(1);

      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or unauthorized");
      }

      // Record export
      const result = await db.insert(exportFormats).values({
        projectId: input.projectId,
        format: "individual",
        downloadUrl: `/api/export/individual/${input.projectId}`,
      });

      return {
        success: true,
        format: "individual",
        downloadUrl: `/api/export/individual/${input.projectId}`,
      };
    }),

  // Export as monorepo
  exportMonorepo: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify project ownership
      const [project] = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.id, input.projectId))
        .limit(1);

      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or unauthorized");
      }

      // Record export
      const result = await db.insert(exportFormats).values({
        projectId: input.projectId,
        format: "monorepo",
        downloadUrl: `/api/export/monorepo/${input.projectId}`,
      });

      return {
        success: true,
        format: "monorepo",
        downloadUrl: `/api/export/monorepo/${input.projectId}`,
        structure: {
          packages: {
            app: "Next.js frontend",
            api: "Express backend",
            db: "Database migrations",
            shared: "Shared types and utilities",
          },
        },
      };
    }),

  // Export as turborepo
  exportTurborepo: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify project ownership
      const [project] = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.id, input.projectId))
        .limit(1);

      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or unauthorized");
      }

      // Record export
      const result = await db.insert(exportFormats).values({
        projectId: input.projectId,
        format: "turborepo",
        downloadUrl: `/api/export/turborepo/${input.projectId}`,
      });

      return {
        success: true,
        format: "turborepo",
        downloadUrl: `/api/export/turborepo/${input.projectId}`,
        structure: {
          packages: {
            apps: {
              web: "Next.js frontend",
              api: "Express backend",
            },
            packages: {
              db: "Database migrations",
              shared: "Shared types and utilities",
              config: "Shared configuration",
            },
          },
          turbo: {
            tasks: {
              dev: "Development servers",
              build: "Production builds",
              test: "Test suites",
              lint: "Linting",
            },
          },
        },
      };
    }),

  // Get export history
  getHistory: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify project ownership
      const [project] = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.id, input.projectId))
        .limit(1);

      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or unauthorized");
      }

      const history = await db
        .select()
        .from(exportFormats)
        .where(eq(exportFormats.projectId, input.projectId));

      return history;
    }),
});
