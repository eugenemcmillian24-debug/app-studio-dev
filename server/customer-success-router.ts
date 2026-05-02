/**
 * Customer Success Router
 * Track ROI metrics and customer health to reduce churn
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface ROIMetric {
  id: string;
  projectId: string;
  metric: string;
  value: number;
  unit: string;
  timestamp: string;
  estimatedSavings: number;
}

interface CustomerHealth {
  projectId: string;
  score: number; // 0-100
  status: "healthy" | "at_risk" | "churning";
  lastActiveDate: string;
  deploymentFrequency: number;
  featureUsageRate: number;
  supportTickets: number;
  recommendations: string[];
}

interface SuccessMetrics {
  deploymentsAutomated: number;
  downtimePrevented: number;
  costOptimized: number;
  deploymentTimeReduced: number;
  teamProductivity: number;
  estimatedAnnualSavings: number;
}

// In-memory storage (in production, use database)
const roiMetrics = new Map<string, ROIMetric[]>();
const customerHealth = new Map<string, CustomerHealth>();
const successMetrics = new Map<string, SuccessMetrics>();

export const customerSuccessRouter = router({
  /**
   * Record ROI metric
   */
  recordROIMetric: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        metric: z.enum([
          "deployments_automated",
          "downtime_prevented",
          "cost_optimized",
          "deployment_time_reduced",
          "team_productivity_gain",
        ]),
        value: z.number(),
        unit: z.string(),
        estimatedSavings: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const roiRecord: ROIMetric = {
          id: `roi_${Date.now()}`,
          projectId: input.projectId,
          metric: input.metric,
          value: input.value,
          unit: input.unit,
          timestamp: new Date().toISOString(),
          estimatedSavings: input.estimatedSavings || 0,
        };

        let metrics = roiMetrics.get(input.projectId) || [];
        metrics.push(roiRecord);
        roiMetrics.set(input.projectId, metrics.slice(-10000));

        // Update customer health
        updateCustomerHealth(input.projectId);

        return {
          success: true,
          metricId: roiRecord.id,
        };
      } catch (error) {
        throw new Error(
          `Failed to record ROI metric: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get ROI metrics
   */
  getROIMetrics: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const metrics = roiMetrics.get(input.projectId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const relevantMetrics = metrics.filter(
          (m) => new Date(m.timestamp) > cutoffDate
        );

        const totalSavings = relevantMetrics.reduce((sum, m) => sum + m.estimatedSavings, 0);

        return {
          metrics: relevantMetrics,
          summary: {
            totalMetrics: relevantMetrics.length,
            totalEstimatedSavings: parseFloat(totalSavings.toFixed(2)),
            avgSavingsPerMetric: relevantMetrics.length > 0
              ? parseFloat((totalSavings / relevantMetrics.length).toFixed(2))
              : 0,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to get ROI metrics: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get customer health score
   */
  getCustomerHealth: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        let health = customerHealth.get(input.projectId);

        if (!health) {
          health = {
            projectId: input.projectId,
            score: 50,
            status: "at_risk",
            lastActiveDate: new Date().toISOString(),
            deploymentFrequency: 0,
            featureUsageRate: 0,
            supportTickets: 0,
            recommendations: [],
          };
          customerHealth.set(input.projectId, health);
        }

        return health;
      } catch (error) {
        throw new Error(
          `Failed to get customer health: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get success metrics
   */
  getSuccessMetrics: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        let metrics = successMetrics.get(input.projectId);

        if (!metrics) {
          metrics = {
            deploymentsAutomated: 0,
            downtimePrevented: 0,
            costOptimized: 0,
            deploymentTimeReduced: 0,
            teamProductivity: 0,
            estimatedAnnualSavings: 0,
          };
          successMetrics.set(input.projectId, metrics);
        }

        return metrics;
      } catch (error) {
        throw new Error(
          `Failed to get success metrics: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Update success metrics
   */
  updateSuccessMetrics: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        deploymentsAutomated: z.number().optional(),
        downtimePrevented: z.number().optional(),
        costOptimized: z.number().optional(),
        deploymentTimeReduced: z.number().optional(),
        teamProductivity: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let metrics = successMetrics.get(input.projectId) || {
          deploymentsAutomated: 0,
          downtimePrevented: 0,
          costOptimized: 0,
          deploymentTimeReduced: 0,
          teamProductivity: 0,
          estimatedAnnualSavings: 0,
        };

        if (input.deploymentsAutomated !== undefined) {
          metrics.deploymentsAutomated = input.deploymentsAutomated;
        }
        if (input.downtimePrevented !== undefined) {
          metrics.downtimePrevented = input.downtimePrevented;
        }
        if (input.costOptimized !== undefined) {
          metrics.costOptimized = input.costOptimized;
        }
        if (input.deploymentTimeReduced !== undefined) {
          metrics.deploymentTimeReduced = input.deploymentTimeReduced;
        }
        if (input.teamProductivity !== undefined) {
          metrics.teamProductivity = input.teamProductivity;
        }

        // Calculate estimated annual savings
        metrics.estimatedAnnualSavings =
          metrics.costOptimized * 12 +
          metrics.downtimePrevented * 100 +
          metrics.deploymentTimeReduced * 50 +
          metrics.teamProductivity * 200;

        successMetrics.set(input.projectId, metrics);

        return {
          success: true,
          metrics,
        };
      } catch (error) {
        throw new Error(
          `Failed to update success metrics: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get upgrade recommendations
   */
  getUpgradeRecommendations: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        currentTier: z.enum(["starter", "professional", "enterprise"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const metrics = successMetrics.get(input.projectId) || {
          deploymentsAutomated: 0,
          downtimePrevented: 0,
          costOptimized: 0,
          deploymentTimeReduced: 0,
          teamProductivity: 0,
          estimatedAnnualSavings: 0,
        };

        const recommendations: Array<{
          title: string;
          description: string;
          estimatedROI: number;
          priority: "high" | "medium" | "low";
        }> = [];

        // Analyze usage patterns and suggest upgrades
        if (input.currentTier === "starter") {
          if (metrics.deploymentsAutomated > 100) {
            recommendations.push({
              title: "Upgrade to Professional",
              description:
                "Your deployment frequency exceeds Starter limits. Professional tier supports 1,000 deployments/month.",
              estimatedROI: (metrics.costOptimized * 12) / 99,
              priority: "high",
            });
          }

          if (metrics.teamProductivity > 50) {
            recommendations.push({
              title: "Add Team Members",
              description:
                "You're using AppStudio heavily. Upgrade to Professional to add more team members (up to 15).",
              estimatedROI: (metrics.teamProductivity * 200) / 99,
              priority: "medium",
            });
          }
        }

        if (input.currentTier === "professional") {
          if (metrics.deploymentsAutomated > 1000) {
            recommendations.push({
              title: "Upgrade to Enterprise",
              description:
                "Your deployment volume exceeds Professional limits. Enterprise tier offers unlimited deployments.",
              estimatedROI: (metrics.costOptimized * 12) / 299,
              priority: "high",
            });
          }

          if (metrics.estimatedAnnualSavings > 5000) {
            recommendations.push({
              title: "Unlock Advanced Compliance",
              description:
                "Your organization is generating significant value. Consider adding advanced compliance features ($79/month).",
              estimatedROI: (metrics.estimatedAnnualSavings * 0.1) / 79,
              priority: "medium",
            });
          }
        }

        return {
          recommendations: recommendations.sort((a, b) => b.estimatedROI - a.estimatedROI),
          totalPotentialValue: recommendations.reduce((sum, r) => sum + r.estimatedROI, 0),
        };
      } catch (error) {
        throw new Error(
          `Failed to get upgrade recommendations: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get churn risk assessment
   */
  getChurnRiskAssessment: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const health = customerHealth.get(input.projectId);
        const metrics = roiMetrics.get(input.projectId) || [];

        if (!health) {
          return {
            riskLevel: "unknown",
            score: 0,
            factors: [],
            recommendations: [],
          };
        }

        const riskFactors: Array<{
          factor: string;
          weight: number;
          description: string;
        }> = [];

        // Analyze inactivity
        const lastActive = new Date(health.lastActiveDate);
        const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceActive > 30) {
          riskFactors.push({
            factor: "inactivity",
            weight: 0.3,
            description: "No activity for 30+ days",
          });
        }

        // Analyze feature usage
        if (health.featureUsageRate < 20) {
          riskFactors.push({
            factor: "low_feature_usage",
            weight: 0.2,
            description: "Using less than 20% of available features",
          });
        }

        // Analyze support tickets
        if (health.supportTickets > 5) {
          riskFactors.push({
            factor: "high_support_tickets",
            weight: 0.25,
            description: "More than 5 support tickets in last 30 days",
          });
        }

        // Analyze deployment frequency
        if (health.deploymentFrequency < 1) {
          riskFactors.push({
            factor: "low_deployment_frequency",
            weight: 0.25,
            description: "Less than 1 deployment per week",
          });
        }

        const totalWeight = riskFactors.reduce((sum, f) => sum + f.weight, 0);
        const riskScore = Math.min(100, totalWeight * 100);

        const riskLevel =
          riskScore > 70 ? "critical" : riskScore > 40 ? "high" : riskScore > 20 ? "medium" : "low";

        const recommendations: string[] = [];

        if (riskLevel === "critical" || riskLevel === "high") {
          recommendations.push("Schedule customer success call to understand pain points");
          recommendations.push("Offer personalized onboarding or training session");
          recommendations.push("Provide special discount or add-on to increase engagement");
        }

        if (health.featureUsageRate < 50) {
          recommendations.push("Send feature education content to increase adoption");
        }

        if (health.supportTickets > 3) {
          recommendations.push("Proactively reach out to resolve support issues");
        }

        return {
          riskLevel,
          score: Math.round(riskScore),
          factors: riskFactors,
          recommendations,
          daysSinceActive: Math.round(daysSinceActive),
        };
      } catch (error) {
        throw new Error(
          `Failed to get churn risk assessment: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get customer segments
   */
  getCustomerSegments: protectedProcedure.query(async () => {
    try {
      const allHealth = Array.from(customerHealth.values());

      const segments = {
        healthy: allHealth.filter((h) => h.status === "healthy").length,
        atRisk: allHealth.filter((h) => h.status === "at_risk").length,
        churning: allHealth.filter((h) => h.status === "churning").length,
      };

      return {
        segments,
        total: allHealth.length,
        churnRate: allHealth.length > 0
          ? ((segments.churning / allHealth.length) * 100).toFixed(2)
          : "0",
      };
    } catch (error) {
      throw new Error(
        `Failed to get customer segments: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),
});

/**
 * Helper function to update customer health
 */
function updateCustomerHealth(projectId: string) {
  const metrics = roiMetrics.get(projectId) || [];
  let health = customerHealth.get(projectId);

  if (!health) {
    health = {
      projectId,
      score: 50,
      status: "at_risk",
      lastActiveDate: new Date().toISOString(),
      deploymentFrequency: 0,
      featureUsageRate: 0,
      supportTickets: 0,
      recommendations: [],
    };
  }

  // Update last active date
  health.lastActiveDate = new Date().toISOString();

  // Calculate deployment frequency (deployments per week)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyDeployments = metrics.filter(
    (m) => new Date(m.timestamp) > weekAgo && m.metric === "deployments_automated"
  ).length;
  health.deploymentFrequency = weeklyDeployments;

  // Calculate health score
  let score = 50;
  if (weeklyDeployments > 5) score += 20;
  if (metrics.length > 100) score += 15;
  const daysSinceActive = (Date.now() - new Date(health.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceActive < 7) score += 15;

  health.score = Math.min(100, score);
  health.status = health.score > 70 ? "healthy" : health.score > 40 ? "at_risk" : "churning";

  customerHealth.set(projectId, health);
}
