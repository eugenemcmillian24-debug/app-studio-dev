/**
 * Cost Optimization Router
 * Track deployment costs, resource usage, and spending trends with budget alerts
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface CostRecord {
  id: string;
  timestamp: string;
  environment: string;
  service: string;
  cost: number;
  unit: string;
  quantity: number;
  metadata: Record<string, unknown>;
}

interface BudgetAlert {
  id: string;
  projectId: string;
  threshold: number;
  currentSpending: number;
  percentage: number;
  status: "active" | "resolved";
  createdAt: string;
}

interface CostTrend {
  period: string;
  totalCost: number;
  avgDailyCost: number;
  trend: "increasing" | "decreasing" | "stable";
  percentageChange: number;
}

interface ResourceUsage {
  service: string;
  cost: number;
  percentage: number;
  trend: "increasing" | "decreasing" | "stable";
}

// In-memory storage (in production, use database)
const costRecords = new Map<string, CostRecord[]>();
const budgets = new Map<string, {
  monthlyBudget: number;
  alertThreshold: number;
}>();
const budgetAlerts = new Map<string, BudgetAlert[]>();

export const costOptimizationRouter = router({
  /**
   * Record cost
   */
  recordCost: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        environment: z.string(),
        service: z.string(),
        cost: z.number(),
        unit: z.string(),
        quantity: z.number(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const record: CostRecord = {
          id: `cost_${Date.now()}`,
          timestamp: new Date().toISOString(),
          environment: input.environment,
          service: input.service,
          cost: input.cost,
          unit: input.unit,
          quantity: input.quantity,
          metadata: input.metadata || {},
        };

        let records = costRecords.get(input.projectId) || [];
        records.push(record);
        costRecords.set(input.projectId, records.slice(-10000)); // Keep last 10000

        // Check budget
        const budget = budgets.get(input.projectId);
        if (budget) {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);

          const monthlySpending = records
            .filter((r) => new Date(r.timestamp) >= monthStart)
            .reduce((sum, r) => sum + r.cost, 0);

          const percentage = (monthlySpending / budget.monthlyBudget) * 100;

          if (percentage >= budget.alertThreshold) {
            const existingAlert = (budgetAlerts.get(input.projectId) || []).find(
              (a) => a.status === "active"
            );

            if (!existingAlert) {
              const alert: BudgetAlert = {
                id: `alert_${Date.now()}`,
                projectId: input.projectId,
                threshold: budget.alertThreshold,
                currentSpending: monthlySpending,
                percentage,
                status: "active",
                createdAt: new Date().toISOString(),
              };

              let alerts = budgetAlerts.get(input.projectId) || [];
              alerts.push(alert);
              budgetAlerts.set(input.projectId, alerts);
            }
          }
        }

        return {
          success: true,
          costId: record.id,
        };
      } catch (error) {
        throw new Error(
          `Failed to record cost: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get cost summary
   */
  getCostSummary: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const records = costRecords.get(input.projectId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const relevantRecords = records.filter(
          (r) => new Date(r.timestamp) > cutoffDate
        );

        const totalCost = relevantRecords.reduce((sum, r) => sum + r.cost, 0);
        const avgDailyCost = totalCost / input.days;

        // Group by service
        const byService: Record<string, number> = {};
        for (const record of relevantRecords) {
          byService[record.service] = (byService[record.service] || 0) + record.cost;
        }

        // Group by environment
        const byEnvironment: Record<string, number> = {};
        for (const record of relevantRecords) {
          byEnvironment[record.environment] = (byEnvironment[record.environment] || 0) + record.cost;
        }

        return {
          period: `${input.days} days`,
          totalCost: parseFloat(totalCost.toFixed(2)),
          avgDailyCost: parseFloat(avgDailyCost.toFixed(2)),
          byService: Object.entries(byService).map(([service, cost]) => ({
            service,
            cost: parseFloat(cost.toFixed(2)),
            percentage: parseFloat(((cost / totalCost) * 100).toFixed(2)),
          })),
          byEnvironment: Object.entries(byEnvironment).map(([environment, cost]) => ({
            environment,
            cost: parseFloat(cost.toFixed(2)),
            percentage: parseFloat(((cost / totalCost) * 100).toFixed(2)),
          })),
        };
      } catch (error) {
        throw new Error(
          `Failed to get cost summary: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get cost trends
   */
  getCostTrends: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const records = costRecords.get(input.projectId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const relevantRecords = records.filter(
          (r) => new Date(r.timestamp) > cutoffDate
        );

        const totalCost = relevantRecords.reduce((sum, r) => sum + r.cost, 0);
        const avgDailyCost = totalCost / input.days;

        // Compare with previous period
        const prevCutoffDate = new Date(cutoffDate);
        prevCutoffDate.setDate(prevCutoffDate.getDate() - input.days);

        const prevRecords = records.filter(
          (r) => new Date(r.timestamp) > prevCutoffDate && new Date(r.timestamp) <= cutoffDate
        );

        const prevTotalCost = prevRecords.reduce((sum, r) => sum + r.cost, 0);
        const percentageChange = prevTotalCost > 0 ? ((totalCost - prevTotalCost) / prevTotalCost) * 100 : 0;

        const trend =
          percentageChange > 5 ? "increasing" : percentageChange < -5 ? "decreasing" : "stable";

        return {
          period: `${input.days} days`,
          totalCost: parseFloat(totalCost.toFixed(2)),
          avgDailyCost: parseFloat(avgDailyCost.toFixed(2)),
          trend,
          percentageChange: parseFloat(percentageChange.toFixed(2)),
          forecast: {
            monthlyEstimate: parseFloat((avgDailyCost * 30).toFixed(2)),
            yearlyEstimate: parseFloat((avgDailyCost * 365).toFixed(2)),
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to get cost trends: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Set budget
   */
  setBudget: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        monthlyBudget: z.number().min(0),
        alertThreshold: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input }) => {
      try {
        budgets.set(input.projectId, {
          monthlyBudget: input.monthlyBudget,
          alertThreshold: input.alertThreshold,
        });

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to set budget: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get budget status
   */
  getBudgetStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const budget = budgets.get(input.projectId);
        if (!budget) {
          return {
            configured: false,
          };
        }

        const records = costRecords.get(input.projectId) || [];
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthlySpending = records
          .filter((r) => new Date(r.timestamp) >= monthStart)
          .reduce((sum, r) => sum + r.cost, 0);

        const percentage = (monthlySpending / budget.monthlyBudget) * 100;
        const remaining = budget.monthlyBudget - monthlySpending;

        return {
          configured: true,
          monthlyBudget: budget.monthlyBudget,
          monthlySpending: parseFloat(monthlySpending.toFixed(2)),
          remaining: parseFloat(Math.max(0, remaining).toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2)),
          status: percentage >= 100 ? "exceeded" : percentage >= budget.alertThreshold ? "warning" : "ok",
        };
      } catch (error) {
        throw new Error(
          `Failed to get budget status: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get cost optimization recommendations
   */
  getCostOptimizationRecommendations: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const records = costRecords.get(input.projectId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const relevantRecords = records.filter(
          (r) => new Date(r.timestamp) > cutoffDate
        );

        const recommendations: Array<{
          title: string;
          description: string;
          potentialSavings: number;
          priority: "high" | "medium" | "low";
        }> = [];

        // Analyze by service
        const byService: Record<string, number> = {};
        for (const record of relevantRecords) {
          byService[record.service] = (byService[record.service] || 0) + record.cost;
        }

        const totalCost = Object.values(byService).reduce((a, b) => a + b, 0);

        // Find expensive services
        for (const [service, cost] of Object.entries(byService)) {
          const percentage = (cost / totalCost) * 100;
          if (percentage > 40) {
            recommendations.push({
              title: `Optimize ${service} usage`,
              description: `${service} accounts for ${percentage.toFixed(1)}% of costs. Consider resource optimization or alternative services.`,
              potentialSavings: cost * 0.2,
              priority: "high",
            });
          }
        }

        // Analyze by environment
        const byEnvironment: Record<string, number> = {};
        for (const record of relevantRecords) {
          byEnvironment[record.environment] = (byEnvironment[record.environment] || 0) + record.cost;
        }

        // Check for unused environments
        for (const [environment, cost] of Object.entries(byEnvironment)) {
          if (environment !== "production" && cost > totalCost * 0.3) {
            recommendations.push({
              title: `Review ${environment} environment costs`,
              description: `${environment} environment costs ${(cost / totalCost * 100).toFixed(1)}% of total. Consider consolidation or cleanup.`,
              potentialSavings: cost * 0.5,
              priority: "medium",
            });
          }
        }

        return {
          recommendations: recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings),
          totalPotentialSavings: recommendations.reduce((sum, r) => sum + r.potentialSavings, 0),
        };
      } catch (error) {
        throw new Error(
          `Failed to get cost optimization recommendations: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get budget alerts
   */
  getBudgetAlerts: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const alerts = budgetAlerts.get(input.projectId) || [];

        return {
          alerts: alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
          total: alerts.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get budget alerts: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Resolve budget alert
   */
  resolveBudgetAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.string(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const alerts = budgetAlerts.get(input.projectId) || [];
        const alert = alerts.find((a) => a.id === input.alertId);

        if (!alert) {
          throw new Error("Alert not found");
        }

        alert.status = "resolved";

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to resolve budget alert: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
