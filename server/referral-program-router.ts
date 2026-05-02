/**
 * Referral Program Router
 * Manage referrals, commissions, and payouts
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface ReferralLink {
  id: string;
  referrerId: string;
  code: string;
  url: string;
  createdAt: string;
  status: "active" | "inactive";
  clicks: number;
  conversions: number;
  totalCommission: number;
}

interface ReferredCustomer {
  id: string;
  referralCode: string;
  referrerId: string;
  customerId: string;
  tier: string;
  mrr: number;
  status: "active" | "cancelled";
  signupDate: string;
  cancelledDate?: string;
}

interface Commission {
  id: string;
  referrerId: string;
  referredCustomerId: string;
  amount: number;
  rate: number;
  period: string;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  paidAt?: string;
}

interface Payout {
  id: string;
  referrerId: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  bankAccount: string;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
}

// In-memory storage (in production, use database)
const referralLinks = new Map<string, ReferralLink>();
const referredCustomers = new Map<string, ReferredCustomer>();
const commissions = new Map<string, Commission>();
const payouts = new Map<string, Payout>();

// Commission rates by tier
const COMMISSION_RATES = {
  starter: 0.2, // 20% of monthly revenue
  professional: 0.2,
  enterprise: 0.15,
};

export const referralProgramRouter = router({
  /**
   * Create referral link
   */
  createReferralLink: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const code = `REF_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const url = `${process.env.VITE_FRONTEND_URL || "https://appstudio.example.com"}?ref=${code}`;

      const link: ReferralLink = {
        id: `link_${Date.now()}`,
        referrerId: String(ctx.user?.id),
        code,
        url,
        createdAt: new Date().toISOString(),
        status: "active",
        clicks: 0,
        conversions: 0,
        totalCommission: 0,
      };

      referralLinks.set(code, link);

      return {
        success: true,
        link,
      };
    } catch (error) {
      throw new Error(
        `Failed to create referral link: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get referral links
   */
  getReferralLinks: protectedProcedure.query(async ({ ctx }) => {
    try {
      const links = Array.from(referralLinks.values()).filter(
        (l) => l.referrerId === String(ctx.user?.id)
      );

      return {
        links,
        total: links.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to get referral links: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Track referral click
   */
  trackReferralClick: protectedProcedure
    .input(
      z.object({
        code: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const link = referralLinks.get(input.code);

        if (!link) {
          throw new Error("Invalid referral code");
        }

        link.clicks += 1;
        referralLinks.set(input.code, link);

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to track referral click: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Record referral conversion
   */
  recordReferralConversion: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        customerId: z.string(),
        tier: z.enum(["starter", "professional", "enterprise"]),
        mrr: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const link = referralLinks.get(input.code);

        if (!link) {
          throw new Error("Invalid referral code");
        }

        // Record referred customer
        const referredCustomer: ReferredCustomer = {
          id: `ref_cust_${Date.now()}`,
          referralCode: input.code,
          referrerId: link.referrerId,
          customerId: input.customerId,
          tier: input.tier,
          mrr: input.mrr,
          status: "active",
          signupDate: new Date().toISOString(),
        };

        referredCustomers.set(referredCustomer.id, referredCustomer);

        // Create commission record
        const rate = COMMISSION_RATES[input.tier as keyof typeof COMMISSION_RATES] || 0.2;
        const commissionAmount = input.mrr * rate;

        const commission: Commission = {
          id: `comm_${Date.now()}`,
          referrerId: link.referrerId,
          referredCustomerId: referredCustomer.id,
          amount: commissionAmount,
          rate,
          period: new Date().toISOString().substring(0, 7),
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        commissions.set(commission.id, commission);

        // Update link stats
        link.conversions += 1;
        link.totalCommission += commissionAmount;
        referralLinks.set(input.code, link);

        return {
          success: true,
          commission,
        };
      } catch (error) {
        throw new Error(
          `Failed to record referral conversion: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get referral stats
   */
  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userLinks = Array.from(referralLinks.values()).filter(
        (l) => l.referrerId === String(ctx.user?.id)
      );

      const userCommissions = Array.from(commissions.values()).filter(
        (c) => c.referrerId === String(ctx.user?.id)
      );

      const totalClicks = userLinks.reduce((sum, l) => sum + l.clicks, 0);
      const totalConversions = userLinks.reduce((sum, l) => sum + l.conversions, 0);
      const conversionRate =
        totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0";

      const pendingCommissions = userCommissions
        .filter((c) => c.status === "pending")
        .reduce((sum, c) => sum + c.amount, 0);

      const paidCommissions = userCommissions
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + c.amount, 0);

      const totalCommissions = pendingCommissions + paidCommissions;

      return {
        stats: {
          totalLinks: userLinks.length,
          totalClicks,
          totalConversions,
          conversionRate: parseFloat(conversionRate),
          pendingCommissions: parseFloat(pendingCommissions.toFixed(2)),
          paidCommissions: parseFloat(paidCommissions.toFixed(2)),
          totalCommissions: parseFloat(totalCommissions.toFixed(2)),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get referral stats: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get commissions
   */
  getCommissions: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "paid", "cancelled"]).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        let userCommissions = Array.from(commissions.values()).filter(
          (c) => c.referrerId === String(ctx.user?.id)
        );

        if (input.status) {
          userCommissions = userCommissions.filter((c) => c.status === input.status);
        }

        return {
          commissions: userCommissions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, input.limit),
          total: userCommissions.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get commissions: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Request payout
   */
  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(100),
        bankAccount: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userCommissions = Array.from(commissions.values()).filter(
          (c) => c.referrerId === String(ctx.user?.id) && c.status === "pending"
        );

        const availableBalance = userCommissions.reduce((sum, c) => sum + c.amount, 0);

        if (input.amount > availableBalance) {
          throw new Error("Insufficient balance for payout");
        }

        const payout: Payout = {
          id: `payout_${Date.now()}`,
          referrerId: String(ctx.user?.id),
          amount: input.amount,
          status: "pending",
          bankAccount: input.bankAccount,
          createdAt: new Date().toISOString(),
        };

        payouts.set(payout.id, payout);

        // Mark commissions as paid
        let amountRemaining = input.amount;
        for (const commission of userCommissions) {
          if (amountRemaining <= 0) break;

          const payAmount = Math.min(commission.amount, amountRemaining);
          commission.status = "paid";
          commission.paidAt = new Date().toISOString();
          amountRemaining -= payAmount;
        }

        return {
          success: true,
          payout,
        };
      } catch (error) {
        throw new Error(
          `Failed to request payout: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get payouts
   */
  getPayouts: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userPayouts = Array.from(payouts.values()).filter(
        (p) => p.referrerId === String(ctx.user?.id)
      );

      return {
        payouts: userPayouts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        total: userPayouts.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to get payouts: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get referred customers
   */
  getReferredCustomers: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userReferrals = Array.from(referredCustomers.values()).filter(
        (r) => r.referrerId === String(ctx.user?.id)
      );

      const activeCustomers = userReferrals.filter((r) => r.status === "active");
      const cancelledCustomers = userReferrals.filter((r) => r.status === "cancelled");

      const totalMRR = activeCustomers.reduce((sum, r) => sum + r.mrr, 0);

      return {
        customers: userReferrals,
        summary: {
          total: userReferrals.length,
          active: activeCustomers.length,
          cancelled: cancelledCustomers.length,
          totalMRR: parseFloat(totalMRR.toFixed(2)),
          avgMRRPerCustomer: activeCustomers.length > 0
            ? parseFloat((totalMRR / activeCustomers.length).toFixed(2))
            : 0,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get referred customers: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get referral leaderboard
   */
  getReferralLeaderboard: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const referrerStats = new Map<
          string,
          {
            referrerId: string;
            totalCommissions: number;
            conversions: number;
            activeCustomers: number;
          }
        >();

        // Aggregate stats by referrer
        for (const commission of Array.from(commissions.values())) {
          if (!referrerStats.has(commission.referrerId)) {
            referrerStats.set(commission.referrerId, {
              referrerId: commission.referrerId,
              totalCommissions: 0,
              conversions: 0,
              activeCustomers: 0,
            });
          }

          const stats = referrerStats.get(commission.referrerId)!;
          if (commission.status === "paid") {
            stats.totalCommissions += commission.amount;
          }
        }

        for (const customer of Array.from(referredCustomers.values())) {
          if (customer.status === "active") {
            const stats = referrerStats.get(customer.referrerId);
            if (stats) {
              stats.activeCustomers += 1;
              stats.conversions += 1;
            }
          }
        }

        const leaderboard = Array.from(referrerStats.values())
          .sort((a, b) => b.totalCommissions - a.totalCommissions)
          .slice(0, input.limit);

        return {
          leaderboard,
          total: referrerStats.size,
        };
      } catch (error) {
        throw new Error(
          `Failed to get referral leaderboard: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
