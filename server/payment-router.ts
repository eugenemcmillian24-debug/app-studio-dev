/**
 * Stripe payment router for AppStudio subscriptions.
 * Handles checkout sessions, webhooks, and plan management.
 */

import Stripe from "stripe";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getSubscriptionByUserId, upsertSubscription, getMonthlyUsage } from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// ─── Pricing Plans ────────────────────────────────────────────────────────────

export const PRICING_PLANS = {
  free: { name: "Free", scaffolds: 0, price: 0 },
  starter: { name: "Starter", scaffolds: 10, price: 900 }, // $9/month in cents
  pro: { name: "Pro", scaffolds: 999, price: 2900 }, // $29/month in cents
} as const;

// ─── Payment Router ───────────────────────────────────────────────────────────

export const paymentRouter = router({
  /**
   * Get current user's subscription and usage.
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await getSubscriptionByUserId(ctx.user.id);
    
    // Get current month usage
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const usage = await getMonthlyUsage(ctx.user.id, month, year);

    const plan = (subscription?.plan || "free") as keyof typeof PRICING_PLANS;
    const planInfo = PRICING_PLANS[plan];

    return {
      plan,
      planName: planInfo.name,
      scaffoldsRemaining: Math.max(0, planInfo.scaffolds - (usage?.scaffoldsGenerated || 0)),
      scaffoldsUsed: usage?.scaffoldsGenerated || 0,
      scaffoldsLimit: planInfo.scaffolds,
      stripeCustomerId: subscription?.stripeCustomerId,
    };
  }),

  /**
   * Create a Stripe checkout session for upgrading to a plan.
   */
  createCheckout: protectedProcedure
    .input(z.enum(["starter", "pro"]))
    .mutation(async ({ ctx, input: plan }) => {
      const subscription = await getSubscriptionByUserId(ctx.user.id);
      const planInfo = PRICING_PLANS[plan];

      // Create or get Stripe customer
      let customerId = subscription?.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: ctx.user.email || undefined,
          name: ctx.user.name || undefined,
          metadata: { userId: ctx.user.id.toString() },
        });
        customerId = customer.id;
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${planInfo.name} Plan`,
                description: `${planInfo.scaffolds === 999 ? "Unlimited" : planInfo.scaffolds} scaffolds per month`,
              },
              unit_amount: planInfo.price,
              recurring: {
                interval: "month",
                interval_count: 1,
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${ctx.req.headers.origin || "http://localhost:3000"}/studio?payment=success`,
        cancel_url: `${ctx.req.headers.origin || "http://localhost:3000"}/pricing?payment=cancelled`,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          userId: ctx.user.id.toString(),
          plan,
        },
      } as any);

      // Save customer ID if new
      if (!subscription) {
        await upsertSubscription({
          userId: ctx.user.id,
          stripeCustomerId: customerId,
          plan: "free",
        });
      }

      return { checkoutUrl: session.url };
    }),

  /**
   * Get list of pricing plans.
   */
  getPricing: publicProcedure.query(() => {
    return Object.entries(PRICING_PLANS).map(([key, value]) => ({
      id: key,
      ...value,
    }));
  }),
});

// ─── Webhook Handler ──────────────────────────────────────────────────────────

export async function handleStripeWebhook(
  body: string,
  signature: string
): Promise<{ verified: boolean; message: string }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return { verified: false, message: "Webhook secret not configured" };
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return { verified: true, message: "Test event verified" };
    }

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.client_reference_id || "0");
      const plan = (session.metadata?.plan || "starter") as keyof typeof PRICING_PLANS;

      if (userId > 0) {
        await upsertSubscription({
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          plan,
        });
        console.log(`[Payment] User ${userId} upgraded to ${plan}`);
      }
    }

    // Handle invoice.payment_succeeded
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Payment] Invoice ${invoice.id} paid for customer ${invoice.customer}`);
    }

    // Handle customer.subscription.deleted
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`[Payment] Subscription ${subscription.id} cancelled`);
      // Optionally downgrade user to free plan
    }

    return { verified: true, message: "Event processed" };
  } catch (error) {
    console.error("[Webhook] Verification failed:", error);
    return { verified: false, message: "Webhook verification failed" };
  }
}
