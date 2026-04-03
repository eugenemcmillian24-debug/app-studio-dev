import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getLLMProviders, updateLLMProvider } from "./db";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
  // ── LLM Providers ────────────────────────────────────────────────────────────

  getLLMProviders: protectedProcedure.query(async ({ ctx }) => {
    // Check admin role
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
    return await getLLMProviders();
  }),

  toggleLLMProvider: protectedProcedure
    .input(z.object({
      provider: z.enum(["groq", "gemini", "openrouter"]),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check admin role
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      await updateLLMProvider(input.provider, { enabled: input.enabled });
      return { success: true };
    }),
});
