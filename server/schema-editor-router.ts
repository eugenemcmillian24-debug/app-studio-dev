import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { schemaEdits, generatedProjects } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const schemaEditorRouter = router({
  // Get schema edit history for a project
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

      const edits = await db
        .select()
        .from(schemaEdits)
        .where(eq(schemaEdits.projectId, input.projectId));

      return edits;
    }),

  // Save schema modification
  saveEdit: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      originalSchema: z.string(),
      modifiedSchema: z.string(),
      changeDescription: z.string().optional(),
    }))
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

      const result = await db.insert(schemaEdits).values({
        projectId: input.projectId,
        userId: ctx.user.id,
        originalSchema: input.originalSchema,
        modifiedSchema: input.modifiedSchema,
        changeDescription: input.changeDescription,
      });

      return { success: true };
    }),

  // Apply schema edit
  applyEdit: protectedProcedure
    .input(z.object({ editId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [edit] = await db
        .select()
        .from(schemaEdits)
        .where(eq(schemaEdits.id, input.editId))
        .limit(1);

      if (!edit || edit.userId !== ctx.user.id) {
        throw new Error("Edit not found or unauthorized");
      }

      // Mark as applied
      await db
        .update(schemaEdits)
        .set({ appliedAt: new Date() })
        .where(eq(schemaEdits.id, input.editId));

      return { success: true };
    }),

  // Revert schema edit
  revertEdit: protectedProcedure
    .input(z.object({ editId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [edit] = await db
        .select()
        .from(schemaEdits)
        .where(eq(schemaEdits.id, input.editId))
        .limit(1);

      if (!edit || edit.userId !== ctx.user.id) {
        throw new Error("Edit not found or unauthorized");
      }

      // Clear applied timestamp
      await db
        .update(schemaEdits)
        .set({ appliedAt: null })
        .where(eq(schemaEdits.id, input.editId));

      return { success: true };
    }),

  // Delete schema edit
  deleteEdit: protectedProcedure
    .input(z.object({ editId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [edit] = await db
        .select()
        .from(schemaEdits)
        .where(eq(schemaEdits.id, input.editId))
        .limit(1);

      if (!edit || edit.userId !== ctx.user.id) {
        throw new Error("Edit not found or unauthorized");
      }

      await db.delete(schemaEdits).where(eq(schemaEdits.id, input.editId));

      return { success: true };
    }),

  // Validate SQL schema
  validateSchema: protectedProcedure
    .input(z.object({ schema: z.string() }))
    .mutation(async ({ input }) => {
      // Basic SQL validation
      const sqlKeywords = ["CREATE TABLE", "ALTER TABLE", "DROP TABLE", "INSERT", "UPDATE", "DELETE"];
      const hasValidKeywords = sqlKeywords.some(keyword => input.schema.toUpperCase().includes(keyword));

      if (!hasValidKeywords) {
        return { valid: false, error: "Schema must contain valid SQL statements" };
      }

      // Check for dangerous operations
      const dangerousOps = ["DROP DATABASE", "DELETE FROM", "TRUNCATE"];
      const hasDangerousOps = dangerousOps.some(op => input.schema.toUpperCase().includes(op));

      if (hasDangerousOps) {
        return { valid: false, error: "Schema contains potentially dangerous operations" };
      }

      return { valid: true };
    }),
});
