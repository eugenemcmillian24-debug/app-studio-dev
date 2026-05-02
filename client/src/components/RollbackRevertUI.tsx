/**
 * Rollback & Revert UI Component
 * Interface for rolling back deployments and reverting commits
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  RotateCcw,
  Undo2,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  ArrowLeft,
  Trash2,
} from "lucide-react";

interface Deployment {
  id: string;
  version: string;
  timestamp: string;
  status: "success" | "failed";
  author: string;
  message: string;
  url?: string;
}

interface Commit {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
  url: string;
}

interface RollbackRevertUIProps {
  deployments: Deployment[];
  commits: Commit[];
  currentDeployment?: Deployment;
  onRollback: (deploymentId: string) => Promise<void>;
  onRevert: (commitSha: string) => Promise<void>;
}

export function RollbackRevertUI({
  deployments,
  commits,
  currentDeployment,
  onRollback,
  onRevert,
}: RollbackRevertUIProps) {
  const [selectedRollback, setSelectedRollback] = useState<string | null>(null);
  const [selectedRevert, setSelectedRevert] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [confirmRollback, setConfirmRollback] = useState(false);
  const [confirmRevert, setConfirmRevert] = useState(false);

  const handleRollback = async () => {
    if (!selectedRollback) return;

    setIsRollingBack(true);
    try {
      await onRollback(selectedRollback);
      setConfirmRollback(false);
      setSelectedRollback(null);
    } catch (error) {
      console.error("Rollback failed:", error);
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleRevert = async () => {
    if (!selectedRevert) return;

    setIsReverting(true);
    try {
      await onRevert(selectedRevert);
      setConfirmRevert(false);
      setSelectedRevert(null);
    } catch (error) {
      console.error("Revert failed:", error);
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Rollback & Revert</CardTitle>
          <CardDescription>
            Restore previous deployments or revert commits
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Current Deployment Info */}
      {currentDeployment && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-blue-900">Current Deployment</h3>
                <Badge variant="outline" className="bg-blue-100">
                  Active
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-900">
                <div>
                  <p className="text-xs opacity-75">Version</p>
                  <p className="font-mono">{currentDeployment.version}</p>
                </div>
                <div>
                  <p className="text-xs opacity-75">Deployed</p>
                  <p>{new Date(currentDeployment.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rollback Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Rollback Deployment
          </h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {deployments.map((deployment) => (
              <Card
                key={deployment.id}
                className={`cursor-pointer transition-colors ${
                  selectedRollback === deployment.id
                    ? "border-blue-500 bg-blue-50"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedRollback(deployment.id)}
              >
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-sm font-medium">
                          {deployment.version}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {deployment.message}
                        </p>
                      </div>
                      <Badge
                        variant={
                          deployment.status === "success"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {deployment.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {deployment.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(deployment.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedRollback && !confirmRollback && (
            <Button
              onClick={() => setConfirmRollback(true)}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Rollback to This Version
            </Button>
          )}

          {confirmRollback && selectedRollback && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      Confirm Rollback
                    </p>
                    <p className="text-sm text-yellow-800 mt-1">
                      This will restore the deployment to version{" "}
                      <span className="font-mono">
                        {deployments.find((d) => d.id === selectedRollback)
                          ?.version}
                      </span>
                      . All changes since then will be lost.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleRollback}
                    disabled={isRollingBack}
                    className="flex-1"
                  >
                    {isRollingBack ? "Rolling back..." : "Confirm Rollback"}
                  </Button>
                  <Button
                    onClick={() => setConfirmRollback(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Revert Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Undo2 className="h-5 w-5" />
            Revert Commit
          </h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {commits.map((commit) => (
              <Card
                key={commit.sha}
                className={`cursor-pointer transition-colors ${
                  selectedRevert === commit.sha
                    ? "border-blue-500 bg-blue-50"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedRevert(commit.sha)}
              >
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-mono text-xs text-muted-foreground">
                          {commit.sha.substring(0, 7)}
                        </p>
                        <p className="text-sm font-medium">{commit.message}</p>
                      </div>
                      <a
                        href={commit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs"
                      >
                        View
                      </a>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {commit.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(commit.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedRevert && !confirmRevert && (
                  <Button
                    onClick={() => setConfirmRevert(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Revert This Commit
                  </Button>
          )}

          {confirmRevert && selectedRevert && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Confirm Revert</p>
                    <p className="text-sm text-red-800 mt-1">
                      This will create a new commit that reverts the changes
                      from{" "}
                      <span className="font-mono">
                        {selectedRevert.substring(0, 7)}
                      </span>
                      . This cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleRevert}
                    disabled={isReverting}
                    className="flex-1"
                  >
                    {isReverting ? "Reverting..." : "Confirm Revert"}
                  </Button>
                  <Button
                    onClick={() => setConfirmRevert(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Success Messages */}
      {!isRollingBack && !isReverting && (
        <div className="space-y-2">
          {selectedRollback && !confirmRollback && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4 flex items-center gap-2 text-green-900">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">
                  Ready to rollback. Click confirm to proceed.
                </span>
              </CardContent>
            </Card>
          )}

          {selectedRevert && !confirmRevert && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4 flex items-center gap-2 text-green-900">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">
                  Ready to revert. Click confirm to proceed.
                </span>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
