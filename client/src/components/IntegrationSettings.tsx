/**
 * GitHub and Vercel Integration Settings Panel
 * Allows users to connect, manage, and configure integrations
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Github, Zap, CheckCircle, AlertCircle, Link2, Unlink2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
// import { useToast } from "@/components/ui/use-toast";

const useToast = () => ({
  toast: (props: any) => console.log("Toast:", props),
});

interface IntegrationSettingsProps {
  projectId?: number;
}

export function IntegrationSettings({ projectId }: IntegrationSettingsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showVercelToken, setShowVercelToken] = useState(false);
  const [vercelTokenInput, setVercelTokenInput] = useState("");

  // GitHub queries
  const githubConnection = trpc.github.checkConnection.useQuery(undefined, {
    retry: false,
  });

  const githubUser = trpc.github.checkConnection.useQuery(undefined, {
    enabled: githubConnection.data?.connected,
    retry: false,
  });

  // Vercel queries
  const vercelConnection = trpc.vercel.checkConnection.useQuery(undefined, {
    retry: false,
  });

  const vercelUser = trpc.vercel.getUser.useQuery(undefined, {
    enabled: vercelConnection.data?.connected,
    retry: false,
  });

  // Project integrations (if projectId provided)
  const projectGithubRepo = projectId
    ? trpc.github.getRepositories.useQuery(
        undefined,
        { enabled: !!projectId && githubConnection.data?.connected, retry: false }
      )
    : null;

  const projectVercelProjects = projectId
    ? trpc.vercel.listProjects.useQuery(
        undefined,
        { enabled: !!projectId && vercelConnection.data?.connected, retry: false }
      )
    : null;

  // Mutations
  const connectGitHub = trpc.github.checkConnection.useQuery(undefined, {
    enabled: false,
  });

  const handleGitHubConnect = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would redirect to GitHub OAuth
      // For now, we'll show a placeholder
      toast({
        title: "GitHub OAuth Flow",
        description: "Redirecting to GitHub for authentication...",
      });
      // window.location.href = getGitHubOAuthUrl();
    } catch (error) {
      toast({
        title: "Failed to initiate GitHub login",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVercelConnect = async () => {
    if (!vercelTokenInput.trim()) {
      toast({
        title: "Please enter your Vercel API token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Store token in browser storage
      localStorage.setItem("vercel_token", vercelTokenInput);
      toast({ title: "Vercel token saved successfully" });
      setVercelTokenInput("");
      vercelConnection.refetch();
    } catch (error) {
      toast({
        title: "Failed to save Vercel token",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubDisconnect = () => {
    localStorage.removeItem("github_token");
    githubConnection.refetch();
    toast({ title: "GitHub disconnected" });
  };

  const handleVercelDisconnect = () => {
    localStorage.removeItem("vercel_token");
    vercelConnection.refetch();
    toast({ title: "Vercel disconnected" });
  };

  return (
    <div className="space-y-6">
      {/* GitHub Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              <div>
                <CardTitle>GitHub Integration</CardTitle>
                <CardDescription>Connect your GitHub account to manage repositories</CardDescription>
              </div>
            </div>
            {githubConnection.data?.connected && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            )}
            {!githubConnection.data?.connected && (
              <Badge variant="secondary">Disconnected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {githubConnection.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking connection...
            </div>
          ) : githubConnection.data?.connected ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">Connected as</p>
                <p className="text-sm text-muted-foreground">GitHub Account</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGitHubDisconnect}
                >
                  <Unlink2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your GitHub account to enable repository management, pull requests, and issue tracking.
              </p>
              <Button
                onClick={handleGitHubConnect}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className="h-4 w-4 mr-2" />
                    Connect GitHub
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vercel Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <div>
                <CardTitle>Vercel Integration</CardTitle>
                <CardDescription>Connect your Vercel account for deployments</CardDescription>
              </div>
            </div>
            {vercelConnection.data?.connected && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            )}
            {!vercelConnection.data?.connected && (
              <Badge variant="secondary">Disconnected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {vercelConnection.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking connection...
            </div>
          ) : vercelConnection.data?.connected ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">Connected as</p>
                <p className="text-sm text-muted-foreground">{vercelUser.data?.username}</p>
                <p className="text-xs text-muted-foreground mt-1">{vercelUser.data?.email}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVercelDisconnect}
                >
                  <Unlink2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your Vercel API token to enable automatic deployments and project management.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Token</label>
                <input
                  type={showVercelToken ? "text" : "password"}
                  value={vercelTokenInput}
                  onChange={(e) => setVercelTokenInput(e.target.value)}
                  placeholder="Enter your Vercel API token"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowVercelToken(!showVercelToken)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showVercelToken ? "Hide" : "Show"} token
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your token from{" "}
                <a
                  href="https://vercel.com/account/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Vercel Settings → Tokens
                </a>
              </p>
              <Button
                onClick={handleVercelConnect}
                disabled={isLoading || !vercelTokenInput.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Connect Vercel
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Integration Status */}
      {projectId && (
        <div className="space-y-4">
          {/* GitHub Repository Link */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">GitHub Repositories</CardTitle>
                  <CardDescription>Your linked repositories</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {projectGithubRepo?.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : projectGithubRepo?.data?.repositories && projectGithubRepo.data.repositories.length > 0 ? (
                <div className="space-y-2">
                  {projectGithubRepo.data.repositories.map((repo: any) => (
                    <div key={repo.id} className="rounded-lg bg-muted p-4">
                      <p className="text-sm font-medium">{repo.name}</p>
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View on GitHub →
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No GitHub repositories found</p>
              )}
            </CardContent>
          </Card>

          {/* Vercel Projects Link */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">Vercel Projects</CardTitle>
                  <CardDescription>Your deployment projects</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {projectVercelProjects?.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : projectVercelProjects?.data && projectVercelProjects.data.length > 0 ? (
                <div className="space-y-2">
                  {projectVercelProjects.data.map((project: any) => (
                    <div key={project.id} className="rounded-lg bg-muted p-4">
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.framework}</p>
                      {project.productionDeployment?.url && (
                        <a
                          href={project.productionDeployment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline block mt-1"
                        >
                          {project.productionDeployment.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No Vercel projects found</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
