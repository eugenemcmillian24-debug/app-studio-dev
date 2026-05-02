import React, { useState } from "react";
import { Check, X, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";

interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  limitations: string[];
  cta: string;
  ctaUrl?: string;
  highlighted?: boolean;
  badge?: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Basic",
    price: 3.99,
    description: "Perfect for trying AppStudio",
    features: [
      "1 app generation per month",
      "Basic GitHub integration",
      "Vercel deployment",
      "Community support",
      "Standard features",
      "Email notifications",
    ],
    limitations: [
      "Limited to 1 project",
      "No team collaboration",
      "No deployment monitoring",
      "No audit logs",
      "No custom domains",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Starter",
    price: 29,
    description: "For individual developers",
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
    limitations: [
      "1 environment only",
      "No approval workflows",
      "No audit logging",
      "No cost tracking",
      "Email support only",
    ],
    cta: "Get Started",
  },
  {
    name: "Professional",
    price: 99,
    description: "For growing teams",
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
    limitations: [
      "No SLA monitoring",
      "No compliance reporting",
      "No dedicated support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    badge: "Most Popular",
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
      "Custom integrations",
    ],
    limitations: [],
    cta: "Contact Sales",
  },
];

const ADD_ONS = [
  {
    name: "Advanced Compliance",
    price: 79,
    description: "SOC 2, HIPAA, PCI compliance reporting",
  },
  {
    name: "Custom Integrations",
    price: 199,
    description: "Slack, Teams, Jira, Linear integrations",
  },
  {
    name: "Dedicated Support",
    price: 299,
    description: "1-hour response time, dedicated Slack channel",
  },
  {
    name: "Team Training",
    price: 499,
    description: "Custom onboarding and training sessions",
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

  const handleCTA = (tier: PricingTier) => {
    if (tier.name === "Enterprise") {
      window.location.href = "mailto:sales@appstudio.com";
    } else {
      window.location.href = getLoginUrl("/studio");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Choose the perfect plan for your team. All plans include a 14-day free trial.
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
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {PRICING_TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={`relative flex flex-col transition-all ${
                tier.highlighted ? "md:scale-105 border-primary shadow-xl" : ""
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                {/* Tier Header */}
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{tier.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    ${getPrice(tier.price)}
                  </span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full mb-8"
                  variant={tier.highlighted ? "default" : "outline"}
                  onClick={() => handleCTA(tier)}
                >
                  {tier.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {/* Features */}
                <div className="space-y-3 mb-8 flex-1">
                  <p className="font-semibold text-xs text-muted-foreground uppercase">
                    What's included:
                  </p>
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limitations */}
                {tier.limitations.length > 0 && (
                  <div className="space-y-3 pt-6 border-t">
                    <p className="font-semibold text-xs text-muted-foreground uppercase">
                      Not included:
                    </p>
                    {tier.limitations.map((limitation, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
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

        {/* Add-ons Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Premium Add-ons</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {ADD_ONS.map((addon) => (
              <Card key={addon.name} className="p-6">
                <h3 className="font-semibold mb-2">{addon.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{addon.description}</p>
                <div className="text-2xl font-bold mb-4">
                  ${addon.price}
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  Add to Plan
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  {PRICING_TIERS.map((tier) => (
                    <th key={tier.name} className="text-center py-4 px-4 font-semibold">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "App Generations", basic: "1/month", starter: "Unlimited", professional: "Unlimited", enterprise: "Unlimited" },
                  { feature: "GitHub Integration", basic: "Basic", starter: "Full", professional: "Full", enterprise: "Full" },
                  { feature: "Vercel Projects", basic: "1", starter: "1", professional: "5", enterprise: "Unlimited" },
                  { feature: "Team Members", basic: "1", starter: "3", professional: "15", enterprise: "Unlimited" },
                  { feature: "Deployments/Month", basic: "10", starter: "100", professional: "1,000", enterprise: "Unlimited" },
                  { feature: "Environments", basic: "1", starter: "1", professional: "3", enterprise: "Unlimited" },
                  { feature: "Deployment Monitoring", basic: "Basic", starter: "Basic", professional: "Advanced", enterprise: "Advanced" },
                  { feature: "Audit Logs", basic: "None", starter: "None", professional: "30 days", enterprise: "1 year" },
                  { feature: "RBAC", basic: "None", starter: "Basic", professional: "Advanced", enterprise: "Advanced" },
                  { feature: "Approval Workflows", basic: "No", starter: "No", professional: "Yes", enterprise: "Yes" },
                  { feature: "Support", basic: "Community", starter: "Email", professional: "Priority", enterprise: "24/7 Dedicated" },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="text-center py-4 px-4">{row.basic}</td>
                    <td className="text-center py-4 px-4">{row.starter}</td>
                    <td className="text-center py-4 px-4 bg-primary/5">{row.professional}</td>
                    <td className="text-center py-4 px-4">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">Can I change my plan anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                immediately, and we'll prorate your billing accordingly.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">What happens if I exceed my usage limits?</h3>
              <p className="text-muted-foreground">
                We'll notify you when you're approaching your limits. You can either upgrade
                your plan or pay for overage charges at our standard rates.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                Yes! All plans come with a 14-day free trial. No credit card required to get started.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">Do you offer discounts for annual billing?</h3>
              <p className="text-muted-foreground">
                Yes! Annual billing comes with a 20% discount. Contact our sales team for
                enterprise volume discounts.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express) and wire
                transfers for enterprise customers.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers using AppStudio to deploy faster
          </p>
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => window.location.href = getLoginUrl("/studio")}
          >
            Start Your Free Trial
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
