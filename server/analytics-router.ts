import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import {
  projectAnalytics,
  generationAnalytics,
  userActivity,
} from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const analyticsRouter = router({
  // Get project analytics
  getProjectAnalytics: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [analytics] = await db
        .select()
        .from(projectAnalytics)
        .where(eq(projectAnalytics.projectId, input.projectId))
        .limit(1);

      return analytics || { views: 0, downloads: 0, forks: 0, stars: 0 };
    }),

  // Track project view
  trackProjectView: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update analytics
      const [existing] = await db
        .select()
        .from(projectAnalytics)
        .where(eq(projectAnalytics.projectId, input.projectId))
        .limit(1);

      if (existing) {
        await db
          .update(projectAnalytics)
          .set({ views: existing.views + 1, lastViewedAt: new Date() })
          .where(eq(projectAnalytics.projectId, input.projectId));
      } else {
        await db.insert(projectAnalytics).values({
          projectId: input.projectId,
          views: 1,
          downloads: 0,
          forks: 0,
          stars: 0,
        });
      }

      // Log activity
      await db.insert(userActivity).values({
        userId: ctx.user?.id || 0,
        action: "view",
        projectId: input.projectId,
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return { success: true };
    }),

  // Get generation analytics
  getGenerationAnalytics: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(generationAnalytics.userId, ctx.user?.id || 0)];
      if (input.startDate) {
        conditions.push(gte(generationAnalytics.createdAt, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(generationAnalytics.createdAt, input.endDate));
      }

      const results = await db
        .select()
        .from(generationAnalytics)
        .where(and(...conditions))
        .limit(input.limit);

      // Calculate stats
      const totalTokens = results.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      return {
        generations: results,
        stats: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
          totalTokens,
          averageTokensPerGeneration: totalTokens / results.length || 0,
        },
      };
    }),

  // Get user activity
  getUserActivity: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const activities = await db
        .select()
        .from(userActivity)
        .where(eq(userActivity.userId, ctx.user?.id || 0))
        .limit(input.limit);

      return activities;
    }),

  // Get dashboard metrics
  getDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userId = ctx.user?.id || 0;

    // Get recent activity count
    const recentActivity = await db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId));

    // Get generation stats
    const generationStats = await db
      .select()
      .from(generationAnalytics)
      .where(eq(generationAnalytics.userId, userId));

    const successCount = generationStats.filter((g) => g.success).length;
    const totalTokens = generationStats.reduce((sum, g) => sum + (g.tokensUsed || 0), 0);

    return {
      totalGenerations: generationStats.length,
      successfulGenerations: successCount,
      failedGenerations: generationStats.length - successCount,
      totalTokensUsed: totalTokens,
      recentActivityCount: recentActivity.length,
      lastGeneratedAt: generationStats[0]?.createdAt || null,
    };
  }),
});
