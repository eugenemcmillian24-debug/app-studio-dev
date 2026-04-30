import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { generationHistory } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const historyRouter = router({
  // Get user's generation history
  getMyHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const history = await db
        .select()
        .from(generationHistory)
        .where(eq(generationHistory.userId, ctx.user.id))
        .orderBy(desc(generationHistory.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return history;
    }),

  // Get generation history for a specific project
  getProjectHistory: protectedProcedure
    .input(z.object({ projectId: z.number(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const history = await db
        .select()
        .from(generationHistory)
        .where(and(eq(generationHistory.userId, ctx.user.id), eq(generationHistory.projectId, input.projectId)))
        .orderBy(desc(generationHistory.createdAt))
        .limit(input.limit);

      return history;
    }),

  // Get generation statistics
  getStatistics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const history = await db
      .select()
      .from(generationHistory)
      .where(eq(generationHistory.userId, ctx.user.id));

    const totalGenerations = history.length;
    const successfulGenerations = history.filter(h => h.success).length;
    const failedGenerations = history.filter(h => !h.success).length;
    const avgDuration = history.reduce((sum, h) => sum + (h.durationMs || 0), 0) / totalGenerations;

    const providerStats: Record<string, { count: number; avgDuration: number }> = {};
    history.forEach(h => {
      if (h.llmProvider) {
        if (!providerStats[h.llmProvider]) {
          providerStats[h.llmProvider] = { count: 0, avgDuration: 0 };
        }
        providerStats[h.llmProvider].count++;
        providerStats[h.llmProvider].avgDuration += h.durationMs || 0;
      }
    });

    Object.keys(providerStats).forEach(provider => {
      providerStats[provider].avgDuration /= providerStats[provider].count;
    });

    return {
      totalGenerations,
      successfulGenerations,
      failedGenerations,
      successRate: (successfulGenerations / totalGenerations) * 100,
      avgDuration,
      providerStats,
    };
  }),

  // Get generation details
  getDetails: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [record] = await db
        .select()
        .from(generationHistory)
        .where(and(eq(generationHistory.id, input.id), eq(generationHistory.userId, ctx.user.id)))
        .limit(1);

      return record || null;
    }),

  // Delete generation record
  deleteRecord: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [record] = await db
        .select()
        .from(generationHistory)
        .where(and(eq(generationHistory.id, input.id), eq(generationHistory.userId, ctx.user.id)))
        .limit(1);

      if (!record) throw new Error("Record not found");

      await db.delete(generationHistory).where(eq(generationHistory.id, input.id));

      return { success: true };
    }),

  // Clear all history for user
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(generationHistory).where(eq(generationHistory.userId, ctx.user.id));

    return { success: true };
  }),
});

// Helper function to log generation (called from other routers)
export async function logGenerationRecord(
  userId: number,
  projectId: number | null,
  prompt: string,
  llmProvider: string | null,
  tokenCount: number | null,
  durationMs: number,
  success: boolean,
  errorMessage: string | null = null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(generationHistory).values({
    userId,
    projectId,
    prompt,
    llmProvider,
    tokenCount,
    durationMs,
    success,
    errorMessage,
  });
}
