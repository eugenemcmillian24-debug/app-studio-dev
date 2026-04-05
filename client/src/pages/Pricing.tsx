import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Check, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

  // Check for payment success/cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast.success("Payment successful! Your plan has been upgraded.");
      window.history.replaceState({}, "", "/pricing");
    } else if (params.get("payment") === "cancelled") {
      toast.error("Payment cancelled.");
      window.history.replaceState({}, "", "/pricing");
    }
  }, []);

  const subscription = trpc.payment.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createCheckout = trpc.payment.createCheckout.useMutation();
  const pricing = trpc.payment.getPricing.useQuery();

  const handleUpgrade = async (plan: "starter" | "pro") => {
    if (!isAuthenticated) {
      toast.error("Please log in first");
      return;
    }

    setIsCheckingOut(plan);
    try {
      const result = await createCheckout.mutateAsync(plan);
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, "_blank");
        toast.success("Redirecting to checkout...");
      }
    } catch (error) {
      toast.error("Failed to create checkout session");
    } finally {
      setIsCheckingOut(null);
    }
  };

  if (!pricing.data) {
    return <div className="min-h-screen flex items-center justify-center">Loading pricing...</div>;
  }

  const plans = pricing.data;
  const currentPlan = subscription.data?.plan || "free";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-400">
            Generate unlimited full-stack apps. Choose the plan that fits your needs.
          </p>
        </div>

        {/* Current Plan Status */}
        {isAuthenticated && subscription.data && (
          <div className="mb-12 p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg text-center">
            <p className="text-slate-300">
              Current Plan: <span className="font-bold text-violet-400 capitalize">{currentPlan}</span>
              {subscription.data.scaffoldsRemaining > 0 && (
                <span className="ml-4 text-slate-400">
                  • {subscription.data.scaffoldsRemaining} scaffolds remaining this month
                </span>
              )}
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {plans.filter(p => p.id !== "free").map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isFree = false;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all ${
                  isCurrentPlan
                    ? "border-violet-500 bg-violet-500/5 ring-2 ring-violet-500"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-violet-500 text-white px-3 py-1 text-sm font-semibold">
                    Current
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Name */}
                  <h2 className="text-2xl font-bold text-white mb-2 capitalize flex items-center gap-2">
                    {plan.name}
                    {plan.id === "pro" && <Zap className="w-5 h-5 text-yellow-400" />}
                  </h2>

                  {/* Price */}
                  <div className="mb-6">
                    <p className="text-4xl font-bold text-white">
                      ${(plan.price / 100).toFixed(0)}
                    </p>
                    <p className="text-slate-400">/month</p>
                  </div>

                  {/* Scaffolds */}
                  <div className="mb-6 p-3 bg-slate-800/50 rounded">
                    <p className="text-slate-300">
                      <span className="font-bold text-white">
                        {plan.scaffolds === 999 ? "Unlimited" : plan.scaffolds}
                      </span>{" "}
                      scaffolds/month
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>Next.js + Supabase scaffolds</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>Vercel deployment ready</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>Multi-LLM generation</span>
                    </li>
                    {plan.id !== "free" && (
                      <>
                        <li className="flex items-center gap-3 text-slate-300">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span>Priority support</span>
                        </li>
                        {plan.id === "pro" && (
                          <>
                            <li className="flex items-center gap-3 text-slate-300">
                              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                              <span>Custom LLM providers</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                              <span>API access</span>
                            </li>
                          </>
                        )}
                      </>
                    )}
                  </ul>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <Button
                      disabled
                      className="w-full bg-violet-600 text-white cursor-not-allowed"
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.id as "starter" | "pro")}
                      disabled={isCheckingOut === plan.id}
                      className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white"
                    >
                      {isCheckingOut === plan.id ? "Processing..." : "Upgrade"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">FAQ</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-slate-400">
                Yes, you can cancel your subscription at any time. No long-term contracts.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-400">
                We accept all major credit cards via Stripe. Your payment information is secure and encrypted.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-slate-400">
                Yes, we offer 30-day money-back guarantee if you're not satisfied.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                What happens when I reach my monthly quota?
              </h3>
              <p className="text-slate-400">
                Your quota resets on the first day of each month. You can upgrade anytime to increase your limit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
