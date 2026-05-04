import React, { useState } from "react";
import { TrendingUp, Users, Zap, DollarSign, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AnalyticsData {
  totalUsers: number;
  newUsers30d: number;
  activeUsers30d: number;
  totalProjects: number;
  newProjects30d: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  mrr: number;
  arr: number;
  deploymentSuccessRate: number;
  featureAdoption: Record<string, number>;
  signupTrend: Array<{ date: string; count: number }>;
  revenueByTier: Record<string, number>;
}

interface AdvancedAnalyticsDashboardProps {
  data?: AnalyticsData;
  loading?: boolean;
  onExport?: (format: "pdf" | "csv") => void;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
}

export function AdvancedAnalyticsDashboard({
  data = {
    totalUsers: 0,
    newUsers30d: 0,
    activeUsers30d: 0,
    totalProjects: 0,
    newProjects30d: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    mrr: 0,
    arr: 0,
    deploymentSuccessRate: 0,
    featureAdoption: {},
    signupTrend: [],
    revenueByTier: {},
  },
  loading = false,
  onExport,
  onDateRangeChange,
}: AdvancedAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const handleDateRangeChange = (range: "7d" | "30d" | "90d" | "1y") => {
    setDateRange(range);
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    onDateRangeChange?.(startDate, endDate);
  };

  const metrics = [
    {
      title: "Total Users",
      value: data.totalUsers.toLocaleString(),
      change: `+${data.newUsers30d} this month`,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Active Users (30d)",
      value: data.activeUsers30d.toLocaleString(),
      change: `${((data.activeUsers30d / data.totalUsers) * 100).toFixed(1)}% retention`,
      icon: Zap,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Monthly Revenue",
      value: `$${data.mrr.toLocaleString()}`,
      change: `ARR: $${data.arr.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Deployment Success",
      value: `${data.deploymentSuccessRate.toFixed(1)}%`,
      change: "Success rate",
      icon: TrendingUp,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive platform metrics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport?.("pdf")}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport?.("csv")}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2">
        {(["7d", "30d", "90d", "1y"] as const).map(range => (
          <Button
            key={range}
            variant={dateRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateRangeChange(range)}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.title}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedMetric(metric.title)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold mt-2">{metric.value}</p>
                  <p className="text-xs text-gray-500 mt-2">{metric.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${metric.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signup Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Signup Trend</h3>
          {data.signupTrend.length > 0 ? (
            <div className="space-y-2">
              {data.signupTrend.slice(-7).map((item) => (
                <div key={item.date} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-20">{item.date}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(item.count / Math.max(...data.signupTrend.map(d => d.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </Card>

        {/* Revenue by Tier */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Tier</h3>
          <div className="space-y-3">
            {Object.entries(data.revenueByTier).map(([tier, revenue]) => (
              <div key={tier} className="flex items-center gap-4">
                <span className="text-sm font-medium w-24">{tier}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${(revenue / Math.max(...Object.values(data.revenueByTier))) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold w-20 text-right">${revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Feature Adoption */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Feature Adoption</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.featureAdoption).map(([feature, adoption]) => (
            <div key={feature} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{feature}</span>
                <span className="text-sm font-semibold">{adoption.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${adoption}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed Metrics */}
      {selectedMetric && (
        <Card className="p-6 border-2 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{selectedMetric} Details</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMetric(null)}
            >
              ✕
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedMetric === "Total Users" && (
              <>
                <div className="p-4 bg-blue-50 rounded">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{data.totalUsers}</p>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-sm text-gray-600">New (30d)</p>
                  <p className="text-2xl font-bold">{data.newUsers30d}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded">
                  <p className="text-sm text-gray-600">Active (30d)</p>
                  <p className="text-2xl font-bold">{data.activeUsers30d}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded">
                  <p className="text-sm text-gray-600">Retention</p>
                  <p className="text-2xl font-bold">
                    {((data.activeUsers30d / data.totalUsers) * 100).toFixed(1)}%
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
