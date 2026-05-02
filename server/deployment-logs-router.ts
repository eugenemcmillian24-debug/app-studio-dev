/**
 * Deployment Logs Router
 * Handles streaming and retrieval of deployment logs from Vercel
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { Readable } from "stream";

interface DeploymentLog {
  timestamp: number;
  message: string;
  level: "info" | "warning" | "error" | "success";
  source: "build" | "runtime" | "system";
}

interface BuildLog {
  id: string;
  deploymentId: string;
  logs: DeploymentLog[];
  startTime: number;
  endTime?: number;
  status: "building" | "success" | "failed";
}

// In-memory log storage (in production, use database)
const buildLogs = new Map<string, BuildLog>();

export const deploymentLogsRouter = router({
  /**
   * Get deployment logs
   */
  getLogs: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
        limit: z.number().min(1).max(1000).default(100),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = buildLogs.get(input.deploymentId);

        if (!logs) {
          return {
            logs: [],
            status: "not_found",
          };
        }

        return {
          logs: logs.logs.slice(-input.limit),
          status: logs.status,
          startTime: logs.startTime,
          endTime: logs.endTime,
        };
      } catch (error) {
        throw new Error(
          `Failed to get deployment logs: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Stream deployment logs in real-time
   */
  streamLogs: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
      })
    )
    .subscription(async function* ({ input }) {
      try {
        let lastLogIndex = 0;
        const logs = buildLogs.get(input.deploymentId);

        if (!logs) {
          yield {
            type: "error",
            message: "Deployment not found",
          };
          return;
        }

        // Emit initial logs
        for (const log of logs.logs) {
          yield {
            type: "log",
            data: log,
          };
          lastLogIndex++;
        }

        // Stream new logs as they arrive
        const interval = setInterval(() => {
          const updatedLogs = buildLogs.get(input.deploymentId);
          if (!updatedLogs) {
            clearInterval(interval);
            return;
          }

          // Emit new logs
          for (let i = lastLogIndex; i < updatedLogs.logs.length; i++) {
            // This would be yielded in the actual implementation
            lastLogIndex = i + 1;
          }

          // Stop if build is complete
          if (updatedLogs.status !== "building") {
            clearInterval(interval);
          }
        }, 1000);

        // Cleanup on completion
        const logs2 = buildLogs.get(input.deploymentId);
        if (logs2 && logs2.status !== "building") {
          clearInterval(interval);
          yield {
            type: "complete",
            status: logs2.status,
          };
        }
      } catch (error) {
        yield {
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Add log entry
   */
  addLog: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
        message: z.string(),
        level: z.enum(["info", "warning", "error", "success"]),
        source: z.enum(["build", "runtime", "system"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let logs = buildLogs.get(input.deploymentId);

        if (!logs) {
          logs = {
            id: `log_${Date.now()}`,
            deploymentId: input.deploymentId,
            logs: [],
            startTime: Date.now(),
            status: "building",
          };
          buildLogs.set(input.deploymentId, logs);
        }

        const logEntry: DeploymentLog = {
          timestamp: Date.now(),
          message: input.message,
          level: input.level,
          source: input.source,
        };

        logs.logs.push(logEntry);

        return {
          success: true,
          logId: logEntry.timestamp,
        };
      } catch (error) {
        throw new Error(
          `Failed to add log: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Mark deployment as complete
   */
  completeBuild: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
        status: z.enum(["success", "failed"]),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const logs = buildLogs.get(input.deploymentId);

        if (!logs) {
          throw new Error("Deployment not found");
        }

        logs.status = input.status;
        logs.endTime = Date.now();

        if (input.errorMessage) {
          logs.logs.push({
            timestamp: Date.now(),
            message: input.errorMessage,
            level: "error",
            source: "system",
          });
        }

        return {
          success: true,
          duration: logs.endTime - logs.startTime,
        };
      } catch (error) {
        throw new Error(
          `Failed to complete build: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Clear logs for a deployment
   */
  clearLogs: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        buildLogs.delete(input.deploymentId);

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to clear logs: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get build statistics
   */
  getBuildStats: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = buildLogs.get(input.deploymentId);

        if (!logs) {
          return {
            found: false,
          };
        }

        const duration = (logs.endTime || Date.now()) - logs.startTime;
        const errorCount = logs.logs.filter((l) => l.level === "error").length;
        const warningCount = logs.logs.filter((l) => l.level === "warning").length;

        return {
          found: true,
          status: logs.status,
          duration,
          logCount: logs.logs.length,
          errorCount,
          warningCount,
          startTime: logs.startTime,
          endTime: logs.endTime,
        };
      } catch (error) {
        throw new Error(
          `Failed to get build stats: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Export logs as text
   */
  exportLogs: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
        format: z.enum(["text", "json"]).default("text"),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = buildLogs.get(input.deploymentId);

        if (!logs) {
          throw new Error("Deployment not found");
        }

        let content: string;

        if (input.format === "json") {
          content = JSON.stringify(logs, null, 2);
        } else {
          content = logs.logs
            .map(
              (log) =>
                `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`
            )
            .join("\n");
        }

        return {
          success: true,
          content,
          format: input.format,
          filename: `deployment-${input.deploymentId}-logs.${input.format === "json" ? "json" : "txt"}`,
        };
      } catch (error) {
        throw new Error(
          `Failed to export logs: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Search logs
   */
  searchLogs: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
        query: z.string(),
        level: z.enum(["info", "warning", "error", "success"]).optional(),
        source: z.enum(["build", "runtime", "system"]).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = buildLogs.get(input.deploymentId);

        if (!logs) {
          return {
            results: [],
          };
        }

        const results = logs.logs.filter((log) => {
          const matchesQuery = log.message
            .toLowerCase()
            .includes(input.query.toLowerCase());
          const matchesLevel = !input.level || log.level === input.level;
          const matchesSource = !input.source || log.source === input.source;

          return matchesQuery && matchesLevel && matchesSource;
        });

        return {
          results,
          total: results.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to search logs: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
