/**
 * Analytics & Reporting Router
 * Generate deployment reports with trends, success rates, and performance comparisons
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface DeploymentMetrics {
  date: string;
  deployments: number;
  successCount: number;
  failureCount: number;
  avgDuration: number;
  avgBuildTime: number;
  avgBundleSize: number;
  avgLighthouseScore: number;
}

interface EnvironmentMetrics {
  environment: string;
  deployments: number;
  successRate: number;
  avgDuration: number;
  lastDeployment: string;
}

interface DeploymentReport {
  period: string;
  startDate: string;
  endDate: string;
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  successRate: number;
  avgDuration: number;
  avgBuildTime: number;
  avgBundleSize: number;
  avgLighthouseScore: number;
  byEnvironment: EnvironmentMetrics[];
  dailyMetrics: DeploymentMetrics[];
  topFailures: Array<{
    reason: string;
    count: number;
  }>;
  performanceTrends: {
    buildTimeTrend: "improving" | "degrading" | "stable";
    bundleSizeTrend: "improving" | "degrading" | "stable";
    lighthouseTrend: "improving" | "degrading" | "stable";
  };
}

// In-memory storage (in production, use database)
const deploymentRecords = new Map<string, Array<{
  id: string;
  timestamp: string;
  environment: string;
  status: "success" | "failure";
  duration: number;
  buildTime: number;
  bundleSize: number;
  lighthouseScore: number;
  reason?: string;
}>>();

export const analyticsReportingRouter = router({
  /**
   * Get deployment statistics for a period
   */
  getDeploymentStats: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const records = deploymentRecords.get(input.projectId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const relevantRecords = records.filter(
          (r) => new Date(r.timestamp) > cutoffDate
        );

        const totalDeployments = relevantRecords.length;
        const successfulDeployments = relevantRecords.filter(
          (r) => r.status === "success"
        ).length;
        const failedDeployments = totalDeployments - successfulDeployments;

        const avgDuration =
          relevantRecords.reduce((sum, r) => sum + r.duration, 0) / (totalDeployments || 1);
        const avgBuildTime =
          relevantRecords.reduce((sum, r) => sum + r.buildTime, 0) / (totalDeployments || 1);
        const avgBundleSize =
          relevantRecords.reduce((sum, r) => sum + r.bundleSize, 0) / (totalDeployments || 1);
        const avgLighthouseScore =
          relevantRecords.reduce((sum, r) => sum + r.lighthouseScore, 0) / (totalDeployments || 1);

        return {
          period: `${input.days} days`,
          totalDeployments,
          successfulDeployments,
          failedDeployments,
          successRate: totalDeployments > 0 ? ((successfulDeployments / totalDeployments) * 100).toFixed(2) : "0",
          avgDuration: Math.round(avgDuration),
          avgBuildTime: Math.round(avgBuildTime),
          avgBundleSize: Math.round(avgBundleSize),
          avgLighthouseScore: avgLighthouseScore.toFixed(2),
        };
      } catch (error) {
        throw new Error(
          `Failed to get deployment stats: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get deployment report for a period
   */
  generateDeploymentReport: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const records = deploymentRecords.get(input.projectId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);
        const startDate = new Date(cutoffDate);

        const relevantRecords = records.filter(
          (r) => new Date(r.timestamp) > cutoffDate
        );

        // Calculate overall metrics
        const totalDeployments = relevantRecords.length;
        const successfulDeployments = relevantRecords.filter(
          (r) => r.status === "success"
        ).length;
        const failedDeployments = totalDeployments - successfulDeployments;

        const avgDuration =
          relevantRecords.reduce((sum, r) => sum + r.duration, 0) / (totalDeployments || 1);
        const avgBuildTime =
          relevantRecords.reduce((sum, r) => sum + r.buildTime, 0) / (totalDeployments || 1);
        const avgBundleSize =
          relevantRecords.reduce((sum, r) => sum + r.bundleSize, 0) / (totalDeployments || 1);
        const avgLighthouseScore =
          relevantRecords.reduce((sum, r) => sum + r.lighthouseScore, 0) / (totalDeployments || 1);

        // Group by environment
        const environmentMetrics: Record<string, EnvironmentMetrics> = {};
        for (const record of relevantRecords) {
          if (!environmentMetrics[record.environment]) {
            environmentMetrics[record.environment] = {
              environment: record.environment,
              deployments: 0,
              successRate: 0,
              avgDuration: 0,
              lastDeployment: record.timestamp,
            };
          }
          const env = environmentMetrics[record.environment];
          env.deployments++;
          if (record.status === "success") {
            env.successRate++;
          }
          env.avgDuration += record.duration;
          if (new Date(record.timestamp) > new Date(env.lastDeployment)) {
            env.lastDeployment = record.timestamp;
          }
        }

        // Calculate environment percentages
        for (const env of Object.values(environmentMetrics)) {
          env.successRate = env.deployments > 0 ? (env.successRate / env.deployments) * 100 : 0;
          env.avgDuration = env.deployments > 0 ? env.avgDuration / env.deployments : 0;
        }

        // Group by day
        const dailyMetrics: Record<string, DeploymentMetrics> = {};
        for (const record of relevantRecords) {
          const date = new Date(record.timestamp).toISOString().split("T")[0];
          if (!dailyMetrics[date]) {
            dailyMetrics[date] = {
              date,
              deployments: 0,
              successCount: 0,
              failureCount: 0,
              avgDuration: 0,
              avgBuildTime: 0,
              avgBundleSize: 0,
              avgLighthouseScore: 0,
            };
          }
          const day = dailyMetrics[date];
          day.deployments++;
          if (record.status === "success") {
            day.successCount++;
          } else {
            day.failureCount++;
          }
          day.avgDuration += record.duration;
          day.avgBuildTime += record.buildTime;
          day.avgBundleSize += record.bundleSize;
          day.avgLighthouseScore += record.lighthouseScore;
        }

        // Calculate daily averages
        for (const day of Object.values(dailyMetrics)) {
          day.avgDuration = day.deployments > 0 ? day.avgDuration / day.deployments : 0;
          day.avgBuildTime = day.deployments > 0 ? day.avgBuildTime / day.deployments : 0;
          day.avgBundleSize = day.deployments > 0 ? day.avgBundleSize / day.deployments : 0;
          day.avgLighthouseScore = day.deployments > 0 ? day.avgLighthouseScore / day.deployments : 0;
        }

        // Get top failures
        const failureReasons: Record<string, number> = {};
        for (const record of relevantRecords) {
          if (record.status === "failure" && record.reason) {
            failureReasons[record.reason] = (failureReasons[record.reason] || 0) + 1;
          }
        }

        const topFailures = Object.entries(failureReasons)
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate trends
        const firstHalf = relevantRecords.slice(0, Math.floor(relevantRecords.length / 2));
        const secondHalf = relevantRecords.slice(Math.floor(relevantRecords.length / 2));

        const firstHalfBuildTime = firstHalf.reduce((sum, r) => sum + r.buildTime, 0) / (firstHalf.length || 1);
        const secondHalfBuildTime = secondHalf.reduce((sum, r) => sum + r.buildTime, 0) / (secondHalf.length || 1);

        const firstHalfBundleSize = firstHalf.reduce((sum, r) => sum + r.bundleSize, 0) / (firstHalf.length || 1);
        const secondHalfBundleSize = secondHalf.reduce((sum, r) => sum + r.bundleSize, 0) / (secondHalf.length || 1);

        const firstHalfLighthouse = firstHalf.reduce((sum, r) => sum + r.lighthouseScore, 0) / (firstHalf.length || 1);
        const secondHalfLighthouse = secondHalf.reduce((sum, r) => sum + r.lighthouseScore, 0) / (secondHalf.length || 1);

        const report: DeploymentReport = {
          period: `${input.days} days`,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          totalDeployments,
          successfulDeployments,
          failedDeployments,
          successRate: totalDeployments > 0 ? ((successfulDeployments / totalDeployments) * 100) : 0,
          avgDuration: Math.round(avgDuration),
          avgBuildTime: Math.round(avgBuildTime),
          avgBundleSize: Math.round(avgBundleSize),
          avgLighthouseScore: parseFloat(avgLighthouseScore.toFixed(2)),
          byEnvironment: Object.values(environmentMetrics),
          dailyMetrics: Object.values(dailyMetrics).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
          topFailures,
          performanceTrends: {
            buildTimeTrend: secondHalfBuildTime < firstHalfBuildTime * 0.95 ? "improving" : secondHalfBuildTime > firstHalfBuildTime * 1.05 ? "degrading" : "stable",
            bundleSizeTrend: secondHalfBundleSize < firstHalfBundleSize * 0.95 ? "improving" : secondHalfBundleSize > firstHalfBundleSize * 1.05 ? "degrading" : "stable",
            lighthouseTrend: secondHalfLighthouse > firstHalfLighthouse * 1.05 ? "improving" : secondHalfLighthouse < firstHalfLighthouse * 0.95 ? "degrading" : "stable",
          },
        };

        return report;
      } catch (error) {
        throw new Error(
          `Failed to generate deployment report: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Record deployment metrics
   */
  recordDeployment: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        environment: z.string(),
        status: z.enum(["success", "failure"]),
        duration: z.number(),
        buildTime: z.number(),
        bundleSize: z.number(),
        lighthouseScore: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let records = deploymentRecords.get(input.projectId) || [];

        records.push({
          id: `deployment_${Date.now()}`,
          timestamp: new Date().toISOString(),
          environment: input.environment,
          status: input.status,
          duration: input.duration,
          buildTime: input.buildTime,
          bundleSize: input.bundleSize,
          lighthouseScore: input.lighthouseScore,
          reason: input.reason,
        });

        // Keep last 1000 records
        records = records.slice(-1000);
        deploymentRecords.set(input.projectId, records);

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to record deployment: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Compare deployments across environments
   */
  compareEnvironments: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const records = deploymentRecords.get(input.projectId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const relevantRecords = records.filter(
          (r) => new Date(r.timestamp) > cutoffDate
        );

        const comparison: Record<string, {
          environment: string;
          deployments: number;
          successRate: number;
          avgDuration: number;
          avgBuildTime: number;
          avgBundleSize: number;
          avgLighthouseScore: number;
        }> = {};

        for (const record of relevantRecords) {
          if (!comparison[record.environment]) {
            comparison[record.environment] = {
              environment: record.environment,
              deployments: 0,
              successRate: 0,
              avgDuration: 0,
              avgBuildTime: 0,
              avgBundleSize: 0,
              avgLighthouseScore: 0,
            };
          }

          const env = comparison[record.environment];
          env.deployments++;
          if (record.status === "success") {
            env.successRate++;
          }
          env.avgDuration += record.duration;
          env.avgBuildTime += record.buildTime;
          env.avgBundleSize += record.bundleSize;
          env.avgLighthouseScore += record.lighthouseScore;
        }

        // Calculate averages
        for (const env of Object.values(comparison)) {
          env.successRate = env.deployments > 0 ? (env.successRate / env.deployments) * 100 : 0;
          env.avgDuration = env.deployments > 0 ? env.avgDuration / env.deployments : 0;
          env.avgBuildTime = env.deployments > 0 ? env.avgBuildTime / env.deployments : 0;
          env.avgBundleSize = env.deployments > 0 ? env.avgBundleSize / env.deployments : 0;
          env.avgLighthouseScore = env.deployments > 0 ? env.avgLighthouseScore / env.deployments : 0;
        }

        return {
          period: `${input.days} days`,
          environments: Object.values(comparison),
        };
      } catch (error) {
        throw new Error(
          `Failed to compare environments: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
