/**
 * Gamification & Achievements Router
 * Handle badges, achievements, points, and leaderboards
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  requirement: string;
}

interface UserAchievement {
  userId: string;
  badgeId: string;
  unlockedAt: Date;
  progress: number;
  completed: boolean;
}

interface UserStats {
  userId: string;
  totalPoints: number;
  appsGenerated: number;
  deploymentsCompleted: number;
  referralsCount: number;
  githubConnected: boolean;
  vercelConnected: boolean;
  totalEarnings: number;
  level: number;
  nextLevelPoints: number;
}

const BADGES: Badge[] = [
  {
    id: "first-app",
    name: "First App",
    description: "Generate your first application",
    icon: "🚀",
    color: "violet",
    tier: "bronze",
    requirement: "Generate 1 app",
  },
  {
    id: "app-master",
    name: "App Master",
    description: "Generate 10 applications",
    icon: "⭐",
    color: "blue",
    tier: "silver",
    requirement: "Generate 10 apps",
  },
  {
    id: "deployment-hero",
    name: "Deployment Hero",
    description: "Deploy 5 apps to Vercel",
    icon: "🎯",
    color: "green",
    tier: "silver",
    requirement: "Deploy 5 apps",
  },
  {
    id: "github-master",
    name: "GitHub Master",
    description: "Connect GitHub and push 10 repositories",
    icon: "🐙",
    color: "gray",
    tier: "silver",
    requirement: "Push 10 repos",
  },
  {
    id: "referral-king",
    name: "Referral King",
    description: "Refer 10 users to AppStudio",
    icon: "👑",
    color: "gold",
    tier: "gold",
    requirement: "Refer 10 users",
  },
  {
    id: "pro-subscriber",
    name: "Pro Subscriber",
    description: "Subscribe to Professional plan",
    icon: "💎",
    color: "purple",
    tier: "gold",
    requirement: "Subscribe to Pro",
  },
  {
    id: "enterprise-user",
    name: "Enterprise User",
    description: "Subscribe to Enterprise plan",
    icon: "🏢",
    color: "platinum",
    tier: "platinum",
    requirement: "Subscribe to Enterprise",
  },
  {
    id: "speedrunner",
    name: "Speedrunner",
    description: "Generate and deploy an app in under 5 minutes",
    icon: "⚡",
    color: "orange",
    tier: "gold",
    requirement: "Deploy in 5 mins",
  },
  {
    id: "early-adopter",
    name: "Early Adopter",
    description: "Join AppStudio in the first month",
    icon: "🌱",
    color: "green",
    tier: "bronze",
    requirement: "Early user",
  },
  {
    id: "power-user",
    name: "Power User",
    description: "Generate 50 applications",
    icon: "⚙️",
    color: "red",
    tier: "platinum",
    requirement: "Generate 50 apps",
  },
];

// In-memory storage (in production, use database)
const userAchievements = new Map<string, UserAchievement[]>();
const userStats = new Map<string, UserStats>();

export const gamificationRouter = router({
  /**
   * Get all available badges
   */
  getAllBadges: protectedProcedure.query(async () => {
    try {
      return {
        badges: BADGES,
        totalBadges: BADGES.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to get badges: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get user achievements
   */
  getUserAchievements: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = String(ctx.user?.id);
      const achievements = userAchievements.get(userId) || [];

      const enriched = achievements.map((ach) => {
        const badge = BADGES.find((b) => b.id === ach.badgeId);
        return {
          ...ach,
          badge,
        };
      });

      return {
        achievements: enriched,
        totalUnlocked: achievements.filter((a) => a.completed).length,
        totalBadges: BADGES.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to get user achievements: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get user stats and level
   */
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = String(ctx.user?.id);
      let stats = userStats.get(userId);

      if (!stats) {
        stats = {
          userId,
          totalPoints: 0,
          appsGenerated: 0,
          deploymentsCompleted: 0,
          referralsCount: 0,
          githubConnected: false,
          vercelConnected: false,
          totalEarnings: 0,
          level: 1,
          nextLevelPoints: 1000,
        };
        userStats.set(userId, stats);
      }

      return stats;
    } catch (error) {
      throw new Error(
        `Failed to get user stats: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Record app generation event
   */
  recordAppGeneration: protectedProcedure
    .input(
      z.object({
        appId: z.string(),
        generationTime: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id);
        let stats = userStats.get(userId);

        if (!stats) {
          stats = {
            userId,
            totalPoints: 0,
            appsGenerated: 0,
            deploymentsCompleted: 0,
            referralsCount: 0,
            githubConnected: false,
            vercelConnected: false,
            totalEarnings: 0,
            level: 1,
            nextLevelPoints: 1000,
          };
        }

        // Award points based on generation time
        const points = input.generationTime < 300000 ? 100 : 50; // 5 minutes = 300000ms
        stats.totalPoints += points;
        stats.appsGenerated += 1;

        // Update level
        stats.level = Math.floor(stats.totalPoints / 1000) + 1;
        stats.nextLevelPoints = (stats.level + 1) * 1000;

        userStats.set(userId, stats);

        // Check for badge unlock
        const newBadges: string[] = [];

        if (stats.appsGenerated === 1) {
          newBadges.push("first-app");
        }
        if (stats.appsGenerated === 10) {
          newBadges.push("app-master");
        }
        if (stats.appsGenerated === 50) {
          newBadges.push("power-user");
        }

        // Speedrunner badge
        if (input.generationTime < 300000) {
          newBadges.push("speedrunner");
        }

        // Award new badges
        const achievements = userAchievements.get(userId) || [];
        for (const badgeId of newBadges) {
          if (!achievements.find((a) => a.badgeId === badgeId)) {
            achievements.push({
              userId,
              badgeId,
              unlockedAt: new Date(),
              progress: 100,
              completed: true,
            });
          }
        }
        userAchievements.set(userId, achievements);

        return {
          success: true,
          pointsEarned: points,
          newBadges,
          stats,
        };
      } catch (error) {
        throw new Error(
          `Failed to record app generation: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Record deployment event
   */
  recordDeployment: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
        success: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id);
        let stats = userStats.get(userId);

        if (!stats) {
          stats = {
            userId,
            totalPoints: 0,
            appsGenerated: 0,
            deploymentsCompleted: 0,
            referralsCount: 0,
            githubConnected: false,
            vercelConnected: false,
            totalEarnings: 0,
            level: 1,
            nextLevelPoints: 1000,
          };
        }

        if (input.success) {
          stats.totalPoints += 150;
          stats.deploymentsCompleted += 1;

          // Update level
          stats.level = Math.floor(stats.totalPoints / 1000) + 1;
          stats.nextLevelPoints = (stats.level + 1) * 1000;

          userStats.set(userId, stats);

          // Check for deployment hero badge
          const achievements = userAchievements.get(userId) || [];
          if (stats.deploymentsCompleted === 5) {
            if (!achievements.find((a) => a.badgeId === "deployment-hero")) {
              achievements.push({
                userId,
                badgeId: "deployment-hero",
                unlockedAt: new Date(),
                progress: 100,
                completed: true,
              });
              userAchievements.set(userId, achievements);
            }
          }
        }

        return {
          success: true,
          pointsEarned: input.success ? 150 : 0,
          stats,
        };
      } catch (error) {
        throw new Error(
          `Failed to record deployment: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Record referral event
   */
  recordReferral: protectedProcedure
    .input(
      z.object({
        referredUserId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id);
        let stats = userStats.get(userId);

        if (!stats) {
          stats = {
            userId,
            totalPoints: 0,
            appsGenerated: 0,
            deploymentsCompleted: 0,
            referralsCount: 0,
            githubConnected: false,
            vercelConnected: false,
            totalEarnings: 0,
            level: 1,
            nextLevelPoints: 1000,
          };
        }

        stats.totalPoints += 200;
        stats.referralsCount += 1;

        // Update level
        stats.level = Math.floor(stats.totalPoints / 1000) + 1;
        stats.nextLevelPoints = (stats.level + 1) * 1000;

        userStats.set(userId, stats);

        // Check for referral king badge
        const achievements = userAchievements.get(userId) || [];
        if (stats.referralsCount === 10) {
          if (!achievements.find((a) => a.badgeId === "referral-king")) {
            achievements.push({
              userId,
              badgeId: "referral-king",
              unlockedAt: new Date(),
              progress: 100,
              completed: true,
            });
            userAchievements.set(userId, achievements);
          }
        }

        return {
          success: true,
          pointsEarned: 200,
          stats,
        };
      } catch (error) {
        throw new Error(
          `Failed to record referral: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Update connection status
   */
  updateConnectionStatus: protectedProcedure
    .input(
      z.object({
        github: z.boolean().optional(),
        vercel: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id);
        let stats = userStats.get(userId);

        if (!stats) {
          stats = {
            userId,
            totalPoints: 0,
            appsGenerated: 0,
            deploymentsCompleted: 0,
            referralsCount: 0,
            githubConnected: false,
            vercelConnected: false,
            totalEarnings: 0,
            level: 1,
            nextLevelPoints: 1000,
          };
        }

        if (input.github !== undefined) {
          stats.githubConnected = input.github;
          if (input.github) stats.totalPoints += 50;
        }

        if (input.vercel !== undefined) {
          stats.vercelConnected = input.vercel;
          if (input.vercel) stats.totalPoints += 50;
        }

        userStats.set(userId, stats);

        // Check for GitHub Master badge
        const achievements = userAchievements.get(userId) || [];
        if (stats.githubConnected && !achievements.find((a) => a.badgeId === "github-master")) {
          achievements.push({
            userId,
            badgeId: "github-master",
            unlockedAt: new Date(),
            progress: 10,
            completed: false,
          });
          userAchievements.set(userId, achievements);
        }

        return {
          success: true,
          stats,
        };
      } catch (error) {
        throw new Error(
          `Failed to update connection status: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get leaderboard
   */
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        period: z.enum(["all-time", "month", "week"]).default("all-time"),
      })
    )
    .query(async ({ input }) => {
      try {
        const entries = Array.from(userStats.values())
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(0, input.limit);

        return {
          leaderboard: entries.map((entry, idx) => ({
            rank: idx + 1,
            userId: entry.userId,
            points: entry.totalPoints,
            level: entry.level,
            appsGenerated: entry.appsGenerated,
            deploymentsCompleted: entry.deploymentsCompleted,
          })),
          period: input.period,
        };
      } catch (error) {
        throw new Error(
          `Failed to get leaderboard: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
