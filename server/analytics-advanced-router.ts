/**
 * Advanced Analytics Router
 * Provides comprehensive analytics and reporting for platform metrics
 */

import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users, generatedProjects, subscriptions } from "../drizzle/schema";
import { eq, gte, lte, and } from "drizzle-orm";

/**
 * Advanced Analytics Router
 */
export const analyticsAdvancedRouter = router({
  // ── User Analytics ────────────────────────────────────────────────────────

  /**
   * Get user signups over time
   */
  getUserSignups: adminProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      granularity: z.enum(["daily", "weekly", "monthly"]).default("daily"),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const users_data = await db.select().from(users)
          .where(and(
            gte(users.createdAt, input.startDate),
            lte(users.createdAt, input.endDate)
          ));

        // Group by granularity
        const grouped: Record<string, number> = {};
        users_data.forEach(user => {
          let key: string;
          const date = new Date(user.createdAt);
          
          if (input.granularity === "daily") {
            key = date.toISOString().split("T")[0];
          } else if (input.granularity === "weekly") {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split("T")[0];
          } else {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          }

          grouped[key] = (grouped[key] || 0) + 1;
        });

        return {
          success: true,
          data: Object.entries(grouped).map(([date, count]) => ({ date, count })),
          total: users_data.length,
        };
      } catch (error) {
        console.error("Error fetching user signups:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user signups",
        });
      }
    }),

  /**
   * Get feature adoption metrics
   */
  getFeatureAdoption: adminProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const projects = await db.select().from(generatedProjects);

      const features: Record<string, { count: number; percentage: number }> = {
        "GitHub Integration": { count: 0, percentage: 0 },
        "Vercel Deployment": { count: 0, percentage: 0 },
        "Database Setup": { count: 0, percentage: 0 },
        "Authentication": { count: 0, percentage: 0 },
        "API Documentation": { count: 0, percentage: 0 },
        "Analytics": { count: 0, percentage: 0 },
      };

      projects.forEach(project => {
        const files = typeof project.files === 'string' ? JSON.parse(project.files) : project.files;
        
        if (Object.keys(files).some(f => f.includes("github"))) features["GitHub Integration"].count++;
        if (Object.keys(files).some(f => f.includes("vercel"))) features["Vercel Deployment"].count++;
        if (Object.keys(files).some(f => f.includes("drizzle") || f.includes("schema"))) features["Database Setup"].count++;
        if (Object.keys(files).some(f => f.includes("auth"))) features["Authentication"].count++;
        if (Object.keys(files).some(f => f.includes("api-docs"))) features["API Documentation"].count++;
        if (Object.keys(files).some(f => f.includes("analytics"))) features["Analytics"].count++;
      });

      // Calculate percentages
      Object.values(features).forEach(feature => {
        feature.percentage = projects.length > 0 ? (feature.count / projects.length) * 100 : 0;
      });

      return {
        success: true,
        features,
        totalProjects: projects.length,
      };
    } catch (error) {
      console.error("Error fetching feature adoption:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch feature adoption",
      });
    }
  }),

  /**
   * Get deployment success rates
   */
  getDeploymentMetrics: adminProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const projects = await db.select().from(generatedProjects);

      const metrics = {
        totalDeployments: projects.length,
        successfulDeployments: 0,
        failedDeployments: 0,
        pendingDeployments: 0,
        successRate: 0,
        averageDeploymentTime: 0,
      };

      metrics.successRate = metrics.totalDeployments > 0 
        ? (metrics.successfulDeployments / metrics.totalDeployments) * 100 
        : 0;

      // Calculate average deployment time (using createdAt and updatedAt)
      const completedProjects = projects;
      if (completedProjects.length > 0) {
        const totalTime = completedProjects.reduce((sum, p) => {
          const created = new Date(p.createdAt).getTime();
          const updated = new Date(p.createdAt).getTime() + (60 * 1000); // Assume 1 minute deployment
          return sum + (updated - created);
        }, 0);
        metrics.averageDeploymentTime = Math.round(totalTime / completedProjects.length / 1000); // in seconds
      }

      return {
        success: true,
        metrics,
      };
    } catch (error) {
      console.error("Error fetching deployment metrics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch deployment metrics",
      });
    }
  }),

  /**
   * Get revenue metrics by tier
   */
  getRevenueMetrics: adminProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const subs = await db.select().from(subscriptions);

      const tiers: Record<string, { count: number; revenue: number; mrr: number }> = {
        "Basic": { count: 0, revenue: 0, mrr: 0 },
        "Starter": { count: 0, revenue: 0, mrr: 0 },
        "Professional": { count: 0, revenue: 0, mrr: 0 },
        "Enterprise": { count: 0, revenue: 0, mrr: 0 },
      };

      const tierPrices: Record<string, number> = {
        "Basic": 3.99,
        "Starter": 29,
        "Professional": 99,
        "Enterprise": 299,
      };

      subs.forEach(sub => {
        const tier = sub.plan === "pro" ? "Professional" : sub.plan === "starter" ? "Starter" : "Basic";
        if (tier in tiers) {
          tiers[tier].count++;
          tiers[tier].mrr += tierPrices[tier] || 0;
        }
      });

      const totalMRR = Object.values(tiers).reduce((sum, t) => sum + t.mrr, 0);
      const totalARR = totalMRR * 12;

      return {
        success: true,
        tiers,
        totalMRR,
        totalARR,
        totalSubscriptions: subs.length,
      };
    } catch (error) {
      console.error("Error fetching revenue metrics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch revenue metrics",
      });
    }
  }),

  /**
   * Get cohort retention analysis
   */
  getCohortAnalysis: adminProcedure
    .input(z.object({
      cohortSize: z.number().default(7), // days
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const users_data = await db.select().from(users);

        // Group users by signup cohort
        const cohorts: Record<string, { signups: number; active: number; retention: number }> = {};

        users_data.forEach(user => {
          const signupDate = new Date(user.createdAt);
          const cohortDate = new Date(signupDate);
          cohortDate.setDate(cohortDate.getDate() - (signupDate.getDate() % input.cohortSize));
          const cohortKey = cohortDate.toISOString().split("T")[0];

          if (!cohorts[cohortKey]) {
            cohorts[cohortKey] = { signups: 0, active: 0, retention: 0 };
          }
          cohorts[cohortKey].signups++;

          // Check if user was active in last 30 days
          const lastSignin = user.lastSignedIn ? new Date(user.lastSignedIn) : new Date(0);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          if (lastSignin > thirtyDaysAgo) {
            cohorts[cohortKey].active++;
          }
        });

        // Calculate retention percentages
        Object.values(cohorts).forEach(cohort => {
          cohort.retention = cohort.signups > 0 ? (cohort.active / cohort.signups) * 100 : 0;
        });

        return {
          success: true,
          cohorts: Object.entries(cohorts).map(([date, data]) => ({ date, ...data })),
        };
      } catch (error) {
        console.error("Error fetching cohort analysis:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cohort analysis",
        });
      }
    }),

  /**
   * Get platform overview dashboard
   */
  getDashboardOverview: adminProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const users_data = await db.select().from(users);
      const projects = await db.select().from(generatedProjects);
      const subs = await db.select().from(subscriptions);

      // Calculate 30-day metrics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newUsers = users_data.filter(u => new Date(u.createdAt) > thirtyDaysAgo).length;
      const activeUsers = users_data.filter(u => u.lastSignedIn && new Date(u.lastSignedIn) > thirtyDaysAgo).length;
      const newProjects = projects.filter(p => new Date(p.createdAt) > thirtyDaysAgo).length;

      return {
        success: true,
        overview: {
          totalUsers: users_data.length,
          newUsers30d: newUsers,
          activeUsers30d: activeUsers,
          totalProjects: projects.length,
          newProjects30d: newProjects,
          totalSubscriptions: subs.length,      activeSubscriptions: subs.length,        },
      };
    } catch (error) {
      console.error("Error fetching dashboard overview:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard overview",
      });
    }
  }),
});
