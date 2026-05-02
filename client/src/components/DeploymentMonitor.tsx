/**
 * Deployment Monitoring Dashboard
 * Real-time deployment status, logs, and performance metrics
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, Clock, Zap, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface DeploymentMonitorProps {
  projectId: number;
}

export function DeploymentMonitor({ projectId }: DeploymentMonitorProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get deployments list
  const deployments = trpc.vercel.listDeployments.useQuery(
    { projectId, limit: 10 },
    { refetchInterval: autoRefresh ? 5000 : false }
  );

  // Get deployment status
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);
  const deploymentStatus = trpc.vercel.getDeploymentStatus.useQuery(
    { deploymentId: selectedDeploymentId || "" },
    { enabled: !!selectedDeploymentId }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "READY":
        return "bg-green-100 text-green-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      case "BUILDING":
        return "bg-blue-100 text-blue-800";
      case "QUEUED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "READY":
        return <CheckCircle className="h-4 w-4" />;
      case "ERROR":
        return <AlertCircle className="h-4 w-4" />;
      case "BUILDING":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "QUEUED":
        return <Clock className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (!ms) return "-";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Deployment Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Deployments</CardTitle>
              <CardDescription>View and manage your project deployments</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? "Auto-refresh: ON" : "Auto-refresh: OFF"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deployments.refetch()}
                disabled={deployments.isLoading}
              >
                {deployments.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Deployments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          {deployments.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : deployments.data && deployments.data.length > 0 ? (
            <div className="space-y-3">
              {deployments.data.map((deployment: any) => (
                <div
                  key={deployment.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition"
                  onClick={() => setSelectedDeploymentId(deployment.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(deployment.state)}
                        <Badge className={getStatusColor(deployment.state)}>
                          {deployment.state}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {deployment.environment}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">{deployment.url}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Created: {formatDate(deployment.createdAt)}</span>
                        {deployment.gitBranch && (
                          <span>Branch: {deployment.gitBranch}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a
                        href={deployment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No deployments found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Deployment Details */}
      {selectedDeploymentId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deployment Details</CardTitle>
          </CardHeader>
          <CardContent>
            {deploymentStatus.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : deploymentStatus.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Status</p>
                    <p className="text-sm font-medium mt-1">
                      {deploymentStatus.data.state}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Environment</p>
                    <p className="text-sm font-medium mt-1">
                      {deploymentStatus.data.environment}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Created</p>
                    <p className="text-sm font-medium mt-1">
                      {formatDate(deploymentStatus.data.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Build Duration</p>
                    <p className="text-sm font-medium mt-1">
                      {formatDuration(deploymentStatus.data.buildDurationMs || 0)}
                    </p>
                  </div>
                </div>

                {deploymentStatus.data.gitCommitSha && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Commit</p>
                    <p className="text-sm font-mono mt-1">
                      {deploymentStatus.data.gitCommitSha.substring(0, 7)}
                    </p>
                  </div>
                )}

                {deploymentStatus.data.errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-xs font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-800 mt-1">
                      {deploymentStatus.data.errorMessage}
                    </p>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a
                      href={deploymentStatus.data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Deployment
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Failed to load deployment details
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deployment Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deployment Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {deployments.data && deployments.data.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {deployments.data.filter((d: any) => d.state === "READY").length}
                </p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {deployments.data.filter((d: any) => d.state === "ERROR").length}
                </p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {deployments.data.filter((d: any) => d.state === "BUILDING").length}
                </p>
                <p className="text-xs text-muted-foreground">Building</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              No deployment data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
