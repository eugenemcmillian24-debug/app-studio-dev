import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { webhooks } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

interface WebhookDelivery {
  id: string;
  webhookId: number;
  event: string;
  payload: Record<string, unknown>;
  status: "pending" | "success" | "failed";
  retries: number;
  lastAttemptAt: Date | null;
  nextRetryAt: Date | null;
  response?: string;
  createdAt: Date;
}

// Store webhook deliveries in memory (in production, use database)
const deliveryQueue: Map<string, WebhookDelivery> = new Map();

/**
 * Send webhook with retry logic
 */
async function sendWebhookWithRetry(
  webhookId: number,
  url: string,
  secret: string,
  event: string,
  payload: Record<string, unknown>,
  maxRetries: number = 5
): Promise<boolean> {
  const deliveryId = crypto.randomUUID();
  const delivery: WebhookDelivery = {
    id: deliveryId,
    webhookId,
    event,
    payload,
    status: "pending",
    retries: 0,
    lastAttemptAt: null,
    nextRetryAt: new Date(),
    createdAt: new Date(),
  };

  deliveryQueue.set(deliveryId, delivery);

  // Attempt delivery with exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const signature = generateSignature(JSON.stringify(payload), secret);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
          "X-Webhook-Delivery": deliveryId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      delivery.lastAttemptAt = new Date();

      if (response.ok) {
        delivery.status = "success";
        delivery.response = `HTTP ${response.status}`;
        deliveryQueue.set(deliveryId, delivery);
        console.log(`[Webhook] Delivery ${deliveryId} succeeded on attempt ${attempt + 1}`);
        return true;
      }

      delivery.response = `HTTP ${response.status}: ${response.statusText}`;

      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s, 16s, 32s
        const backoffMs = Math.pow(2, attempt + 1) * 1000;
        delivery.nextRetryAt = new Date(Date.now() + backoffMs);
        delivery.retries = attempt + 1;
        deliveryQueue.set(deliveryId, delivery);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    } catch (error) {
      delivery.lastAttemptAt = new Date();
      delivery.response = error instanceof Error ? error.message : "Unknown error";

      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt + 1) * 1000;
        delivery.nextRetryAt = new Date(Date.now() + backoffMs);
        delivery.retries = attempt + 1;
        deliveryQueue.set(deliveryId, delivery);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  delivery.status = "failed";
  delivery.retries = maxRetries;
  deliveryQueue.set(deliveryId, delivery);
  console.error(`[Webhook] Delivery ${deliveryId} failed after ${maxRetries} retries`);
  return false;
}

/**
 * Generate HMAC signature for webhook
 */
function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export const webhookDeliveryRouter = router({
  /**
   * Trigger webhook delivery for an event
   */
  triggerWebhook: protectedProcedure
    .input(
      z.object({
        event: z.string(),
        payload: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all webhooks for this user
      const userWebhooks = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.userId, ctx.user?.id || 0));

      const results = [];

      for (const webhook of userWebhooks) {
        const events = JSON.parse(webhook.events || "[]");

        // Check if webhook is subscribed to this event
        if (events.includes(input.event)) {
          const success = await sendWebhookWithRetry(
            webhook.id,
            webhook.url,
            webhook.secret,
            input.event,
            input.payload
          );
          results.push({ webhookId: webhook.id, success });
        }
      }

      return { triggered: results.length, results };
    }),

  /**
   * Get webhook delivery status
   */
  getDeliveryStatus: protectedProcedure
    .input(z.object({ deliveryId: z.string() }))
    .query(async ({ input }) => {
      const delivery = deliveryQueue.get(input.deliveryId);
      if (!delivery) {
        throw new Error("Delivery not found");
      }
      return delivery;
    }),

  /**
   * Get webhook delivery history
   */
  getDeliveryHistory: protectedProcedure
    .input(z.object({ webhookId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      // Return recent deliveries from queue
      const allDeliveries: WebhookDelivery[] = [];
      deliveryQueue.forEach((delivery) => {
        allDeliveries.push(delivery);
      });
      const deliveries = allDeliveries
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, input.limit);

      return deliveries;
    }),

  /**
   * Retry failed delivery
   */
  retryDelivery: protectedProcedure
    .input(z.object({ deliveryId: z.string() }))
    .mutation(async ({ input }) => {
      const delivery = deliveryQueue.get(input.deliveryId);
      if (!delivery) {
        throw new Error("Delivery not found");
      }

      if (delivery.status === "success") {
        throw new Error("Cannot retry successful delivery");
      }

      // Get webhook details
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const [webhook] = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, delivery.webhookId))
        .limit(1);

      if (!webhook) {
        throw new Error("Webhook not found");
      }

      // Retry with fresh attempt count
      delivery.retries = 0;
      delivery.status = "pending";
      delivery.nextRetryAt = new Date();
      deliveryQueue.set(input.deliveryId, delivery);

      const success = await sendWebhookWithRetry(
        webhook.id,
        webhook.url,
        webhook.secret,
        delivery.event,
        delivery.payload
      );

      return { success };
    }),

  /**
   * Get delivery statistics
   */
  getDeliveryStats: protectedProcedure.query(async () => {
    const deliveries = Array.from(deliveryQueue.values());

    return {
      total: deliveries.length,
      successful: deliveries.filter((d) => d.status === "success").length,
      failed: deliveries.filter((d) => d.status === "failed").length,
      pending: deliveries.filter((d) => d.status === "pending").length,
      avgRetries:
        deliveries.length > 0
          ? deliveries.reduce((sum, d) => sum + d.retries, 0) / deliveries.length
          : 0,
    };
  }),

  /**
   * Clear old deliveries
   */
  clearOldDeliveries: protectedProcedure
    .input(z.object({ olderThanDays: z.number().default(7) }))
    .mutation(async ({ input }) => {
      const cutoffDate = new Date(Date.now() - input.olderThanDays * 24 * 60 * 60 * 1000);
      let cleared = 0;
      const keysToDelete: string[] = [];

      deliveryQueue.forEach((delivery, id) => {
        if (delivery.createdAt < cutoffDate) {
          keysToDelete.push(id);
          cleared++;
        }
      });

      keysToDelete.forEach((id) => deliveryQueue.delete(id));

      return { cleared, remaining: deliveryQueue.size };
    }),
});
