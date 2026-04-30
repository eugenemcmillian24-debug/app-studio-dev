import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { projectShares, generatedProjects } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const collaborationRouter = router({
  // Share project with user
  shareProject: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      sharedWithEmail: z.string().email(),
      permission: z.enum(["view", "edit", "admin"]).default("view"),
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

      // Check if already shared
      const [existing] = await db
        .select()
        .from(projectShares)
        .where(
          and(
            eq(projectShares.projectId, input.projectId),
            eq(projectShares.sharedWithEmail, input.sharedWithEmail)
          )
        )
        .limit(1);

      if (existing) {
        // Update permission
        await db
          .update(projectShares)
          .set({ permission: input.permission })
          .where(eq(projectShares.id, existing.id));
      } else {
        // Create new share
        await db.insert(projectShares).values({
          projectId: input.projectId,
          ownerId: ctx.user.id,
          sharedWithEmail: input.sharedWithEmail,
          permission: input.permission,
        });
      }

      return { success: true };
    }),

  // Get shared projects
  getSharedWithMe: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const shares = await db
      .select()
      .from(projectShares)
      .where(eq(projectShares.sharedWithEmail, ctx.user.email || ""));

    return shares;
  }),

  // Get project shares (who it's shared with)
  getProjectShares: protectedProcedure
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

      const shares = await db
        .select()
        .from(projectShares)
        .where(eq(projectShares.projectId, input.projectId));

      return shares;
    }),

  // Update share permission
  updateSharePermission: protectedProcedure
    .input(z.object({
      shareId: z.number(),
      permission: z.enum(["view", "edit", "admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [share] = await db
        .select()
        .from(projectShares)
        .where(eq(projectShares.id, input.shareId))
        .limit(1);

      if (!share) throw new Error("Share not found");

      // Verify ownership
      if (share.ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db
        .update(projectShares)
        .set({ permission: input.permission })
        .where(eq(projectShares.id, input.shareId));

      return { success: true };
    }),

  // Revoke share
  revokeShare: protectedProcedure
    .input(z.object({ shareId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [share] = await db
        .select()
        .from(projectShares)
        .where(eq(projectShares.id, input.shareId))
        .limit(1);

      if (!share) throw new Error("Share not found");

      // Verify ownership
      if (share.ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db.delete(projectShares).where(eq(projectShares.id, input.shareId));

      return { success: true };
    }),

  // Check access level
  checkAccess: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if owner
      const [ownedProject] = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.id, input.projectId))
        .limit(1);

      if (ownedProject && ownedProject.userId === ctx.user.id) {
        return { access: "owner" };
      }

      // Check if shared
      const [share] = await db
        .select()
        .from(projectShares)
        .where(
          and(
            eq(projectShares.projectId, input.projectId),
            eq(projectShares.sharedWithEmail, ctx.user.email || "")
          )
        )
        .limit(1);

      if (share) {
        return { access: share.permission };
      }

      return { access: "none" };
    }),
});
