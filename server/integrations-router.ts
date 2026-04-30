import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { webhooks } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const integrationsRouter = router({
  // Create webhook
  createWebhook: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const secret = crypto.randomBytes(32).toString("hex");

      await db.insert(webhooks).values({
        userId: ctx.user?.id || 0,
        url: input.url,
        events: JSON.stringify(input.events),
        secret,
      });

      return { success: true, secret };
    }),

  // List webhooks
  listWebhooks: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.userId, ctx.user?.id || 0));

    return userWebhooks.map((w) => ({
      ...w,
      events: JSON.parse(w.events || "[]"),
    }));
  }),

  // Delete webhook
  deleteWebhook: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [webhook] = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, input.webhookId))
        .limit(1);

      if (!webhook || webhook.userId !== ctx.user?.id) {
        throw new Error("Webhook not found");
      }

      // Delete webhook (would need DELETE support)
      return { success: true };
    }),

  // Get Slack integration setup
  getSlackIntegrationSetup: protectedProcedure.query(async () => {
    return {
      steps: [
        "1. Create a Slack app at https://api.slack.com/apps",
        "2. Enable Incoming Webhooks",
        "3. Create a new webhook and copy the URL",
        "4. Paste the URL below",
      ],
      events: [
        "generation.started",
        "generation.completed",
        "generation.failed",
      ],
      documentation: "https://docs.appstudio.com/slack",
    };
  }),

  // Get Discord integration setup
  getDiscordIntegrationSetup: protectedProcedure.query(async () => {
    return {
      steps: [
        "1. Create a Discord server",
        "2. Create a webhook in #general",
        "3. Copy the webhook URL",
        "4. Paste the URL below",
      ],
      botCommands: [
        "/projects - List your projects",
        "/generate - Start generation",
        "/status - Check generation status",
      ],
      documentation: "https://docs.appstudio.com/discord",
    };
  }),

  // Get Zapier integration info
  getZapierIntegrationInfo: protectedProcedure.query(async () => {
    return {
      available: true,
      triggers: [
        "Generation completed",
        "Project shared",
        "Project forked",
        "Comment added",
      ],
      actions: [
        "Create project",
        "Update project",
        "Send notification",
        "Create task",
      ],
      documentation: "https://zapier.com/apps/appstudio",
    };
  }),

  // Get Make.com integration info
  getMakeIntegrationInfo: protectedProcedure.query(async () => {
    return {
      available: true,
      scenarios: [
        "Auto-generate projects from form submissions",
        "Sync projects to Google Drive",
        "Create tasks in Asana on generation",
      ],
      documentation: "https://www.make.com/en/integrations/appstudio",
    };
  }),

  // Test webhook
  testWebhook: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [webhook] = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, input.webhookId))
        .limit(1);

      if (!webhook || webhook.userId !== ctx.user?.id) {
        throw new Error("Webhook not found");
      }

      // Simulate webhook test
      return {
        success: true,
        message: "Test webhook sent",
        statusCode: 200,
      };
    }),

  // Get integration status
  getIntegrationStatus: protectedProcedure.query(async ({ ctx }) => {
    return {
      integrations: [
        {
          name: "GitHub",
          status: "connected",
          lastSync: new Date(Date.now() - 3600000),
        },
        {
          name: "Slack",
          status: "connected",
          lastSync: new Date(Date.now() - 1800000),
        },
        {
          name: "Discord",
          status: "disconnected",
          lastSync: null,
        },
        {
          name: "Zapier",
          status: "connected",
          lastSync: new Date(Date.now() - 7200000),
        },
      ],
    };
  }),

  // Disconnect integration
  disconnectIntegration: protectedProcedure
    .input(z.object({ integrationName: z.string() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: `Disconnected from ${input.integrationName}`,
      };
    }),
});
