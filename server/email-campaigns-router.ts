/**
 * Personalized Email Campaigns Router
 * Handle automated email sequences, campaign tracking, and personalization
 */

import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface EmailCampaign {
  id: string;
  name: string;
  trigger: "signup" | "first-app" | "first-deployment" | "milestone" | "churn-risk";
  sequence: EmailSequenceStep[];
  active: boolean;
  createdAt: Date;
}

interface EmailSequenceStep {
  id: string;
  delayHours: number;
  subject: string;
  template: string;
  personalizationTokens: string[];
}

interface UserCampaignStatus {
  userId: string;
  campaignId: string;
  currentStep: number;
  completedAt?: Date;
  skipped: boolean;
  emailsSent: number;
  lastEmailAt?: Date;
}

interface CampaignMetrics {
  campaignId: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

// In-memory storage (in production, use database)
const campaigns = new Map<string, EmailCampaign>();
const userCampaignStatus = new Map<string, UserCampaignStatus[]>();
const campaignMetrics = new Map<string, CampaignMetrics>();

// Pre-defined campaigns
const PREDEFINED_CAMPAIGNS: EmailCampaign[] = [
  {
    id: "welcome-sequence",
    name: "Welcome Sequence",
    trigger: "signup",
    sequence: [
      {
        id: "welcome-1",
        delayHours: 0,
        subject: "Welcome to AppStudio! 🚀",
        template: "welcome",
        personalizationTokens: ["firstName", "email"],
      },
      {
        id: "welcome-2",
        delayHours: 24,
        subject: "Your First App Awaits - Here's How to Get Started",
        template: "getting-started",
        personalizationTokens: ["firstName", "planName"],
      },
      {
        id: "welcome-3",
        delayHours: 72,
        subject: "Success Stories: How Others Built Their Apps",
        template: "success-stories",
        personalizationTokens: ["firstName"],
      },
    ],
    active: true,
    createdAt: new Date(),
  },
  {
    id: "first-app-sequence",
    name: "First App Sequence",
    trigger: "first-app",
    sequence: [
      {
        id: "first-app-1",
        delayHours: 0,
        subject: "Congratulations on Your First App! 🎉",
        template: "first-app-congratulations",
        personalizationTokens: ["firstName", "appName"],
      },
      {
        id: "first-app-2",
        delayHours: 24,
        subject: "Next Steps: Deploy Your App to Vercel",
        template: "deployment-guide",
        personalizationTokens: ["firstName", "appName"],
      },
      {
        id: "first-app-3",
        delayHours: 48,
        subject: "Connect GitHub for Automatic Updates",
        template: "github-integration",
        personalizationTokens: ["firstName"],
      },
    ],
    active: true,
    createdAt: new Date(),
  },
  {
    id: "first-deployment-sequence",
    name: "First Deployment Sequence",
    trigger: "first-deployment",
    sequence: [
      {
        id: "deployment-1",
        delayHours: 0,
        subject: "Your App is Live! 🌐",
        template: "deployment-success",
        personalizationTokens: ["firstName", "appName", "deploymentUrl"],
      },
      {
        id: "deployment-2",
        delayHours: 24,
        subject: "Optimize Your App's Performance",
        template: "performance-tips",
        personalizationTokens: ["firstName"],
      },
      {
        id: "deployment-3",
        delayHours: 72,
        subject: "Upgrade to Professional for Advanced Features",
        template: "upgrade-offer",
        personalizationTokens: ["firstName", "currentPlan", "upgradePlan"],
      },
    ],
    active: true,
    createdAt: new Date(),
  },
  {
    id: "milestone-sequence",
    name: "Milestone Sequence",
    trigger: "milestone",
    sequence: [
      {
        id: "milestone-1",
        delayHours: 0,
        subject: "You've Generated 10 Apps! 🏆",
        template: "milestone-10-apps",
        personalizationTokens: ["firstName", "appsCount"],
      },
      {
        id: "milestone-2",
        delayHours: 24,
        subject: "Exclusive Offer: Upgrade to Professional",
        template: "milestone-upgrade",
        personalizationTokens: ["firstName", "discount"],
      },
    ],
    active: true,
    createdAt: new Date(),
  },
  {
    id: "churn-prevention-sequence",
    name: "Churn Prevention Sequence",
    trigger: "churn-risk",
    sequence: [
      {
        id: "churn-1",
        delayHours: 0,
        subject: "We Miss You! Come Back to AppStudio",
        template: "churn-prevention",
        personalizationTokens: ["firstName", "daysSinceLogin"],
      },
      {
        id: "churn-2",
        delayHours: 48,
        subject: "Exclusive Offer: 50% Off Your Next Month",
        template: "churn-discount",
        personalizationTokens: ["firstName", "discount"],
      },
      {
        id: "churn-3",
        delayHours: 96,
        subject: "Last Chance: Your Special Offer Expires Soon",
        template: "churn-final",
        personalizationTokens: ["firstName"],
      },
    ],
    active: true,
    createdAt: new Date(),
  },
];

// Initialize predefined campaigns
PREDEFINED_CAMPAIGNS.forEach((campaign) => {
  campaigns.set(campaign.id, campaign);
  campaignMetrics.set(campaign.id, {
    campaignId: campaign.id,
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    unsubscribed: 0,
    openRate: 0,
    clickRate: 0,
    conversionRate: 0,
  });
});

export const emailCampaignsRouter = router({
  /**
   * Get all campaigns
   */
  getAllCampaigns: protectedProcedure.query(async () => {
    try {
      const allCampaigns = Array.from(campaigns.values());
      const metrics = Array.from(campaignMetrics.values());

      return {
        campaigns: allCampaigns.map((campaign) => {
          const metric = metrics.find((m) => m.campaignId === campaign.id);
          return {
            ...campaign,
            metrics: metric,
          };
        }),
      };
    } catch (error) {
      throw new Error(
        `Failed to get campaigns: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get campaign details
   */
  getCampaignDetails: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const campaign = campaigns.get(input.campaignId);

        if (!campaign) {
          throw new Error("Campaign not found");
        }

        const metrics = campaignMetrics.get(input.campaignId);

        return {
          campaign,
          metrics,
        };
      } catch (error) {
        throw new Error(
          `Failed to get campaign details: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get user campaign status
   */
  getUserCampaignStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = String(ctx.user?.id);
      const statuses = userCampaignStatus.get(userId) || [];

      return {
        campaigns: statuses.map((status) => {
          const campaign = campaigns.get(status.campaignId);
          return {
            ...status,
            campaign,
          };
        }),
      };
    } catch (error) {
      throw new Error(
        `Failed to get user campaign status: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Trigger campaign for user
   */
  triggerCampaign: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        personalizationData: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id);
        const campaign = campaigns.get(input.campaignId);

        if (!campaign) {
          throw new Error("Campaign not found");
        }

        const userStatuses = userCampaignStatus.get(userId) || [];

        // Check if user already has this campaign active
        const existingStatus = userStatuses.find((s) => s.campaignId === input.campaignId);

        if (!existingStatus) {
          const newStatus: UserCampaignStatus = {
            userId,
            campaignId: input.campaignId,
            currentStep: 0,
            skipped: false,
            emailsSent: 1,
            lastEmailAt: new Date(),
          };

          userStatuses.push(newStatus);
          userCampaignStatus.set(userId, userStatuses);

          // Update metrics
          const metrics = campaignMetrics.get(input.campaignId);
          if (metrics) {
            metrics.sent += 1;
          }

          // In production, send actual email
          console.log(
            `[Email] Campaign "${campaign.name}" triggered for user ${userId}`,
            input.personalizationData
          );
        }

        return {
          success: true,
          message: `Campaign "${campaign.name}" triggered`,
        };
      } catch (error) {
        throw new Error(
          `Failed to trigger campaign: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Mark email as opened
   */
  markEmailAsOpened: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const metrics = campaignMetrics.get(input.campaignId);

        if (metrics) {
          metrics.opened += 1;
          metrics.openRate = (metrics.opened / metrics.sent) * 100;
        }

        console.log(`[Email] Campaign ${input.campaignId} opened by user ${input.userId}`);

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to mark email as opened: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Mark email link as clicked
   */
  markEmailLinkClicked: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        userId: z.string(),
        linkId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const metrics = campaignMetrics.get(input.campaignId);

        if (metrics) {
          metrics.clicked += 1;
          metrics.clickRate = (metrics.clicked / metrics.sent) * 100;
        }

        console.log(
          `[Email] Campaign ${input.campaignId} link ${input.linkId} clicked by user ${input.userId}`
        );

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to mark link as clicked: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get campaign performance
   */
  getCampaignPerformance: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const metrics = campaignMetrics.get(input.campaignId);

        if (!metrics) {
          throw new Error("Campaign metrics not found");
        }

        return metrics;
      } catch (error) {
        throw new Error(
          `Failed to get campaign performance: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get all campaign performance
   */
  getAllCampaignPerformance: protectedProcedure.query(async () => {
    try {
      const allMetrics = Array.from(campaignMetrics.values());

      return {
        metrics: allMetrics,
        totalSent: allMetrics.reduce((sum, m) => sum + m.sent, 0),
        totalOpened: allMetrics.reduce((sum, m) => sum + m.opened, 0),
        totalClicked: allMetrics.reduce((sum, m) => sum + m.clicked, 0),
        totalConverted: allMetrics.reduce((sum, m) => sum + m.converted, 0),
        averageOpenRate: allMetrics.length > 0 ? allMetrics.reduce((sum, m) => sum + m.openRate, 0) / allMetrics.length : 0,
        averageClickRate: allMetrics.length > 0 ? allMetrics.reduce((sum, m) => sum + m.clickRate, 0) / allMetrics.length : 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get campaign performance: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),
});
