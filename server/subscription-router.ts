/**
 * Subscription Management Router
 * Handle subscriptions, billing, and feature access control
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

type SubscriptionTier = "basic" | "starter" | "professional" | "enterprise";

interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  billingCycle: "monthly" | "annual";
  features: string[];
  limits: Record<string, number>;
  stripePriceId: string;
}

interface UserSubscription {
  id: string;
  projectId: string;
  userId: string;
  tier: SubscriptionTier;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: "active" | "cancelled" | "past_due";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface UsageData {
  deployments: number;
  apiCalls: number;
  auditLogStorage: number;
  teamMembers: number;
  environments: number;
  customIntegrations: number;
}

// Subscription plans configuration
const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  basic: {
    tier: "basic",
    name: "Basic",
    price: 3.99,
    billingCycle: "monthly",
    features: [
      "1 app generation per month",
      "Basic GitHub integration",
      "Vercel deployment",
      "Community support",
      "Standard features",
      "Email notifications",
    ],
    limits: {
      appGenerations: 1,
      deployments: 10,
      environments: 1,
      teamMembers: 1,
      projects: 1,
      apiCalls: 1000,
      auditLogRetention: 0,
    },
    stripePriceId: process.env.VITE_STRIPE_BASIC_PRICE_ID || "",
  },
  starter: {
    tier: "starter",
    name: "Starter",
    price: 29,
    billingCycle: "monthly",
    features: [
      "Unlimited app generations",
      "Full GitHub integration",
      "Single Vercel project",
      "Up to 3 team members",
      "Basic deployment monitoring",
      "7-day deployment history",
      "Email notifications",
      "100 deployments/month",
      "GitHub Actions support",
    ],
    limits: {
      appGenerations: 999999,
      deployments: 100,
      environments: 1,
      teamMembers: 3,
      projects: 1,
      apiCalls: 10000,
      auditLogRetention: 7,
    },
    stripePriceId: process.env.VITE_STRIPE_STARTER_PRICE_ID || "",
  },
  professional: {
    tier: "professional",
    name: "Professional",
    price: 99,
    billingCycle: "monthly",
    features: [
      "Everything in Starter",
      "Up to 5 Vercel projects",
      "Up to 15 team members",
      "Advanced deployment monitoring",
      "90-day deployment history",
      "Slack/Discord notifications",
      "GitHub Actions workflows",
      "Advanced RBAC",
      "Deployment approval workflows",
      "30-day audit logs",
      "Cost tracking & budget alerts",
      "Performance metrics dashboard",
      "1,000 deployments/month",
      "Up to 3 environments",
      "Automated rollback",
      "Priority support",
    ],
    limits: {
      appGenerations: 999999,
      deployments: 1000,
      environments: 3,
      teamMembers: 15,
      projects: 5,
      apiCalls: 100000,
      auditLogRetention: 30,
      approvalLevels: 2,
    },
    stripePriceId: process.env.VITE_STRIPE_PRO_PRICE_ID || "",
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    price: 299,
    billingCycle: "monthly",
    features: [
      "Everything in Professional",
      "Unlimited Vercel projects",
      "Unlimited team members",
      "Unlimited deployments",
      "Unlimited environments",
      "Advanced RBAC with custom roles",
      "Multi-level approval workflows",
      "1-year audit logs",
      "Advanced compliance reporting",
      "SLA monitoring & tracking",
      "Cost optimization recommendations",
      "Real-time health monitoring",
      "Automated rollback on test failures",
      "Custom webhooks & integrations",
      "Dedicated account manager",
      "24/7 phone & email support",
      "Custom training & onboarding",
      "Advanced security features",
    ],
    limits: {
      appGenerations: 999999,
      deployments: 999999,
      environments: 999999,
      teamMembers: 999999,
      projects: 999999,
      apiCalls: 999999,
      auditLogRetention: 365,
      approvalLevels: 5,
    },
    stripePriceId: "enterprise_custom",
  },
};

// In-memory storage (in production, use database)
const subscriptions = new Map<string, UserSubscription>();
const usage = new Map<string, UsageData>();

export const subscriptionRouter = router({
  /**
   * Get available plans
   */
  getPlans: protectedProcedure.query(async () => {
    try {
      return {
        plans: Object.values(SUBSCRIPTION_PLANS),
      };
    } catch (error) {
      throw new Error(
        `Failed to get plans: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get current subscription
   */
  getCurrentSubscription: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const subscription = subscriptions.get(input.projectId);

        if (!subscription) {
          return {
            subscription: null,
            tier: "basic",
            status: "none",
          };
        }

        const plan = SUBSCRIPTION_PLANS[subscription.tier];

        return {
          subscription,
          plan,
          status: subscription.status,
        };
      } catch (error) {
        throw new Error(
          `Failed to get subscription: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Create subscription (checkout)
   */
  createSubscription: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        tier: z.enum(["basic", "starter", "professional", "enterprise"]),
        billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const plan = SUBSCRIPTION_PLANS[input.tier];

        if (!plan.stripePriceId) {
          throw new Error("Price not configured for this tier");
        }

        // Create or get Stripe customer
        let customerId = "";
        const existingSub = subscriptions.get(input.projectId);

        if (existingSub?.stripeCustomerId) {
          customerId = existingSub.stripeCustomerId;
        } else {
          const customer = await stripe.customers.create({
            email: ctx.user?.email || "unknown@example.com",
            metadata: {
              projectId: input.projectId,
              userId: String(ctx.user?.id),
            },
          });
          customerId = customer.id;
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [
            {
              price: plan.stripePriceId,
            },
          ],
          metadata: {
            projectId: input.projectId,
            tier: input.tier,
          },
        });

        // Store subscription
        const stripeData = subscription as unknown as { current_period_start: number; current_period_end: number };
        const userSub: UserSubscription = {
          id: `sub_${Date.now()}`,
          projectId: input.projectId,
          userId: String(ctx.user?.id),
          tier: input.tier,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          status: "active",
          currentPeriodStart: new Date(stripeData.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(stripeData.current_period_end * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        subscriptions.set(input.projectId, userSub);

        return {
          success: true,
          subscription: userSub,
        };
      } catch (error) {
        throw new Error(
          `Failed to create subscription: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Upgrade subscription
   */
  upgradeSubscription: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        newTier: z.enum(["starter", "professional", "enterprise"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const subscription = subscriptions.get(input.projectId);

        if (!subscription) {
          throw new Error("No active subscription found");
        }

        const newPlan = SUBSCRIPTION_PLANS[input.newTier];

        if (!newPlan.stripePriceId) {
          throw new Error("Price not configured for this tier");
        }

        // Update Stripe subscription
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );

        const updatedSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            items: [
              {
                id: (stripeSubscription.items.data[0] as unknown as { id: string }).id,
                price: newPlan.stripePriceId,
              },
            ],
            proration_behavior: "create_prorations",
          }
        );

        // Update local subscription
        subscription.tier = input.newTier;
        const updatedData = updatedSubscription as unknown as { current_period_start: number; current_period_end: number };
        subscription.currentPeriodStart = new Date(updatedData.current_period_start * 1000).toISOString();
        subscription.currentPeriodEnd = new Date(updatedData.current_period_end * 1000).toISOString();
        subscription.updatedAt = new Date().toISOString();

        subscriptions.set(input.projectId, subscription);

        return {
          success: true,
          subscription,
        };
      } catch (error) {
        throw new Error(
          `Failed to upgrade subscription: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const subscription = subscriptions.get(input.projectId);

        if (!subscription) {
          throw new Error("No active subscription found");
        }

        // Cancel Stripe subscription
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

        // Update local subscription
        subscription.status = "cancelled";
        subscription.cancelledAt = new Date().toISOString();
        subscription.tier = "basic";
        subscription.updatedAt = new Date().toISOString();

        subscriptions.set(input.projectId, subscription);

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to cancel subscription: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Check feature access
   */
  hasFeatureAccess: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        feature: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const subscription = subscriptions.get(input.projectId);
        const tier = subscription?.tier || "basic";
        const plan = SUBSCRIPTION_PLANS[tier];

        const hasAccess = plan.features.includes(input.feature);

        return {
          hasAccess,
          tier,
          feature: input.feature,
        };
      } catch (error) {
        throw new Error(
          `Failed to check feature access: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Check usage limits
   */
  checkUsageLimit: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        metric: z.string(),
        currentUsage: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const subscription = subscriptions.get(input.projectId);
        const tier = subscription?.tier || "basic";
        const plan = SUBSCRIPTION_PLANS[tier];

        const limit = plan.limits[input.metric] || 0;
        const isWithinLimit = input.currentUsage < limit;
        const percentageUsed = (input.currentUsage / limit) * 100;

        return {
          isWithinLimit,
          limit,
          currentUsage: input.currentUsage,
          percentageUsed: parseFloat(percentageUsed.toFixed(2)),
          overage: Math.max(0, input.currentUsage - limit),
        };
      } catch (error) {
        throw new Error(
          `Failed to check usage limit: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Record usage
   */
  recordUsage: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        metric: z.string(),
        value: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const currentUsage = usage.get(input.projectId) || {
          deployments: 0,
          apiCalls: 0,
          auditLogStorage: 0,
          teamMembers: 0,
          environments: 0,
          customIntegrations: 0,
        };

        (currentUsage as unknown as Record<string, number>)[input.metric] = input.value;
        usage.set(input.projectId, currentUsage);

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to record usage: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get usage summary
   */
  getUsageSummary: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const subscription = subscriptions.get(input.projectId);
        const tier = subscription?.tier || "basic";
        const plan = SUBSCRIPTION_PLANS[tier];
        const currentUsage = usage.get(input.projectId) || {
          deployments: 0,
          apiCalls: 0,
          auditLogStorage: 0,
          teamMembers: 0,
          environments: 0,
          customIntegrations: 0,
        };

        const summary = {
          tier,
          plan: plan.name,
          usage: currentUsage,
          limits: plan.limits,
          metrics: Object.entries(currentUsage).map(([metric, value]) => ({
            metric,
            value,
            limit: plan.limits[metric] || 0,
            percentageUsed: plan.limits[metric]
              ? ((value / plan.limits[metric]) * 100).toFixed(2)
              : "0",
          })),
        };

        return summary;
      } catch (error) {
        throw new Error(
          `Failed to get usage summary: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get billing history
   */
  getBillingHistory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const subscription = subscriptions.get(input.projectId);

        if (!subscription) {
          return {
            invoices: [],
          };
        }

        const invoices = await stripe.invoices.list({
          customer: subscription.stripeCustomerId,
          limit: 12,
        });

        return {
          invoices: invoices.data.map((invoice) => ({
            id: invoice.id,
            number: invoice.number,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            date: new Date(invoice.created * 1000).toISOString(),
            status: invoice.status,
            pdfUrl: invoice.hosted_invoice_url || "",
          })),
        };
      } catch (error) {
        throw new Error(
          `Failed to get billing history: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Calculate overage charges
   */
  calculateOverageCharges: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const subscription = subscriptions.get(input.projectId);
        const tier = subscription?.tier || "basic";
        const plan = SUBSCRIPTION_PLANS[tier];
        const currentUsage = usage.get(input.projectId) || {
          deployments: 0,
          apiCalls: 0,
          auditLogStorage: 0,
          teamMembers: 0,
          environments: 0,
          customIntegrations: 0,
        };

        const overages = {
          deployments: Math.max(0, currentUsage.deployments - plan.limits.deployments) * 0.1,
          apiCalls: Math.max(0, currentUsage.apiCalls - plan.limits.apiCalls) * 0.001,
          auditLogStorage: Math.max(0, currentUsage.auditLogStorage - 100) * 0.05,
          customIntegrations: Math.max(0, currentUsage.customIntegrations - 0) * 50,
        };

        const totalOverage = Object.values(overages).reduce((a, b) => a + b, 0);

        return {
          overages,
          totalOverage: parseFloat(totalOverage.toFixed(2)),
          estimatedMonthlyTotal: plan.price + totalOverage,
        };
      } catch (error) {
        throw new Error(
          `Failed to calculate overage charges: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
