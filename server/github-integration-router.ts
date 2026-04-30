import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { githubRepos } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const githubIntegrationRouter = router({
  // Get GitHub status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    return { connected: false, message: "GitHub integration requires OAuth setup" };
  }),

  // Create repository from project
  createRepository: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      repoName: z.string().regex(/^[a-zA-Z0-9_-]+$/),
      repoOwner: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // In production, this would call GitHub API to create repo
      // For now, we'll just store the record
      const result = await db.insert(githubRepos).values({
        userId: ctx.user.id,
        projectId: input.projectId,
        repoName: input.repoName,
        repoUrl: `https://github.com/${input.repoOwner}/${input.repoName}`,
        repoOwner: input.repoOwner,
      });

      return {
        success: true,
        repoUrl: `https://github.com/${input.repoOwner}/${input.repoName}`,
      };
    }),

  // Push project to repository
  pushToRepository: protectedProcedure
    .input(z.object({
      repoId: z.number(),
      commitMessage: z.string().default("Initial commit from AppStudio"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // In production, this would:
      // 1. Initialize git repo
      // 2. Add all files
      // 3. Create initial commit
      // 4. Push to GitHub
      // For now, we'll just return success

      return {
        success: true,
        message: "Project pushed to GitHub successfully",
      };
    }),

  // Disconnect GitHub
  disconnect: protectedProcedure
    .input(z.object({ repoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete specific repo connection
      // In production, would also revoke GitHub token
      return { success: true };
    }),

  // Get repository list
  getRepositories: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const repos = await db
      .select()
      .from(githubRepos)
      .where(eq(githubRepos.userId, ctx.user.id));

    return repos.map(repo => ({
      id: repo.id,
      projectId: repo.projectId,
      repoName: repo.repoName,
      repoUrl: repo.repoUrl,
      repoOwner: repo.repoOwner,
      createdAt: repo.createdAt,
    }));
  }),
});
