import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Admin() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You don't have permission to access this page.</p>
          <Button onClick={() => navigate("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const llmProvidersQuery = trpc.admin.getLLMProviders.useQuery();
  const toggleProviderMutation = trpc.admin.toggleLLMProvider.useMutation({
    onSuccess: () => {
      toast.success("Provider updated");
      llmProvidersQuery.refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update provider");
    },
  });

  const providers = llmProvidersQuery.data || [];

  const handleToggle = (providerName: string, currentState: boolean): void => {
    setToggleStates(prev => ({ ...prev, [providerName]: !currentState }));
    toggleProviderMutation.mutate({ provider: providerName as any, enabled: !currentState });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">LLM Provider Management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* LLM Providers */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="size-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-foreground">LLM Providers</h2>
          </div>

          {llmProvidersQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4">
              {providers.map((provider: any) => (
                <div
                  key={provider.name as string}
                  className="p-4 rounded-xl border border-border/50 bg-card hover:border-border transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${provider.enabled ? "bg-green-500/10" : "bg-red-500/10"}`}>
                        {provider.enabled ? (
                          <CheckCircle2 className="size-5 text-green-500" />
                        ) : (
                          <AlertCircle className="size-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground capitalize">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {provider.enabled ? "Active" : "Disabled"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={provider.enabled ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggle(provider.name, provider.enabled)}
                      disabled={toggleProviderMutation.isPending}
                    >
                      {toggleProviderMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : provider.enabled ? (
                        "Disable"
                      ) : (
                        "Enable"
                      )}
                    </Button>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Avg Response</p>
                      <p className="text-sm font-semibold text-foreground">{provider.avgResponseTimeMs}ms</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Total Requests</p>
                      <p className="text-sm font-semibold text-foreground">{provider.totalRequests}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Failed</p>
                      <p className="text-sm font-semibold text-foreground">{provider.failedRequests}</p>
                    </div>
                  </div>

                  {/* Success Rate */}
                  {provider.totalRequests > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                        <p className="text-xs font-semibold text-foreground">
                          {Math.round(((provider.totalRequests - provider.failedRequests) / provider.totalRequests) * 100)}%
                        </p>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-cyan-500"
                          style={{
                            width: `${((provider.totalRequests - provider.failedRequests) / provider.totalRequests) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <div className="flex gap-3">
            <AlertCircle className="size-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Provider Management</p>
              <p className="text-xs text-muted-foreground">
                Disable providers that are having issues. The system will automatically skip disabled providers and use the next available one. Metrics are updated in real-time as scaffolds are generated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
