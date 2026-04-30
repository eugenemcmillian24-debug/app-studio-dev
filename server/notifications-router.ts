import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { emailNotifications } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

export const notificationsRouter = router({
  // Get user's notifications
  getMyNotifications: protectedProcedure
    .input(z.object({ limit: z.number().default(20), unreadOnly: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(emailNotifications.userId, ctx.user.id)];
      if (input.unreadOnly) {
        conditions.push(isNull(emailNotifications.readAt));
      }

      const notifications = await db
        .select()
        .from(emailNotifications)
        .where(and(...conditions))
        .limit(input.limit);

      return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [notification] = await db
        .select()
        .from(emailNotifications)
        .where(eq(emailNotifications.id, input.id))
        .limit(1);

      if (!notification || notification.userId !== ctx.user.id) {
        throw new Error("Notification not found");
      }

      await db
        .update(emailNotifications)
        .set({ readAt: new Date() })
        .where(eq(emailNotifications.id, input.id));

      return { success: true };
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(emailNotifications)
      .set({ readAt: new Date() })
      .where(eq(emailNotifications.userId, ctx.user.id));

    return { success: true };
  }),

  // Delete notification
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [notification] = await db
        .select()
        .from(emailNotifications)
        .where(eq(emailNotifications.id, input.id))
        .limit(1);

      if (!notification || notification.userId !== ctx.user.id) {
        throw new Error("Notification not found");
      }

      await db.delete(emailNotifications).where(eq(emailNotifications.id, input.id));
      return { success: true };
    }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const results = await db
      .select({ count: emailNotifications.id })
      .from(emailNotifications)
      .where(eq(emailNotifications.userId, ctx.user.id));

    return { unreadCount: results.length };
  }),
});

// Helper function to send notifications (called from other routers)
export async function sendNotification(
  userId: number,
  type: "quota_warning" | "generation_complete" | "payment_receipt" | "system_alert",
  subject: string,
  body: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(emailNotifications).values({
    userId,
    type,
    subject,
    body,
  });
}
