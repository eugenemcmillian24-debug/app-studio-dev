import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, Users, CreditCard, Activity, TrendingUp, Download } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "billing" | "system">("overview");

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      window.location.href = "/";
    }
  }, [user]);

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">You do not have admin privileges to access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Platform management and analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-slate-800/50 p-2 rounded-lg w-fit">
          {(["overview", "users", "billing", "system"] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              onClick={() => setActiveTab(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && <OverviewTab />}

        {/* Users Tab */}
        {activeTab === "users" && <UsersTab />}

        {/* Billing Tab */}
        {activeTab === "billing" && <BillingTab />}

        {/* System Tab */}
        {activeTab === "system" && <SystemTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  // Analytics query (mock data used for now)
  const analyticsQuery = { data: null, isLoading: false };

  const mockData = [
    { date: "Mon", projects: 120, users: 45, revenue: 2400 },
    { date: "Tue", projects: 150, users: 52, revenue: 2800 },
    { date: "Wed", projects: 140, users: 48, revenue: 2600 },
    { date: "Thu", projects: 180, users: 61, revenue: 3200 },
    { date: "Fri", projects: 200, users: 72, revenue: 3800 },
    { date: "Sat", projects: 160, users: 55, revenue: 2900 },
    { date: "Sun", projects: 190, users: 68, revenue: 3500 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard icon={<Users className="h-5 w-5" />} title="Total Users" value="1,234" change="+12%" />
        <KPICard icon={<Activity className="h-5 w-5" />} title="Active Projects" value="856" change="+8%" />
        <KPICard icon={<CreditCard className="h-5 w-5" />} title="Monthly Revenue" value="$24,580" change="+15%" />
        <KPICard icon={<TrendingUp className="h-5 w-5" />} title="Generation Rate" value="2.4K/day" change="+5%" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Weekly Trends</CardTitle>
            <CardDescription>Projects and users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                <Legend />
                <Line type="monotone" dataKey="projects" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Revenue Trend</CardTitle>
            <CardDescription>Daily revenue this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                <Bar dataKey="revenue" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UsersTab() {
  // Users query (mock data used for now)
  const usersQuery = { data: null, isLoading: false };

  const mockUsers = [
    { id: "1", email: "user1@example.com", role: "user", status: "active", joinedAt: "2026-01-15", projects: 5 },
    { id: "2", email: "user2@example.com", role: "user", status: "active", joinedAt: "2026-02-20", projects: 12 },
    { id: "3", email: "user3@example.com", role: "admin", status: "active", joinedAt: "2026-01-01", projects: 0 },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">User Management</CardTitle>
              <CardDescription>Manage platform users and permissions</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Projects</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Joined</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{user.projects}</td>
                    <td className="py-3 px-4 text-gray-400">{user.joinedAt}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingTab() {
  // Billing query (mock data used for now)
  const billingQuery = { data: null, isLoading: false };

  const revenueData = [
    { name: "Starter", value: 35, fill: "#3b82f6" },
    { name: "Pro", value: 65, fill: "#8b5cf6" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-400">$24,580</p>
            <p className="text-sm text-gray-400 mt-2">+15% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-400">342</p>
            <p className="text-sm text-gray-400 mt-2">156 Starter, 186 Pro</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-400">2.3%</p>
            <p className="text-sm text-gray-400 mt-2">-0.5% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Revenue Distribution</CardTitle>
          <CardDescription>By subscription tier</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={revenueData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function SystemTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">System Health</CardTitle>
          <CardDescription>Platform status and performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded">
            <span className="text-gray-300">API Response Time</span>
            <span className="text-green-400 font-mono">45ms</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded">
            <span className="text-gray-300">Database Latency</span>
            <span className="text-green-400 font-mono">23ms</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded">
            <span className="text-gray-300">Error Rate (24h)</span>
            <span className="text-green-400 font-mono">0.02%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded">
            <span className="text-gray-300">Uptime</span>
            <span className="text-green-400 font-mono">99.98%</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">LLM Provider Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Gemini 2.5 Flash</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Operational</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Groq</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Operational</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">OpenRouter</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Operational</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon, title, value, change }: { icon: React.ReactNode; title: string; value: string; change: string }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            <p className="text-xs text-green-400 mt-1">{change}</p>
          </div>
          <div className="text-blue-400">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
