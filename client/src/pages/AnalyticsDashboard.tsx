import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AnalyticsDashboard() {
  const [chartData, setChartData] = useState<any[]>([]);

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = trpc.analytics.getDashboardMetrics.useQuery();

  // Fetch generation analytics
  const { data: generationData, isLoading: generationLoading } = trpc.analytics.getGenerationAnalytics.useQuery({
    limit: 30,
  });

  // Fetch user activity
  const { data: activityData, isLoading: activityLoading } = trpc.analytics.getUserActivity.useQuery({
    limit: 20,
  });

  // Process data for charts
  useEffect(() => {
    if (generationData?.generations) {
      const processed = generationData.generations.map((g: any, idx: number) => ({
        name: `Gen ${idx + 1}`,
        tokens: g.tokensUsed || 0,
        success: g.success ? 1 : 0,
        date: new Date(g.createdAt).toLocaleDateString(),
      }));
      setChartData(processed);
    }
  }, [generationData]);

  if (metricsLoading || generationLoading || activityLoading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Analytics Dashboard</h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalGenerations || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics?.successfulGenerations || 0}</div>
              <p className="text-xs text-muted-foreground">Success rate: {metrics?.totalGenerations ? Math.round((metrics.successfulGenerations / metrics.totalGenerations) * 100) : 0}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics?.failedGenerations || 0}</div>
              <p className="text-xs text-muted-foreground">Errors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(metrics?.totalTokensUsed || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Token Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Token Usage Over Time</CardTitle>
              <CardDescription>Tokens consumed per generation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tokens" stroke="#8884d8" name="Tokens" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Success Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Success Rate</CardTitle>
              <CardDescription>Success vs failure distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: "Successful", value: metrics?.successfulGenerations || 0 },
                  { name: "Failed", value: metrics?.failedGenerations || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 20 user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityData && activityData.length > 0 ? (
                activityData.map((activity: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded">
                    <div>
                      <p className="font-medium capitalize">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Project {activity.projectId}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No activity yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
