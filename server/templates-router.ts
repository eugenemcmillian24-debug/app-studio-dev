import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { projectTemplates } from "../drizzle/schema";
import { eq, and, SQL } from "drizzle-orm";

export const templatesRouter = router({
  // Get all public templates
  listPublic: publicProcedure
    .input(z.object({ category: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(projectTemplates.isPublic, true)];
      if (input.category) {
        conditions.push(eq(projectTemplates.category, input.category));
      }
      const templates = await db.select().from(projectTemplates).where(and(...conditions)).limit(input.limit);
      return templates.map(t => ({
        ...t,
        techStack: JSON.parse(t.techStack),
      }));
    }),

  // Get template by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db.select().from(projectTemplates).where(eq(projectTemplates.id, input.id)).limit(1);
      if (!template) return null;
      return {
        ...template,
        techStack: JSON.parse(template.techStack),
      };
    }),

  // Create template (admin only)
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(3).max(128),
      description: z.string().min(10),
      category: z.enum(["ecommerce", "saas", "blog", "dashboard", "other"]),
      prompt: z.string().min(20),
      techStack: z.array(z.string()).min(1),
      icon: z.string().optional(),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can create templates");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(projectTemplates).values({
        name: input.name,
        description: input.description,
        category: input.category,
        prompt: input.prompt,
        techStack: JSON.stringify(input.techStack),
        icon: input.icon,
        isPublic: input.isPublic,
        createdBy: ctx.user.id,
      });

      return { success: true };
    }),

  // Update template (admin only)
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can update templates");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(projectTemplates)
        .set({
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
        })
        .where(eq(projectTemplates.id, input.id));

      return { success: true };
    }),

  // Delete template (admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can delete templates");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(projectTemplates).where(eq(projectTemplates.id, input.id));
      return { success: true };
    }),
});
