import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getUserProjects, addUserProject, toggleProjectFavorite, getUserSettings, upsertUserSettings, getUserEnvVariables, saveUserEnvVariable, deleteUserEnvVariable } from "./db";
import { encryptValue, decryptValue } from "./encryption";

export const userRouter = router({
  // ── My Projects ─────────────────────────────────────────────────────────────
  
  getMyProjects: protectedProcedure.query(async ({ ctx }) => {
    const projects = await getUserProjects(ctx.user.id);
    return projects;
  }),

  toggleFavorite: protectedProcedure
    .input(z.object({ projectId: z.number(), isFavorite: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await toggleProjectFavorite(ctx.user.id, input.projectId, input.isFavorite);
      return { success: true };
    }),

  // ── Settings ─────────────────────────────────────────────────────────────────

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    return await getUserSettings(ctx.user.id);
  }),

  updateSettings: protectedProcedure
    .input(z.object({
      theme: z.enum(["light", "dark"]).optional(),
      emailNotifications: z.boolean().optional(),
      githubUsername: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await upsertUserSettings(ctx.user.id, input);
      return { success: true };
    }),

  // ── Environment Variables ────────────────────────────────────────────────────

  getEnvVariables: protectedProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const vars = await getUserEnvVariables(ctx.user.id, input.category);
      // Return keys only (not decrypted values for security)
      return vars.map(v => ({ id: v.id, key: v.key, category: v.category, createdAt: v.createdAt }));
    }),

  saveEnvVariable: protectedProcedure
    .input(z.object({
      key: z.string().min(1),
      value: z.string().min(1),
      category: z.enum(["supabase", "vercel", "github"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const encrypted = encryptValue(input.value);
      await saveUserEnvVariable({
        userId: ctx.user.id,
        key: input.key,
        encryptedValue: encrypted,
        category: input.category,
      });
      return { success: true };
    }),

  getEnvVariable: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const vars = await getUserEnvVariables(ctx.user.id);
      const found = vars.find(v => v.key === input.key);
      if (!found) return null;
      try {
        const decrypted = decryptValue(found.encryptedValue);
        return { key: found.key, value: decrypted, category: found.category };
      } catch {
        return null;
      }
    }),

  deleteEnvVariable: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await deleteUserEnvVariable(ctx.user.id, input.key);
      return { success: true };
    }),
});
