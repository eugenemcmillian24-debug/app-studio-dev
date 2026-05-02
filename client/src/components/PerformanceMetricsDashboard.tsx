/**
 * Performance Metrics Dashboard Component
 * Display deployment performance metrics with historical trends
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Zap,
  Package,
  Gauge,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
} from "lucide-react";

interface MetricPoint {
  timestamp: string;
  buildTime: number;
  bundleSize: number;
  lighthouseScore: number;
  deploymentTime: number;
}

interface PerformanceMetrics {
  current: MetricPoint;
  history: MetricPoint[];
  trends: {
    buildTimeTrend: "up" | "down" | "stable";
    bundleSizeTrend: "up" | "down" | "stable";
    lighthouseTrend: "up" | "down" | "stable";
  };
}

interface PerformanceMetricsDashboardProps {
  metrics: PerformanceMetrics;
  timeRange: "7d" | "30d" | "90d";
  onTimeRangeChange: (range: "7d" | "30d" | "90d") => void;
}

export function PerformanceMetricsDashboard({
  metrics,
  timeRange,
  onTimeRangeChange,
}: PerformanceMetricsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<"buildTime" | "bundleSize" | "lighthouse">(
    "buildTime"
  );

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Gauge className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return "bg-red-50 border-red-200";
    if (trend === "down") return "bg-green-50 border-green-200";
    return "bg-gray-50 border-gray-200";
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  };

  // Calculate averages
  const avgBuildTime =
    metrics.history.reduce((sum, m) => sum + m.buildTime, 0) / metrics.history.length;
  const avgBundleSize =
    metrics.history.reduce((sum, m) => sum + m.bundleSize, 0) / metrics.history.length;
  const avgLighthouse =
    metrics.history.reduce((sum, m) => sum + m.lighthouseScore, 0) / metrics.history.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Deployment performance and trends
          </p>
        </div>

        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Build Time */}
        <Card className={getTrendColor(metrics.trends.buildTimeTrend)}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Build Time</span>
                {getTrendIcon(metrics.trends.buildTimeTrend)}
              </div>
              <div className="text-2xl font-bold">{formatTime(metrics.current.buildTime)}</div>
              <div className="text-xs text-muted-foreground">
                Avg: {formatTime(avgBuildTime)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bundle Size */}
        <Card className={getTrendColor(metrics.trends.bundleSizeTrend)}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Bundle Size</span>
                {getTrendIcon(metrics.trends.bundleSizeTrend)}
              </div>
              <div className="text-2xl font-bold">{formatSize(metrics.current.bundleSize)}</div>
              <div className="text-xs text-muted-foreground">
                Avg: {formatSize(avgBundleSize)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lighthouse Score */}
        <Card className={getTrendColor(metrics.trends.lighthouseTrend)}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Lighthouse</span>
                {getTrendIcon(metrics.trends.lighthouseTrend)}
              </div>
              <div className="text-2xl font-bold">{metrics.current.lighthouseScore}/100</div>
              <div className="text-xs text-muted-foreground">
                Avg: {avgLighthouse.toFixed(1)}/100
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deployment Time */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Deploy Time</span>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">
                {formatTime(metrics.current.deploymentTime)}
              </div>
              <div className="text-xs text-muted-foreground">Last deployment</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Build Time Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Build Time Trend</CardTitle>
            <CardDescription>Historical build times</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatTime(value as number)}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="buildTime"
                  stroke="#3b82f6"
                  name="Build Time (ms)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bundle Size Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bundle Size Trend</CardTitle>
            <CardDescription>Historical bundle sizes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatSize(value as number)}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bundleSize"
                  stroke="#8b5cf6"
                  name="Bundle Size (bytes)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lighthouse Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lighthouse Score Trend</CardTitle>
            <CardDescription>Historical performance scores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => `${value}/100`}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="lighthouseScore"
                  stroke="#10b981"
                  name="Lighthouse Score"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deployment Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deployment Time Distribution</CardTitle>
            <CardDescription>Build vs Deploy time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={metrics.history.slice(-7)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatTime(value as number)} />
                <Legend />
                <Bar dataKey="buildTime" fill="#3b82f6" name="Build Time" />
                <Bar dataKey="deploymentTime" fill="#f59e0b" name="Deploy Time" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {metrics.current.lighthouseScore < 80 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Performance Alert</p>
              <p className="text-sm text-yellow-800 mt-1">
                Lighthouse score is below 80. Consider optimizing bundle size and rendering performance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {metrics.current.bundleSize > avgBundleSize * 1.2 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-900">Bundle Size Alert</p>
              <p className="text-sm text-orange-800 mt-1">
                Current bundle size is 20% larger than average. Review dependencies and code splitting.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
