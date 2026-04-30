import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { userSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const themeRouter = router({
  // Get user's theme preference
  getTheme: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.user.id))
      .limit(1);

    return { theme: settings?.theme || "dark" };
  }),

  // Set theme preference
  setTheme: protectedProcedure
    .input(z.object({ theme: z.enum(["light", "dark"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [existing] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db
          .update(userSettings)
          .set({ theme: input.theme })
          .where(eq(userSettings.userId, ctx.user.id));
      } else {
        await db.insert(userSettings).values({
          userId: ctx.user.id,
          theme: input.theme,
        });
      }

      return { success: true, theme: input.theme };
    }),

  // Toggle theme
  toggleTheme: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.user.id))
      .limit(1);

    const currentTheme = settings?.theme || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    if (settings) {
      await db
        .update(userSettings)
        .set({ theme: newTheme })
        .where(eq(userSettings.userId, ctx.user.id));
    } else {
      await db.insert(userSettings).values({
        userId: ctx.user.id,
        theme: newTheme,
      });
    }

    return { success: true, theme: newTheme };
  }),
});
