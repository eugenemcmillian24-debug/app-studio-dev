import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { customDomains, generatedProjects } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export const domainsRouter = router({
  // List user's custom domains
  getMyDomains: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const domains = await db
      .select()
      .from(customDomains)
      .where(eq(customDomains.userId, ctx.user.id));

    return domains;
  }),

  // Get domain by ID
  getDomain: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [domain] = await db
        .select()
        .from(customDomains)
        .where(and(eq(customDomains.id, input.id), eq(customDomains.userId, ctx.user.id)))
        .limit(1);

      return domain || null;
    }),

  // Add custom domain
  addDomain: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      domain: z.string().regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i),
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

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      const result = await db.insert(customDomains).values({
        projectId: input.projectId,
        userId: ctx.user.id,
        domain: input.domain.toLowerCase(),
        verificationToken,
        isVerified: false,
      });

      return {
        success: true,
        verificationToken,
        instructions: `Add a TXT record to your domain: _appstudio.${input.domain} = ${verificationToken}`,
      };
    }),

  // Verify domain ownership
  verifyDomain: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [domain] = await db
        .select()
        .from(customDomains)
        .where(and(eq(customDomains.id, input.id), eq(customDomains.userId, ctx.user.id)))
        .limit(1);

      if (!domain) throw new Error("Domain not found");

      // In production, you would check DNS records here
      // For now, we'll mark as verified after token generation
      await db
        .update(customDomains)
        .set({
          isVerified: true,
          verifiedAt: new Date(),
        })
        .where(eq(customDomains.id, input.id));

      return { success: true };
    }),

  // Update deployment URL
  updateDeploymentUrl: protectedProcedure
    .input(z.object({ id: z.number(), deploymentUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [domain] = await db
        .select()
        .from(customDomains)
        .where(and(eq(customDomains.id, input.id), eq(customDomains.userId, ctx.user.id)))
        .limit(1);

      if (!domain) throw new Error("Domain not found");

      await db
        .update(customDomains)
        .set({ deploymentUrl: input.deploymentUrl })
        .where(eq(customDomains.id, input.id));

      return { success: true };
    }),

  // Delete domain
  deleteDomain: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [domain] = await db
        .select()
        .from(customDomains)
        .where(and(eq(customDomains.id, input.id), eq(customDomains.userId, ctx.user.id)))
        .limit(1);

      if (!domain) throw new Error("Domain not found");

      await db.delete(customDomains).where(eq(customDomains.id, input.id));

      return { success: true };
    }),
});
