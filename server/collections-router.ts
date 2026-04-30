import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { projectCollections, collectionProjects } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const collectionsRouter = router({
  // Get user's collections
  getMyCollections: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const collections = await db
      .select()
      .from(projectCollections)
      .where(eq(projectCollections.userId, ctx.user.id));

    return collections;
  }),

  // Get collection with projects
  getCollection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [collection] = await db
        .select()
        .from(projectCollections)
        .where(and(eq(projectCollections.id, input.id), eq(projectCollections.userId, ctx.user.id)))
        .limit(1);

      if (!collection) return null;

      const projects = await db
        .select()
        .from(collectionProjects)
        .where(eq(collectionProjects.collectionId, input.id));

      return { ...collection, projectCount: projects.length };
    }),

  // Create collection
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      description: z.string().optional(),
      color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(projectCollections).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        color: input.color || "#6366f1",
      });

      return { success: true };
    }),

  // Update collection
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [collection] = await db
        .select()
        .from(projectCollections)
        .where(and(eq(projectCollections.id, input.id), eq(projectCollections.userId, ctx.user.id)))
        .limit(1);

      if (!collection) throw new Error("Collection not found");

      await db
        .update(projectCollections)
        .set({
          name: input.name,
          description: input.description,
          color: input.color,
        })
        .where(eq(projectCollections.id, input.id));

      return { success: true };
    }),

  // Delete collection
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [collection] = await db
        .select()
        .from(projectCollections)
        .where(and(eq(projectCollections.id, input.id), eq(projectCollections.userId, ctx.user.id)))
        .limit(1);

      if (!collection) throw new Error("Collection not found");

      // Delete associated projects
      await db.delete(collectionProjects).where(eq(collectionProjects.collectionId, input.id));

      // Delete collection
      await db.delete(projectCollections).where(eq(projectCollections.id, input.id));

      return { success: true };
    }),

  // Add project to collection
  addProject: protectedProcedure
    .input(z.object({ collectionId: z.number(), projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [collection] = await db
        .select()
        .from(projectCollections)
        .where(and(eq(projectCollections.id, input.collectionId), eq(projectCollections.userId, ctx.user.id)))
        .limit(1);

      if (!collection) throw new Error("Collection not found");

      await db.insert(collectionProjects).values({
        collectionId: input.collectionId,
        projectId: input.projectId,
      });

      return { success: true };
    }),

  // Remove project from collection
  removeProject: protectedProcedure
    .input(z.object({ collectionId: z.number(), projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [collection] = await db
        .select()
        .from(projectCollections)
        .where(and(eq(projectCollections.id, input.collectionId), eq(projectCollections.userId, ctx.user.id)))
        .limit(1);

      if (!collection) throw new Error("Collection not found");

      await db
        .delete(collectionProjects)
        .where(
          and(
            eq(collectionProjects.collectionId, input.collectionId),
            eq(collectionProjects.projectId, input.projectId)
          )
        );

      return { success: true };
    }),
});
