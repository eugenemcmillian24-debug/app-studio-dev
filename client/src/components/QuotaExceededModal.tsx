import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsage: number;
  monthlyLimit: number;
  currentPlan: "free" | "starter" | "pro";
}

export function QuotaExceededModal({
  isOpen,
  onClose,
  currentUsage,
  monthlyLimit,
  currentPlan,
}: QuotaExceededModalProps) {
  const [, navigate] = useLocation();

  if (!isOpen) return null;

  const usagePercent = Math.round((currentUsage / monthlyLimit) * 100);

  const plans = {
    free: { name: "Free", limit: 0, price: "$0", scaffolds: "0" },
    starter: { name: "Starter", limit: 10, price: "$9", scaffolds: "10" },
    pro: { name: "Pro", limit: 999, price: "$29", scaffolds: "Unlimited" },
  };

  const nextPlan = currentPlan === "free" ? "starter" : "pro";
  const nextPlanInfo = plans[nextPlan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10">
            <AlertCircle className="size-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Monthly Quota Exceeded</h2>
        </div>

        {/* Usage Info */}
        <div className="mb-6 p-4 rounded-xl bg-muted/50 border border-border/50">
          <p className="text-sm text-muted-foreground mb-2">Current Usage</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-foreground">{currentUsage}</span>
            <span className="text-muted-foreground">/ {monthlyLimit} scaffolds</span>
          </div>
          <div className="w-full h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{usagePercent}% of limit used</p>
        </div>

        {/* Plan Comparison */}
        <div className="mb-6 space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Upgrade to {nextPlanInfo.name}</p>
          <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground font-semibold">{nextPlanInfo.scaffolds} scaffolds/month</p>
                <p className="text-xs text-muted-foreground">{nextPlanInfo.price}/month</p>
              </div>
              <ArrowRight className="size-4 text-violet-400" />
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-muted-foreground mb-6">
          You've reached your monthly limit. Upgrade your plan to generate more scaffolds and unlock additional features.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            onClick={() => {
              navigate("/pricing");
              onClose();
            }}
            className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600"
          >
            View Plans
          </Button>
        </div>
      </div>
    </div>
  );
}
