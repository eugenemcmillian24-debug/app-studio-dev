import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import {
  llmModelPreferences,
  batchJobs,
  projectTemplates,
  generationAnalytics,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const advancedGenerationRouter = router({
  // Set LLM model preference
  setLLMPreference: protectedProcedure
    .input(
      z.object({
        preferredModel: z.string(),
        costPerMillion: z.number().optional(),
        speedRating: z.number().min(1).max(5).optional(),
        qualityRating: z.number().min(1).max(5).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(llmModelPreferences).values({
        userId: ctx.user?.id || 0,
        preferredModel: input.preferredModel,
        costPerMillion: input.costPerMillion ? String(input.costPerMillion) : undefined,
        speedRating: input.speedRating,
        qualityRating: input.qualityRating,
        lastUsed: new Date(),
      });

      return { success: true };
    }),

  // Get LLM model preferences
  getLLMPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const preferences = await db
      .select()
      .from(llmModelPreferences)
      .where(eq(llmModelPreferences.userId, ctx.user?.id || 0));

    return preferences;
  }),

  // Create batch generation job
  createBatchJob: protectedProcedure
    .input(
      z.object({
        inputFile: z.string(), // S3 path to CSV/JSON
        totalItems: z.number().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const jobId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      await db.insert(batchJobs).values({
        userId: ctx.user?.id || 0,
        jobId,
        status: "pending",
        totalItems: input.totalItems,
        inputFile: input.inputFile,
      });

      return { success: true, jobId };
    }),

  // Get batch job status
  getBatchJobStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [job] = await db
        .select()
        .from(batchJobs)
        .where(eq(batchJobs.jobId, input.jobId))
        .limit(1);

      if (!job || job.userId !== ctx.user?.id) {
        throw new Error("Job not found");
      }

      return job;
    }),

  // Get project templates
  getProjectTemplates: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(projectTemplates);

      // Note: Drizzle limitation - filtering on client side
      const templates = await query;

      return input.category
        ? templates.filter((t) => t.category === input.category).slice(0, input.limit)
        : templates.slice(0, input.limit);
    }),

  // Generate from template
  generateFromTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        customizations: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db
        .select()
        .from(projectTemplates)
        .where(eq(projectTemplates.id, input.templateId))
        .limit(1);

      if (!template) {
        throw new Error("Template not found");
      }

      // Log generation analytics
      await db.insert(generationAnalytics).values({
        userId: ctx.user?.id || 0,
        llmProvider: "template",
        tokensUsed: 0,
        success: true,
      });

      return {
        success: true,
        message: "Generated from template",
        template: template.name,
      };
    }),

  // Compare LLM models
  compareLLMModels: protectedProcedure
    .input(
      z.object({
        models: z.array(z.string()),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const preferences = await db
        .select()
        .from(llmModelPreferences)
        .where(eq(llmModelPreferences.userId, ctx.user?.id || 0));

      // Filter to requested models
      const comparison = preferences.filter((p) => input.models.includes(p.preferredModel));

      return {
        models: comparison,
        recommendation: comparison.sort((a, b) => {
          const scoreA = ((a.speedRating || 0) + (a.qualityRating || 0)) / 2;
          const scoreB = ((b.speedRating || 0) + (b.qualityRating || 0)) / 2;
          return scoreB - scoreA;
        })[0],
      };
    }),

  // Get generation cost estimate
  getGenerationCostEstimate: protectedProcedure
    .input(
      z.object({
        model: z.string(),
        estimatedTokens: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const prefs = await db
        .select()
        .from(llmModelPreferences);
      
      const preference = prefs.find((p) => p.preferredModel === input.model);

      const costPerMillion = preference?.costPerMillion ? Number(preference.costPerMillion) : 0.001;
      const estimatedCost = (input.estimatedTokens / 1000000) * costPerMillion;

      return {
        model: input.model,
        estimatedTokens: input.estimatedTokens,
        costPerMillion,
        estimatedCost,
      };
    }),
});
