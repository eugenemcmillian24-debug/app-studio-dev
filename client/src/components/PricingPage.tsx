import React, { useState } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  limitations: string[];
  cta: string;
  highlighted?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: 29,
    description: "Perfect for individual developers",
    features: [
      "Basic GitHub integration",
      "Single Vercel project",
      "Up to 3 team members",
      "Basic deployment monitoring",
      "7-day deployment history",
      "Email notifications",
      "100 deployments/month",
    ],
    limitations: [
      "1 environment only",
      "No approval workflows",
      "No audit logging",
      "No cost tracking",
      "Community support",
    ],
    cta: "Get Started",
  },
  {
    name: "Professional",
    price: 99,
    description: "For growing teams and agencies",
    features: [
      "Full GitHub integration",
      "Up to 5 Vercel projects",
      "Up to 15 team members",
      "Advanced deployment monitoring",
      "90-day deployment history",
      "Slack/Discord notifications",
      "GitHub Actions integration",
      "Basic RBAC",
      "Deployment approval workflows",
      "30-day audit logs",
      "Cost tracking & budget alerts",
      "Performance metrics dashboard",
      "1,000 deployments/month",
      "Up to 3 environments",
      "Priority email support",
    ],
    limitations: [
      "No SLA monitoring",
      "No advanced rollback",
      "No compliance reporting",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: 299,
    description: "For large organizations",
    features: [
      "Everything in Professional",
      "Unlimited Vercel projects",
      "Unlimited team members",
      "Unlimited deployments",
      "Unlimited environments",
      "Advanced RBAC",
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
    ],
    limitations: [],
    cta: "Contact Sales",
  },
];

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedTier, setSelectedTier] = useState<string>("professional");

  const getPrice = (basePrice: number) => {
    if (billingCycle === "annual") {
      return Math.round(basePrice * 12 * 0.8); // 20% discount for annual
    }
    return basePrice;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Choose the perfect plan for your team
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                billingCycle === "annual"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500/20 text-green-700 px-2 py-1 rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PRICING_TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={`relative flex flex-col ${
                tier.highlighted ? "md:scale-105 border-primary shadow-xl" : ""
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8 flex-1 flex flex-col">
                {/* Tier Header */}
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-muted-foreground mb-6">{tier.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    ${getPrice(tier.price)}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full mb-8"
                  variant={tier.highlighted ? "default" : "outline"}
                  onClick={() => setSelectedTier(tier.name)}
                >
                  {tier.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {/* Features */}
                <div className="space-y-4 mb-8 flex-1">
                  <p className="font-semibold text-sm text-muted-foreground">
                    What's included:
                  </p>
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limitations */}
                {tier.limitations.length > 0 && (
                  <div className="space-y-4 pt-8 border-t">
                    <p className="font-semibold text-sm text-muted-foreground">
                      Not included:
                    </p>
                    {tier.limitations.map((limitation, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">
                          {limitation}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                immediately, and we'll prorate your billing accordingly.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">
                What happens if I exceed my usage limits?
              </h3>
              <p className="text-muted-foreground">
                We'll notify you when you're approaching your limits. You can either upgrade
                your plan or pay for overage charges at our standard rates.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">
                Is there a free trial?
              </h3>
              <p className="text-muted-foreground">
                Yes! Professional and Enterprise plans come with a 14-day free trial. No credit
                card required to get started.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">
                Do you offer discounts for annual billing?
              </h3>
              <p className="text-muted-foreground">
                Yes! Annual billing comes with a 20% discount. Contact our sales team for
                enterprise volume discounts.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express) and wire
                transfers for enterprise customers.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers using AppStudio to deploy faster
          </p>
          <Button size="lg" className="gap-2">
            Start Your Free Trial
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
