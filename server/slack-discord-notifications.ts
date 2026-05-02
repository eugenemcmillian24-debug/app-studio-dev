/**
 * Slack/Discord Notifications Router
 * Send deployment status, test results, and performance alerts to Slack/Discord
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface SlackConfig {
  webhookUrl: string;
  channel: string;
  enabled: boolean;
}

interface DiscordConfig {
  webhookUrl: string;
  enabled: boolean;
}

interface NotificationEvent {
  id: string;
  type: "deployment" | "test" | "performance" | "error";
  status: "success" | "failure" | "warning";
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  sentTo: string[];
}

// In-memory storage (in production, use database)
const notificationConfigs = new Map<string, { slack?: SlackConfig; discord?: DiscordConfig }>();
const notificationHistory = new Map<string, NotificationEvent[]>();

export const slackDiscordNotificationsRouter = router({
  /**
   * Get notification configuration
   */
  getNotificationConfig: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const config = notificationConfigs.get(input.projectId);

        return {
          slack: config?.slack || { webhookUrl: "", channel: "", enabled: false },
          discord: config?.discord || { webhookUrl: "", enabled: false },
        };
      } catch (error) {
        throw new Error(
          `Failed to get notification config: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Update Slack configuration
   */
  updateSlackConfig: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        webhookUrl: z.string().url(),
        channel: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let config = notificationConfigs.get(input.projectId);

        if (!config) {
          config = {};
        }

        config.slack = {
          webhookUrl: input.webhookUrl,
          channel: input.channel,
          enabled: input.enabled,
        };

        notificationConfigs.set(input.projectId, config);

        return {
          success: true,
          message: "Slack configuration updated",
        };
      } catch (error) {
        throw new Error(
          `Failed to update Slack config: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Update Discord configuration
   */
  updateDiscordConfig: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        webhookUrl: z.string().url(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let config = notificationConfigs.get(input.projectId);

        if (!config) {
          config = {};
        }

        config.discord = {
          webhookUrl: input.webhookUrl,
          enabled: input.enabled,
        };

        notificationConfigs.set(input.projectId, config);

        return {
          success: true,
          message: "Discord configuration updated",
        };
      } catch (error) {
        throw new Error(
          `Failed to update Discord config: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Send deployment notification
   */
  sendDeploymentNotification: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        status: z.enum(["success", "failure"]),
        deploymentId: z.string(),
        version: z.string(),
        environment: z.string(),
        duration: z.number(),
        author: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const config = notificationConfigs.get(input.projectId);
        const sentTo: string[] = [];

        const title = `Deployment ${input.status === "success" ? "✅ Successful" : "❌ Failed"}`;
        const message = `Version ${input.version} deployed to ${input.environment} in ${(input.duration / 1000).toFixed(2)}s by ${input.author}`;

        // Send to Slack
        if (config?.slack?.enabled) {
          try {
            await fetch(config.slack.webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                channel: config.slack.channel,
                text: title,
                attachments: [
                  {
                    color: input.status === "success" ? "good" : "danger",
                    fields: [
                      { title: "Version", value: input.version, short: true },
                      { title: "Environment", value: input.environment, short: true },
                      { title: "Duration", value: `${(input.duration / 1000).toFixed(2)}s`, short: true },
                      { title: "Author", value: input.author, short: true },
                      { title: "Deployment ID", value: input.deploymentId, short: false },
                    ],
                    ts: Math.floor(Date.now() / 1000),
                  },
                ],
              }),
            });
            sentTo.push("slack");
          } catch (error) {
            console.error("Failed to send Slack notification:", error);
          }
        }

        // Send to Discord
        if (config?.discord?.enabled) {
          try {
            await fetch(config.discord.webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: title,
                embeds: [
                  {
                    color: input.status === "success" ? 65280 : 16711680,
                    fields: [
                      { name: "Version", value: input.version, inline: true },
                      { name: "Environment", value: input.environment, inline: true },
                      { name: "Duration", value: `${(input.duration / 1000).toFixed(2)}s`, inline: true },
                      { name: "Author", value: input.author, inline: true },
                      { name: "Deployment ID", value: input.deploymentId, inline: false },
                    ],
                    timestamp: new Date().toISOString(),
                  },
                ],
              }),
            });
            sentTo.push("discord");
          } catch (error) {
            console.error("Failed to send Discord notification:", error);
          }
        }

        // Store in history
        const event: NotificationEvent = {
          id: `notif_${Date.now()}`,
          type: "deployment",
          status: input.status as "success" | "failure",
          title,
          message,
          metadata: {
            deploymentId: input.deploymentId,
            version: input.version,
            environment: input.environment,
          },
          timestamp: new Date().toISOString(),
          sentTo,
        };

        let history = notificationHistory.get(input.projectId) || [];
        history.push(event);
        notificationHistory.set(input.projectId, history.slice(-100)); // Keep last 100

        return {
          success: true,
          sentTo,
        };
      } catch (error) {
        throw new Error(
          `Failed to send deployment notification: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Send test result notification
   */
  sendTestNotification: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        status: z.enum(["success", "failure"]),
        testRunId: z.string(),
        totalTests: z.number(),
        passedTests: z.number(),
        failedTests: z.number(),
        coverage: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const config = notificationConfigs.get(input.projectId);
        const sentTo: string[] = [];

        const title = `Test Results: ${input.status === "success" ? "✅ All Passed" : "❌ Some Failed"}`;
        const passRate = ((input.passedTests / input.totalTests) * 100).toFixed(2);

        // Send to Slack
        if (config?.slack?.enabled) {
          try {
            await fetch(config.slack.webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                channel: config.slack.channel,
                text: title,
                attachments: [
                  {
                    color: input.status === "success" ? "good" : "danger",
                    fields: [
                      { title: "Total Tests", value: input.totalTests.toString(), short: true },
                      { title: "Passed", value: input.passedTests.toString(), short: true },
                      { title: "Failed", value: input.failedTests.toString(), short: true },
                      { title: "Pass Rate", value: `${passRate}%`, short: true },
                      ...(input.coverage ? [{ title: "Coverage", value: `${input.coverage}%`, short: true }] : []),
                    ],
                  },
                ],
              }),
            });
            sentTo.push("slack");
          } catch (error) {
            console.error("Failed to send Slack test notification:", error);
          }
        }

        // Send to Discord
        if (config?.discord?.enabled) {
          try {
            await fetch(config.discord.webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: title,
                embeds: [
                  {
                    color: input.status === "success" ? 65280 : 16711680,
                    fields: [
                      { name: "Total Tests", value: input.totalTests.toString(), inline: true },
                      { name: "Passed", value: input.passedTests.toString(), inline: true },
                      { name: "Failed", value: input.failedTests.toString(), inline: true },
                      { name: "Pass Rate", value: `${passRate}%`, inline: true },
                      ...(input.coverage ? [{ name: "Coverage", value: `${input.coverage}%`, inline: true }] : []),
                    ],
                    timestamp: new Date().toISOString(),
                  },
                ],
              }),
            });
            sentTo.push("discord");
          } catch (error) {
            console.error("Failed to send Discord test notification:", error);
          }
        }

        // Store in history
        const event: NotificationEvent = {
          id: `notif_${Date.now()}`,
          type: "test",
          status: input.status as "success" | "failure",
          title,
          message: `${input.passedTests}/${input.totalTests} tests passed (${passRate}%)`,
          metadata: {
            testRunId: input.testRunId,
            totalTests: input.totalTests,
            passedTests: input.passedTests,
            coverage: input.coverage,
          },
          timestamp: new Date().toISOString(),
          sentTo,
        };

        let history = notificationHistory.get(input.projectId) || [];
        history.push(event);
        notificationHistory.set(input.projectId, history.slice(-100));

        return {
          success: true,
          sentTo,
        };
      } catch (error) {
        throw new Error(
          `Failed to send test notification: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get notification history
   */
  getNotificationHistory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const history = notificationHistory.get(input.projectId) || [];

        return {
          events: history.slice(-input.limit),
          total: history.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get notification history: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
