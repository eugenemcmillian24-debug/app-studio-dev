import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp } from "lucide-react";

interface QuotaStatus {
  plan: string;
  limits: { generationsPerMonth: number };
  usage: { generationsThisMonth: number };
  remaining: number;
  percentageUsed: number;
  resetDate: Date;
}

export function QuotaDisplay() {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demo - in production, call trpc.quotas.getQuotaStatus
    const mockQuota: QuotaStatus = {
      plan: "starter",
      limits: { generationsPerMonth: 10 },
      usage: { generationsThisMonth: 3 },
      remaining: 7,
      percentageUsed: 30,
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    };
    setQuota(mockQuota);
    setLoading(false);
  }, []);

  if (loading || !quota) {
    return <div className="text-sm text-gray-500">Loading quota...</div>;
  }

  const isNearLimit = quota.percentageUsed > 80;
  const isAtLimit = quota.percentageUsed >= 100;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Generation Quota
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Plan:</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold capitalize">
            {quota.plan}
          </span>
        </div>

        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {quota.usage.generationsThisMonth} / {quota.limits.generationsPerMonth} used
            </span>
            <span className="text-sm text-gray-600">{quota.percentageUsed}%</span>
          </div>
          <Progress
            value={quota.percentageUsed}
            className={`h-2 ${isAtLimit ? "bg-red-100" : isNearLimit ? "bg-yellow-100" : "bg-gray-100"}`}
          />
        </div>

        {/* Remaining Generations */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>{quota.remaining} generations</strong> remaining this month
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Resets on {quota.resetDate.toLocaleDateString()}
          </p>
        </div>

        {/* Warning if near/at limit */}
        {isNearLimit && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                {isAtLimit ? "Quota Exceeded" : "Quota Running Low"}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                {isAtLimit
                  ? "Upgrade your plan to generate more apps"
                  : "Consider upgrading to the Pro plan for more generations"}
              </p>
            </div>
          </div>
        )}

        {/* Upgrade Button */}
        {quota.plan === "starter" && (
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            Upgrade to Pro Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
