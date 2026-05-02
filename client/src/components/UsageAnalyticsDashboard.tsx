import React, { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle, Zap } from "lucide-react";

interface UsageData {
  date: string;
  deployments: number;
  apiCalls: number;
  storage: number;
  teamMembers: number;
}

interface FeatureUsage {
  feature: string;
  usage: number;
  limit: number;
  percentage: number;
}

interface UpgradeOpportunity {
  feature: string;
  currentUsage: number;
  limit: number;
  recommendedTier: string;
  estimatedROI: number;
}

const MOCK_USAGE_DATA: UsageData[] = [
  { date: "Jan 1", deployments: 12, apiCalls: 450, storage: 2.5, teamMembers: 3 },
  { date: "Jan 8", deployments: 28, apiCalls: 890, storage: 4.2, teamMembers: 4 },
  { date: "Jan 15", deployments: 45, apiCalls: 1200, storage: 6.8, teamMembers: 5 },
  { date: "Jan 22", deployments: 67, apiCalls: 1850, storage: 9.1, teamMembers: 6 },
  { date: "Jan 29", deployments: 92, apiCalls: 2400, storage: 12.3, teamMembers: 7 },
];

const FEATURE_USAGE: FeatureUsage[] = [
  { feature: "Deployments", usage: 92, limit: 100, percentage: 92 },
  { feature: "API Calls", usage: 24000, limit: 100000, percentage: 24 },
  { feature: "Storage", usage: 12.3, limit: 100, percentage: 12 },
  { feature: "Team Members", usage: 7, limit: 15, percentage: 47 },
  { feature: "Environments", usage: 2, limit: 3, percentage: 67 },
];

const UPGRADE_OPPORTUNITIES: UpgradeOpportunity[] = [
  {
    feature: "Deployments",
    currentUsage: 92,
    limit: 100,
    recommendedTier: "Professional",
    estimatedROI: 3.5,
  },
  {
    feature: "Environments",
    currentUsage: 2,
    limit: 3,
    recommendedTier: "Professional",
    estimatedROI: 2.1,
  },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function UsageAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");
  const [selectedMetric, setSelectedMetric] = useState<"deployments" | "apiCalls" | "storage">(
    "deployments"
  );

  const getTrendPercentage = () => {
    const first = MOCK_USAGE_DATA[0][selectedMetric as keyof UsageData] as number;
    const last = MOCK_USAGE_DATA[MOCK_USAGE_DATA.length - 1][selectedMetric as keyof UsageData] as number;
    return (((last - first) / first) * 100).toFixed(1);
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case "deployments":
        return "Deployments";
      case "apiCalls":
        return "API Calls";
      case "storage":
        return "Storage (GB)";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usage Analytics</h2>
          <p className="text-muted-foreground">Track your feature usage and identify upgrade opportunities</p>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "quarter"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Metric Selector */}
      <div className="grid grid-cols-3 gap-4">
        {(["deployments", "apiCalls", "storage"] as const).map((metric) => (
          <Card
            key={metric}
            className={`p-4 cursor-pointer transition-all ${
              selectedMetric === metric ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedMetric(metric)}
          >
            <div className="text-sm text-muted-foreground mb-1">{getMetricLabel()}</div>
            <div className="text-2xl font-bold mb-2">
              {metric === "deployments"
                ? MOCK_USAGE_DATA[MOCK_USAGE_DATA.length - 1].deployments
                : metric === "apiCalls"
                  ? MOCK_USAGE_DATA[MOCK_USAGE_DATA.length - 1].apiCalls
                  : MOCK_USAGE_DATA[MOCK_USAGE_DATA.length - 1].storage}
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>+{getTrendPercentage()}% this month</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Usage Trend Chart */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Usage Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={MOCK_USAGE_DATA}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Feature Usage Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Usage by Feature */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Feature Usage Breakdown</h3>
          <div className="space-y-4">
            {FEATURE_USAGE.map((feature) => (
              <div key={feature.feature}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{feature.feature}</span>
                  <span className="text-sm text-muted-foreground">
                    {feature.usage} / {feature.limit}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      feature.percentage > 80
                        ? "bg-red-500"
                        : feature.percentage > 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(feature.percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {feature.percentage.toFixed(0)}% of limit
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Usage Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Usage Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={FEATURE_USAGE}
                dataKey="usage"
                nameKey="feature"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {FEATURE_USAGE.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Upgrade Opportunities */}
      {UPGRADE_OPPORTUNITIES.length > 0 && (
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-3">Upgrade Opportunities</h3>
              <div className="space-y-3">
                {UPGRADE_OPPORTUNITIES.map((opp) => (
                  <div
                    key={opp.feature}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {opp.feature} limit approaching
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {opp.currentUsage} / {opp.limit} used • Upgrade to {opp.recommendedTier}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {opp.estimatedROI}x ROI
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">
                        Upgrade
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <Zap className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Optimization Recommendations</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Your deployment frequency is increasing 23% week-over-week</li>
              <li>• Consider upgrading to Professional to unlock advanced monitoring</li>
              <li>• Set up deployment approval workflows to prevent errors</li>
              <li>• Enable cost tracking to monitor spending trends</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
