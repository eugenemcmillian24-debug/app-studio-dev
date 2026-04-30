import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { referrals, apiQuotas } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const monetizationRouter = router({
  // Get referral code
  getReferralCode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, ctx.user?.id || 0))
      .limit(1);

    if (!referral) {
      const code = `ref_${ctx.user?.id}_${Math.random().toString(36).slice(2, 8)}`;
      await db.insert(referrals).values({
        referrerId: ctx.user?.id || 0,
        referralCode: code,
        status: "pending",
      });
      return { referralCode: code, earnings: 0 };
    }

    return {
      referralCode: referral.referralCode,
      earnings: referral.rewardCredits || 0,
      status: referral.status,
    };
  }),

  // Track referral activation
  activateReferral: protectedProcedure
    .input(z.object({ referralCode: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [referral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referralCode, input.referralCode))
        .limit(1);

      if (!referral) {
        throw new Error("Invalid referral code");
      }

      // Update referral status
      await db
        .update(referrals)
        .set({
          referredUserId: ctx.user?.id || 0,
          status: "activated",
          activatedAt: new Date(),
        })
        .where(eq(referrals.referralCode, input.referralCode));

      return { success: true, message: "Referral activated" };
    }),

  // Get usage-based billing estimate
  getUsageBasedBillingEstimate: protectedProcedure
    .input(
      z.object({
        generationsPerMonth: z.number(),
        filesPerGeneration: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const costPerGeneration = 0.5; // $0.50 per generation
      const costPerFile = 0.01; // $0.01 per file
      const totalCost =
        costPerGeneration * input.generationsPerMonth +
        costPerFile * input.filesPerGeneration * input.generationsPerMonth;

      return {
        generationsPerMonth: input.generationsPerMonth,
        filesPerGeneration: input.filesPerGeneration,
        costPerGeneration,
        costPerFile,
        estimatedMonthlyCost: totalCost,
        estimatedYearlyCost: totalCost * 12,
      };
    }),

  // Get credit system info
  getCreditSystemInfo: protectedProcedure.query(async () => {
    return {
      creditsPerGeneration: 1,
      creditsPerFile: 0.1,
      creditPackages: [
        { credits: 10, price: 5 },
        { credits: 50, price: 20 },
        { credits: 100, price: 35 },
        { credits: 500, price: 150 },
      ],
      bonusCredits: {
        referral: 10,
        firstGeneration: 5,
        monthlyBonus: 2,
      },
    };
  }),

  // Get API quota
  getAPIQuota: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [quota] = await db
      .select()
      .from(apiQuotas)
      .where(eq(apiQuotas.userId, ctx.user?.id || 0))
      .limit(1);

    if (!quota) {
      // Create default quota
      await db.insert(apiQuotas).values({
        userId: ctx.user?.id || 0,
        apiKey: `sk_${ctx.user?.id}_${Date.now()}`,
        requestsPerMinute: 60,
        requestsPerDay: 10000,
      });

      return {
        requestsPerMinute: 60,
        requestsPerDay: 10000,
        currentMinuteRequests: 0,
        currentDayRequests: 0,
      };
    }

    return {
      requestsPerMinute: quota.requestsPerMinute,
      requestsPerDay: quota.requestsPerDay,
      currentMinuteRequests: quota.currentMinuteRequests,
      currentDayRequests: quota.currentDayRequests,
      remainingMinute: quota.requestsPerMinute - quota.currentMinuteRequests,
      remainingDay: quota.requestsPerDay - quota.currentDayRequests,
    };
  }),

  // Upgrade quota
  upgradeQuota: protectedProcedure
    .input(
      z.object({
        requestsPerMinute: z.number().optional(),
        requestsPerDay: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [quota] = await db
        .select()
        .from(apiQuotas)
        .where(eq(apiQuotas.userId, ctx.user?.id || 0))
        .limit(1);

      if (quota) {
        await db
          .update(apiQuotas)
          .set({
            requestsPerMinute: input.requestsPerMinute || quota.requestsPerMinute,
            requestsPerDay: input.requestsPerDay || quota.requestsPerDay,
          })
          .where(eq(apiQuotas.userId, ctx.user?.id || 0));
      }

      return { success: true, message: "Quota upgraded" };
    }),

  // Get pricing plans
  getPricingPlans: protectedProcedure.query(async () => {
    return {
      plans: [
        {
          name: "Free",
          price: 0,
          generationsPerMonth: 0,
          features: ["Community support"],
        },
        {
          name: "Starter",
          price: 29,
          generationsPerMonth: 10,
          features: [
            "10 generations/month",
            "Email support",
            "Custom domains",
          ],
        },
        {
          name: "Pro",
          price: 99,
          generationsPerMonth: 999,
          features: [
            "Unlimited generations",
            "Priority support",
            "Team collaboration",
            "Advanced analytics",
          ],
        },
      ],
    };
  }),
});
