import { describe, it, expect, beforeAll } from "vitest";
import { getSubscriptionByUserId, upsertSubscription, getMonthlyUsage, incrementUsage } from "./db";
import { PRICING_PLANS } from "./payment-router";

describe("Payment System", () => {
  const testUserId = 9999;

  beforeAll(async () => {
    // Initialize test subscription
    await upsertSubscription({
      userId: testUserId,
      stripeCustomerId: `cus_test_${testUserId}`,
      plan: "starter",
    });
  });

  it("should get subscription by user ID", async () => {
    const sub = await getSubscriptionByUserId(testUserId);
    expect(sub).toBeDefined();
    expect(sub?.userId).toBe(testUserId);
    expect(sub?.plan).toBe("starter");
  });

  it("should track monthly usage", async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Increment usage
    await incrementUsage(testUserId, month, year);
    await incrementUsage(testUserId, month, year);

    const usage = await getMonthlyUsage(testUserId, month, year);
    expect(usage).toBeDefined();
    expect(usage?.scaffoldsGenerated).toBeGreaterThanOrEqual(2);
  });

  it("should have correct pricing plans", () => {
    expect(PRICING_PLANS.starter.scaffolds).toBe(10);
    expect(PRICING_PLANS.pro.scaffolds).toBe(999);
    expect(PRICING_PLANS.starter.price).toBe(900); // $9
    expect(PRICING_PLANS.pro.price).toBe(2900); // $29
  });

  it("should validate API keys are set", () => {
    // Check that at least one LLM provider key is configured
    const hasGroq = !!process.env.GROQ_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

    const hasAtLeastOne = hasGroq || hasGemini || hasOpenRouter;
    expect(hasAtLeastOne).toBe(true);

    console.log(`✓ LLM providers configured: Groq=${hasGroq}, Gemini=${hasGemini}, OpenRouter=${hasOpenRouter}`);
  });
});
