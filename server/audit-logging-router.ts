/**
 * Audit Logging & Compliance Router
 * Comprehensive audit trails for deployments, approvals, and configuration changes
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  changes: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
  status: "success" | "failure";
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
}

interface ComplianceReport {
  period: string;
  startDate: string;
  endDate: string;
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByUser: Record<string, number>;
  failedActions: number;
  unauthorizedAttempts: number;
  dataRetention: {
    logsRetained: number;
    oldestLog: string;
    newestLog: string;
  };
}

// In-memory storage (in production, use database)
const auditLogs = new Map<string, AuditLog[]>();
const compliancePolicies = new Map<string, {
  retentionDays: number;
  requireApproval: boolean;
  requireMFA: boolean;
}>();

export const auditLoggingRouter = router({
  /**
   * Log audit event
   */
  logAuditEvent: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        action: z.string(),
        resource: z.string(),
        resourceId: z.string(),
        changes: z.array(
          z.object({
            field: z.string(),
            oldValue: z.unknown(),
            newValue: z.unknown(),
          })
        ),
        status: z.enum(["success", "failure"]),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const log: AuditLog = {
          id: `audit_${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: String(ctx.user?.id || "system"),
          userName: String(ctx.user?.name || "System"),
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          changes: input.changes,
          status: input.status,
          metadata: input.metadata || {},
        };

        let logs = auditLogs.get(input.projectId) || [];
        logs.push(log);
        auditLogs.set(input.projectId, logs.slice(-100000)); // Keep last 100000

        return {
          success: true,
          logId: log.id,
        };
      } catch (error) {
        throw new Error(
          `Failed to log audit event: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get audit logs
   */
  getAuditLogs: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        limit: z.number().min(1).max(1000).default(100),
        offset: z.number().min(0).default(0),
        action: z.string().optional(),
        userId: z.string().optional(),
        status: z.enum(["success", "failure"]).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        let logs = auditLogs.get(input.projectId) || [];

        // Filter
        if (input.action) {
          logs = logs.filter((l) => l.action === input.action);
        }
        if (input.userId) {
          logs = logs.filter((l) => l.userId === input.userId);
        }
        if (input.status) {
          logs = logs.filter((l) => l.status === input.status);
        }

        // Sort by timestamp descending
        logs = logs.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        return {
          logs: logs.slice(input.offset, input.offset + input.limit),
          total: logs.length,
          offset: input.offset,
          limit: input.limit,
        };
      } catch (error) {
        throw new Error(
          `Failed to get audit logs: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get audit log details
   */
  getAuditLogDetails: protectedProcedure
    .input(
      z.object({
        logId: z.string(),
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = auditLogs.get(input.projectId) || [];
        const log = logs.find((l) => l.id === input.logId);

        if (!log) {
          throw new Error("Audit log not found");
        }

        return log;
      } catch (error) {
        throw new Error(
          `Failed to get audit log details: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Generate compliance report
   */
  generateComplianceReport: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = auditLogs.get(input.projectId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);
        const startDate = new Date(cutoffDate);

        const relevantLogs = logs.filter(
          (l) => new Date(l.timestamp) > cutoffDate
        );

        // Count by action
        const actionsByType: Record<string, number> = {};
        for (const log of relevantLogs) {
          actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
        }

        // Count by user
        const actionsByUser: Record<string, number> = {};
        for (const log of relevantLogs) {
          actionsByUser[log.userName] = (actionsByUser[log.userName] || 0) + 1;
        }

        // Count failures
        const failedActions = relevantLogs.filter((l) => l.status === "failure").length;

        // Count unauthorized attempts (failures with specific patterns)
        const unauthorizedAttempts = relevantLogs.filter(
          (l) => l.status === "failure" && l.action.includes("unauthorized")
        ).length;

        // Data retention info
        const oldestLog = logs.length > 0 ? logs[0].timestamp : null;
        const newestLog = logs.length > 0 ? logs[logs.length - 1].timestamp : null;

        const report: ComplianceReport = {
          period: `${input.days} days`,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          totalActions: relevantLogs.length,
          actionsByType,
          actionsByUser,
          failedActions,
          unauthorizedAttempts,
          dataRetention: {
            logsRetained: logs.length,
            oldestLog: oldestLog || "N/A",
            newestLog: newestLog || "N/A",
          },
        };

        return report;
      } catch (error) {
        throw new Error(
          `Failed to generate compliance report: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Search audit logs
   */
  searchAuditLogs: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        query: z.string(),
        limit: z.number().min(1).max(1000).default(100),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = auditLogs.get(input.projectId) || [];
        const query = input.query.toLowerCase();

        const results = logs.filter(
          (l) =>
            l.action.toLowerCase().includes(query) ||
            l.resource.toLowerCase().includes(query) ||
            l.resourceId.toLowerCase().includes(query) ||
            l.userName.toLowerCase().includes(query)
        );

        return {
          results: results
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, input.limit),
          total: results.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to search audit logs: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Export audit logs
   */
  exportAuditLogs: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        format: z.enum(["json", "csv"]),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = auditLogs.get(input.projectId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const relevantLogs = logs.filter(
          (l) => new Date(l.timestamp) > cutoffDate
        );

        if (input.format === "json") {
          return {
            format: "json",
            data: JSON.stringify(relevantLogs, null, 2),
            filename: `audit-logs-${new Date().toISOString().split("T")[0]}.json`,
          };
        } else {
          // CSV format
          const headers = [
            "ID",
            "Timestamp",
            "User",
            "Action",
            "Resource",
            "Resource ID",
            "Status",
            "Changes",
          ];
          const rows = relevantLogs.map((l) => [
            l.id,
            l.timestamp,
            l.userName,
            l.action,
            l.resource,
            l.resourceId,
            l.status,
            JSON.stringify(l.changes),
          ]);

          const csv = [
            headers.join(","),
            ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
          ].join("\n");

          return {
            format: "csv",
            data: csv,
            filename: `audit-logs-${new Date().toISOString().split("T")[0]}.csv`,
          };
        }
      } catch (error) {
        throw new Error(
          `Failed to export audit logs: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Set compliance policy
   */
  setCompliancePolicy: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        retentionDays: z.number().min(1).max(2555),
        requireApproval: z.boolean(),
        requireMFA: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        compliancePolicies.set(input.projectId, {
          retentionDays: input.retentionDays,
          requireApproval: input.requireApproval,
          requireMFA: input.requireMFA,
        });

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to set compliance policy: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get compliance policy
   */
  getCompliancePolicy: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const policy = compliancePolicies.get(input.projectId) || {
          retentionDays: 90,
          requireApproval: false,
          requireMFA: false,
        };

        return policy;
      } catch (error) {
        throw new Error(
          `Failed to get compliance policy: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get user activity summary
   */
  getUserActivitySummary: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = auditLogs.get(input.projectId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const userLogs = logs.filter(
          (l) => l.userId === input.userId && new Date(l.timestamp) > cutoffDate
        );

        const actionCounts: Record<string, number> = {};
        for (const log of userLogs) {
          actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        }

        const successCount = userLogs.filter((l) => l.status === "success").length;
        const failureCount = userLogs.filter((l) => l.status === "failure").length;

        return {
          userId: input.userId,
          period: `${input.days} days`,
          totalActions: userLogs.length,
          successCount,
          failureCount,
          successRate: userLogs.length > 0 ? ((successCount / userLogs.length) * 100).toFixed(2) : "0",
          actionCounts,
          lastAction: userLogs.length > 0 ? userLogs[userLogs.length - 1].timestamp : null,
        };
      } catch (error) {
        throw new Error(
          `Failed to get user activity summary: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
