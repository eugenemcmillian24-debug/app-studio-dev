/**
 * Custom Webhooks Router
 * Allow users to define custom webhooks for deployment events and performance alerts
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface CustomWebhook {
  id: string;
  projectId: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  statusCode?: number;
  response?: string;
  error?: string;
  retries: number;
  timestamp: string;
}

// In-memory storage (in production, use database)
const webhooks = new Map<string, CustomWebhook[]>();
const deliveries = new Map<string, WebhookDelivery[]>();

export const customWebhooksRouter = router({
  /**
   * Create custom webhook
   */
  createWebhook: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        url: z.string().url(),
        events: z.array(z.string()).min(1),
        maxRetries: z.number().min(0).max(10).default(3),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const webhook: CustomWebhook = {
          id: `webhook_${Date.now()}`,
          projectId: input.projectId,
          url: input.url,
          events: input.events,
          active: true,
          secret: Buffer.from(`${input.projectId}-${Date.now()}`).toString("base64"),
          retryPolicy: {
            maxRetries: input.maxRetries,
            backoffMultiplier: 2,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const projectWebhooks = webhooks.get(input.projectId) || [];
        projectWebhooks.push(webhook);
        webhooks.set(input.projectId, projectWebhooks);

        return {
          success: true,
          webhook: {
            id: webhook.id,
            url: webhook.url,
            events: webhook.events,
            active: webhook.active,
            secret: webhook.secret,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to create webhook: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get webhooks for project
   */
  getWebhooks: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const projectWebhooks = webhooks.get(input.projectId) || [];

        return {
          webhooks: projectWebhooks.map((w) => ({
            id: w.id,
            url: w.url,
            events: w.events,
            active: w.active,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
          })),
          total: projectWebhooks.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get webhooks: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Update webhook
   */
  updateWebhook: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
        url: z.string().url().optional(),
        events: z.array(z.string()).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Find and update webhook
        for (const [projectId, projectWebhooks] of Array.from(webhooks.entries())) {
          const index = projectWebhooks.findIndex((w: CustomWebhook) => w.id === input.webhookId);
          if (index >= 0) {
            const webhook = projectWebhooks[index];
            if (input.url) webhook.url = input.url;
            if (input.events) webhook.events = input.events;
            if (input.active !== undefined) webhook.active = input.active;
            webhook.updatedAt = new Date().toISOString();

            projectWebhooks[index] = webhook;
            webhooks.set(projectId, projectWebhooks);

            return {
              success: true,
              webhook: {
                id: webhook.id,
                url: webhook.url,
                events: webhook.events,
                active: webhook.active,
              },
            };
          }
        }

        throw new Error("Webhook not found");
      } catch (error) {
        throw new Error(
          `Failed to update webhook: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Delete webhook
   */
  deleteWebhook: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Find and delete webhook
        for (const [projectId, projectWebhooks] of Array.from(webhooks.entries())) {
          const index = projectWebhooks.findIndex((w: CustomWebhook) => w.id === input.webhookId);
          if (index >= 0) {
            projectWebhooks.splice(index, 1);
            webhooks.set(projectId, projectWebhooks);

            // Clean up deliveries
            const deliveriesArray = Array.from(deliveries.keys());
            for (const key of deliveriesArray) {
              if (key === input.webhookId) {
                deliveries.delete(key);
              }
            }

            return {
              success: true,
            };
          }
        }

        throw new Error("Webhook not found");
      } catch (error) {
        throw new Error(
          `Failed to delete webhook: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Send webhook event
   */
  sendWebhookEvent: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        event: z.string(),
        payload: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const projectWebhooks = webhooks.get(input.projectId) || [];
        const deliveredTo: string[] = [];

        for (const webhook of projectWebhooks) {
          if (!webhook.active || !webhook.events.includes(input.event)) {
            continue;
          }

          // Send webhook with retry logic
          let lastError: string | undefined;
          for (let attempt = 0; attempt <= webhook.retryPolicy.maxRetries; attempt++) {
            try {
              const response = await fetch(webhook.url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Webhook-Secret": webhook.secret,
                  "X-Webhook-Event": input.event,
                  "X-Webhook-Timestamp": new Date().toISOString(),
                },
                body: JSON.stringify(input.payload),
              });

              const delivery: WebhookDelivery = {
                id: `delivery_${Date.now()}`,
                webhookId: webhook.id,
                event: input.event,
                payload: input.payload,
                statusCode: response.status,
                response: await response.text(),
                retries: attempt,
                timestamp: new Date().toISOString(),
              };

              const webhookDeliveries = deliveries.get(webhook.id) || [];
              webhookDeliveries.push(delivery);
              deliveries.set(webhook.id, webhookDeliveries.slice(-100)); // Keep last 100

              if (response.ok) {
                deliveredTo.push(webhook.id);
                break;
              } else if (attempt < webhook.retryPolicy.maxRetries) {
                const delay = Math.pow(webhook.retryPolicy.backoffMultiplier, attempt) * 1000;
                await new Promise((resolve) => setTimeout(resolve, delay));
              }
            } catch (error) {
              lastError = error instanceof Error ? error.message : "Unknown error";
              if (attempt < webhook.retryPolicy.maxRetries) {
                const delay = Math.pow(webhook.retryPolicy.backoffMultiplier, attempt) * 1000;
                await new Promise((resolve) => setTimeout(resolve, delay));
              }
            }
          }

          if (!deliveredTo.includes(webhook.id) && lastError) {
            const delivery: WebhookDelivery = {
              id: `delivery_${Date.now()}`,
              webhookId: webhook.id,
              event: input.event,
              payload: input.payload,
              error: lastError,
              retries: webhook.retryPolicy.maxRetries,
              timestamp: new Date().toISOString(),
            };

            const webhookDeliveries = deliveries.get(webhook.id) || [];
            webhookDeliveries.push(delivery);
            deliveries.set(webhook.id, webhookDeliveries.slice(-100));
          }
        }

        return {
          success: true,
          deliveredTo,
          total: projectWebhooks.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to send webhook event: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get webhook deliveries
   */
  getWebhookDeliveries: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const webhookDeliveries = deliveries.get(input.webhookId) || [];

        return {
          deliveries: webhookDeliveries.slice(-input.limit),
          total: webhookDeliveries.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get webhook deliveries: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get webhook delivery details
   */
  getWebhookDelivery: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
        deliveryId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const webhookDeliveries = deliveries.get(input.webhookId) || [];
        const delivery = webhookDeliveries.find((d) => d.id === input.deliveryId);

        if (!delivery) {
          throw new Error("Delivery not found");
        }

        return delivery;
      } catch (error) {
        throw new Error(
          `Failed to get webhook delivery: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Retry webhook delivery
   */
  retryWebhookDelivery: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
        deliveryId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const webhookDeliveries = deliveries.get(input.webhookId) || [];
        const delivery = webhookDeliveries.find((d) => d.id === input.deliveryId);

        if (!delivery) {
          throw new Error("Delivery not found");
        }

        // Find webhook
        let webhook: CustomWebhook | undefined;
        for (const projectWebhooks of Array.from(webhooks.values())) {
          webhook = projectWebhooks.find((w: CustomWebhook) => w.id === input.webhookId);
          if (webhook) break;
        }

        if (!webhook) {
          throw new Error("Webhook not found");
        }

        // Retry delivery
        try {
          const response = await fetch(webhook.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Secret": webhook.secret,
              "X-Webhook-Event": delivery.event,
              "X-Webhook-Timestamp": new Date().toISOString(),
            },
            body: JSON.stringify(delivery.payload),
          });

          const newDelivery: WebhookDelivery = {
            id: `delivery_${Date.now()}`,
            webhookId: webhook.id,
            event: delivery.event,
            payload: delivery.payload,
            statusCode: response.status,
            response: await response.text(),
            retries: (delivery.retries || 0) + 1,
            timestamp: new Date().toISOString(),
          };

          webhookDeliveries.push(newDelivery);
          deliveries.set(input.webhookId, webhookDeliveries.slice(-100));

          return {
            success: response.ok,
            statusCode: response.status,
          };
        } catch (error) {
          throw new Error(
            `Failed to retry delivery: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      } catch (error) {
        throw new Error(
          `Failed to retry webhook delivery: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
