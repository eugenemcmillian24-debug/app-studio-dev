/**
 * Auto-Deploy Pipeline UI
 * Configure and manage automatic deployments to Vercel
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  GitBranch,
  Zap,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Trash2,
  Plus,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface DeploymentConfig {
  id: string;
  branch: string;
  environment: "production" | "preview" | "development";
  autoTrigger: boolean;
  status: "active" | "inactive";
  lastDeployment?: {
    date: string;
    status: "success" | "failed" | "pending";
    url?: string;
  };
}

interface AutoDeployPipelineProps {
  projectId: number;
}

export function AutoDeployPipeline({ projectId }: AutoDeployPipelineProps) {
  const [configs, setConfigs] = useState<DeploymentConfig[]>([
    {
      id: "1",
      branch: "main",
      environment: "production",
      autoTrigger: true,
      status: "active",
      lastDeployment: {
        date: new Date().toISOString(),
        status: "success",
        url: "https://app.vercel.app",
      },
    },
    {
      id: "2",
      branch: "develop",
      environment: "preview",
      autoTrigger: true,
      status: "active",
      lastDeployment: {
        date: new Date(Date.now() - 3600000).toISOString(),
        status: "success",
        url: "https://develop.app.vercel.app",
      },
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newConfig, setNewConfig] = useState({
    branch: "",
    environment: "preview" as const,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
        return <AlertCircle className="h-4 w-4" />;
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const handleAddConfig = () => {
    if (!newConfig.branch.trim()) return;

    const config: DeploymentConfig = {
      id: Date.now().toString(),
      branch: newConfig.branch,
      environment: newConfig.environment,
      autoTrigger: true,
      status: "active",
    };

    setConfigs([...configs, config]);
    setNewConfig({ branch: "", environment: "preview" });
    setShowAddForm(false);
  };

  const handleRemoveConfig = (id: string) => {
    setConfigs(configs.filter((c) => c.id !== id));
  };

  const handleToggleAutoTrigger = (id: string) => {
    setConfigs(
      configs.map((c) =>
        c.id === id ? { ...c, autoTrigger: !c.autoTrigger } : c
      )
    );
  };

  const handleTriggerDeploy = (id: string) => {
    const config = configs.find((c) => c.id === id);
    if (!config) return;

    // Simulate deployment
    const updatedConfigs = configs.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          lastDeployment: {
            date: new Date().toISOString(),
            status: "pending" as const,
          },
        };
      }
      return c;
    });

    setConfigs(updatedConfigs);

    // Simulate completion after 3 seconds
    setTimeout(() => {
      setConfigs((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              lastDeployment: {
                date: new Date().toISOString(),
                status: "success" as const,
                url: `https://${config.branch === "main" ? "" : config.branch + "."}app.vercel.app`,
              },
            };
          }
          return c;
        })
      );
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Auto-Deploy Pipeline</CardTitle>
              <CardDescription>
                Configure automatic deployments on push to specific branches
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add New Configuration Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Deployment Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Branch Name</label>
                <input
                  type="text"
                  value={newConfig.branch}
                  onChange={(e) =>
                    setNewConfig({ ...newConfig, branch: e.target.value })
                  }
                  placeholder="e.g., main, develop, staging"
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Environment</label>
                <select
                  value={newConfig.environment}
                  onChange={(e) =>
                    setNewConfig({
                      ...newConfig,
                      environment: e.target.value as any,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="production">Production</option>
                  <option value="preview">Preview</option>
                  <option value="development">Development</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddConfig} size="sm">
                Create Configuration
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deployment Configurations */}
      <div className="space-y-3">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Configuration Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{config.branch}</p>
                      <p className="text-xs text-muted-foreground">
                        {config.environment.charAt(0).toUpperCase() +
                          config.environment.slice(1)}{" "}
                        Environment
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={config.status === "active" ? "default" : "secondary"}
                    >
                      {config.status}
                    </Badge>
                  </div>
                </div>

                {/* Auto-Trigger Toggle */}
                <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Auto-Deploy on Push</span>
                  </div>
                  <button
                    onClick={() => handleToggleAutoTrigger(config.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.autoTrigger
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.autoTrigger ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Last Deployment */}
                {config.lastDeployment && (
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Deployment</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(config.lastDeployment.status)}
                        <Badge className={getStatusColor(config.lastDeployment.status)}>
                          {config.lastDeployment.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(config.lastDeployment.date).toLocaleString()}
                    </p>
                    {config.lastDeployment.url && (
                      <a
                        href={config.lastDeployment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline block"
                      >
                        {config.lastDeployment.url}
                      </a>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTriggerDeploy(config.id)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Deploy Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveConfig(config.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deployment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deployment History</CardTitle>
          <CardDescription>Recent deployments across all configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {configs
              .filter((c) => c.lastDeployment)
              .sort(
                (a, b) =>
                  new Date(b.lastDeployment!.date).getTime() -
                  new Date(a.lastDeployment!.date).getTime()
              )
              .map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(config.lastDeployment!.status)}
                    <div>
                      <p className="text-sm font-medium">{config.branch}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(config.lastDeployment!.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(config.lastDeployment!.status)}>
                    {config.lastDeployment!.status}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
