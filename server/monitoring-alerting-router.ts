/**
 * Monitoring & Alerting Router
 * Real-time monitoring with uptime tracking, error rate alerts, and SLA compliance
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface HealthMetric {
  timestamp: string;
  uptime: number;
  errorRate: number;
  responseTime: number;
  requestCount: number;
  errorCount: number;
  statusCode: Record<string, number>;
}

interface Alert {
  id: string;
  projectId: string;
  type: "uptime" | "error_rate" | "response_time" | "performance";
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  threshold: number;
  currentValue: number;
  status: "active" | "resolved" | "acknowledged";
  createdAt: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
}

interface SLAMetric {
  period: string;
  uptime: number;
  targetUptime: number;
  errorRate: number;
  targetErrorRate: number;
  avgResponseTime: number;
  targetResponseTime: number;
  compliant: boolean;
}

// In-memory storage (in production, use database)
const healthMetrics = new Map<string, HealthMetric[]>();
const alerts = new Map<string, Alert[]>();
const slaTargets = new Map<string, {
  uptime: number;
  errorRate: number;
  responseTime: number;
}>();

export const monitoringAlertingRouter = router({
  /**
   * Record health metric
   */
  recordHealthMetric: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        uptime: z.number(),
        errorRate: z.number(),
        responseTime: z.number(),
        requestCount: z.number(),
        errorCount: z.number(),
        statusCode: z.record(z.string(), z.number()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const metric: HealthMetric = {
          timestamp: new Date().toISOString(),
          uptime: input.uptime,
          errorRate: input.errorRate,
          responseTime: input.responseTime,
          requestCount: input.requestCount,
          errorCount: input.errorCount,
          statusCode: input.statusCode,
        };

        let metrics = healthMetrics.get(input.projectId) || [];
        metrics.push(metric);
        healthMetrics.set(input.projectId, metrics.slice(-1000)); // Keep last 1000

        // Check thresholds and create alerts
        const targets = slaTargets.get(input.projectId) || {
          uptime: 99.9,
          errorRate: 1,
          responseTime: 1000,
        };

        if (input.uptime < targets.uptime) {
          await createAlert(input.projectId, {
            type: "uptime",
            severity: input.uptime < targets.uptime - 5 ? "critical" : "warning",
            title: `Uptime Alert: ${input.uptime}%`,
            message: `Uptime has dropped to ${input.uptime}% (target: ${targets.uptime}%)`,
            threshold: targets.uptime,
            currentValue: input.uptime,
          });
        }

        if (input.errorRate > targets.errorRate) {
          await createAlert(input.projectId, {
            type: "error_rate",
            severity: input.errorRate > targets.errorRate * 2 ? "critical" : "warning",
            title: `Error Rate Alert: ${input.errorRate}%`,
            message: `Error rate has increased to ${input.errorRate}% (target: ${targets.errorRate}%)`,
            threshold: targets.errorRate,
            currentValue: input.errorRate,
          });
        }

        if (input.responseTime > targets.responseTime) {
          await createAlert(input.projectId, {
            type: "response_time",
            severity: input.responseTime > targets.responseTime * 2 ? "critical" : "warning",
            title: `Response Time Alert: ${input.responseTime}ms`,
            message: `Response time has increased to ${input.responseTime}ms (target: ${targets.responseTime}ms)`,
            threshold: targets.responseTime,
            currentValue: input.responseTime,
          });
        }

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to record health metric: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get health metrics
   */
  getHealthMetrics: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        hours: z.number().min(1).max(720).default(24),
      })
    )
    .query(async ({ input }) => {
      try {
        const metrics = healthMetrics.get(input.projectId) || [];
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - input.hours);

        const relevantMetrics = metrics.filter(
          (m) => new Date(m.timestamp) > cutoffTime
        );

        const avgUptime = relevantMetrics.reduce((sum, m) => sum + m.uptime, 0) / (relevantMetrics.length || 1);
        const avgErrorRate = relevantMetrics.reduce((sum, m) => sum + m.errorRate, 0) / (relevantMetrics.length || 1);
        const avgResponseTime = relevantMetrics.reduce((sum, m) => sum + m.responseTime, 0) / (relevantMetrics.length || 1);
        const totalRequests = relevantMetrics.reduce((sum, m) => sum + m.requestCount, 0);
        const totalErrors = relevantMetrics.reduce((sum, m) => sum + m.errorCount, 0);

        return {
          period: `${input.hours} hours`,
          metrics: relevantMetrics,
          summary: {
            avgUptime: avgUptime.toFixed(2),
            avgErrorRate: avgErrorRate.toFixed(2),
            avgResponseTime: Math.round(avgResponseTime),
            totalRequests,
            totalErrors,
            dataPoints: relevantMetrics.length,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to get health metrics: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get current health status
   */
  getCurrentHealthStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const metrics = healthMetrics.get(input.projectId) || [];
        const latestMetric = metrics[metrics.length - 1];

        if (!latestMetric) {
          return {
            status: "unknown",
            lastUpdate: null,
          };
        }

        const status =
          latestMetric.uptime >= 99 && latestMetric.errorRate < 1
            ? "healthy"
            : latestMetric.uptime >= 95 && latestMetric.errorRate < 5
              ? "degraded"
              : "unhealthy";

        return {
          status,
          lastUpdate: latestMetric.timestamp,
          metrics: latestMetric,
        };
      } catch (error) {
        throw new Error(
          `Failed to get health status: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get active alerts
   */
  getActiveAlerts: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const projectAlerts = alerts.get(input.projectId) || [];
        const activeAlerts = projectAlerts.filter((a) => a.status === "active");

        return {
          alerts: activeAlerts,
          total: activeAlerts.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get active alerts: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Acknowledge alert
   */
  acknowledgeAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.string(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const projectAlerts = alerts.get(input.projectId) || [];
        const alert = projectAlerts.find((a) => a.id === input.alertId);

        if (!alert) {
          throw new Error("Alert not found");
        }

        alert.status = "acknowledged";
        alert.acknowledgedAt = new Date().toISOString();

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to acknowledge alert: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Resolve alert
   */
  resolveAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.string(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const projectAlerts = alerts.get(input.projectId) || [];
        const alert = projectAlerts.find((a) => a.id === input.alertId);

        if (!alert) {
          throw new Error("Alert not found");
        }

        alert.status = "resolved";
        alert.resolvedAt = new Date().toISOString();

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to resolve alert: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Set SLA targets
   */
  setSLATargets: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        uptime: z.number().min(0).max(100),
        errorRate: z.number().min(0).max(100),
        responseTime: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      try {
        slaTargets.set(input.projectId, {
          uptime: input.uptime,
          errorRate: input.errorRate,
          responseTime: input.responseTime,
        });

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to set SLA targets: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get SLA compliance
   */
  getSLACompliance: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const metrics = healthMetrics.get(input.projectId) || [];
        const targets = slaTargets.get(input.projectId) || {
          uptime: 99.9,
          errorRate: 1,
          responseTime: 1000,
        };

        const cutoffTime = new Date();
        cutoffTime.setDate(cutoffTime.getDate() - input.days);

        const relevantMetrics = metrics.filter(
          (m) => new Date(m.timestamp) > cutoffTime
        );

        const avgUptime = relevantMetrics.reduce((sum, m) => sum + m.uptime, 0) / (relevantMetrics.length || 1);
        const avgErrorRate = relevantMetrics.reduce((sum, m) => sum + m.errorRate, 0) / (relevantMetrics.length || 1);
        const avgResponseTime = relevantMetrics.reduce((sum, m) => sum + m.responseTime, 0) / (relevantMetrics.length || 1);

        const compliance: SLAMetric = {
          period: `${input.days} days`,
          uptime: parseFloat(avgUptime.toFixed(2)),
          targetUptime: targets.uptime,
          errorRate: parseFloat(avgErrorRate.toFixed(2)),
          targetErrorRate: targets.errorRate,
          avgResponseTime: Math.round(avgResponseTime),
          targetResponseTime: targets.responseTime,
          compliant:
            avgUptime >= targets.uptime &&
            avgErrorRate <= targets.errorRate &&
            avgResponseTime <= targets.responseTime,
        };

        return compliance;
      } catch (error) {
        throw new Error(
          `Failed to get SLA compliance: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get alert history
   */
  getAlertHistory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const projectAlerts = alerts.get(input.projectId) || [];

        return {
          alerts: projectAlerts
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, input.limit),
          total: projectAlerts.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get alert history: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});

/**
 * Helper function to create alerts
 */
async function createAlert(
  projectId: string,
  data: {
    type: "uptime" | "error_rate" | "response_time" | "performance";
    severity: "critical" | "warning" | "info";
    title: string;
    message: string;
    threshold: number;
    currentValue: number;
  }
) {
  const projectAlerts = alerts.get(projectId) || [];

  // Check if similar alert already exists
  const existingAlert = projectAlerts.find(
    (a) => a.type === data.type && a.status === "active"
  );

  if (!existingAlert) {
    const alert: Alert = {
      id: `alert_${Date.now()}`,
      projectId,
      type: data.type,
      severity: data.severity,
      title: data.title,
      message: data.message,
      threshold: data.threshold,
      currentValue: data.currentValue,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    projectAlerts.push(alert);
    alerts.set(projectId, projectAlerts.slice(-1000)); // Keep last 1000
  }
}
