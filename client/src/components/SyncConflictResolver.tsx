/**
 * Sync Conflict Resolver UI
 * Visual component for handling file conflicts during bidirectional sync
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  GitCompare,
  CheckCircle,
} from "lucide-react";

interface ConflictFile {
  id: string;
  path: string;
  status: "conflict" | "resolved";
  localVersion: string;
  remoteVersion: string;
  selectedVersion: "local" | "remote" | "merged" | null;
  mergedVersion?: string;
}

interface SyncConflictResolverProps {
  conflicts: ConflictFile[];
  onResolve: (conflicts: ConflictFile[]) => void;
  onCancel: () => void;
}

export function SyncConflictResolver({
  conflicts: initialConflicts,
  onResolve,
  onCancel,
}: SyncConflictResolverProps) {
  const [conflicts, setConflicts] = useState<ConflictFile[]>(initialConflicts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState<"local" | "remote" | "manual">("manual");

  const handleSelectVersion = (id: string, version: "local" | "remote") => {
    setConflicts(
      conflicts.map((c) =>
        c.id === id
          ? { ...c, selectedVersion: version, status: "resolved" }
          : c
      )
    );
  };

  const handleMergeManual = (id: string, mergedContent: string) => {
    setConflicts(
      conflicts.map((c) =>
        c.id === id
          ? {
              ...c,
              selectedVersion: "merged",
              mergedVersion: mergedContent,
              status: "resolved",
            }
          : c
      )
    );
  };

  const handleAutoResolve = () => {
    const resolved = conflicts.map((c) => ({
      ...c,
      selectedVersion: mergeMode as "local" | "remote",
      status: "resolved" as const,
    }));
    setConflicts(resolved);
  };

  const allResolved = conflicts.every((c) => c.status === "resolved");
  const conflictCount = conflicts.filter((c) => c.status === "conflict").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <CardTitle className="text-yellow-900">Sync Conflicts Detected</CardTitle>
              <CardDescription className="text-yellow-700">
                {conflictCount} file{conflictCount !== 1 ? "s" : ""} have conflicts between local and remote versions.
                Choose how to resolve them.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Auto-Resolve Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Resolve</CardTitle>
          <CardDescription>Apply the same resolution to all conflicts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mergeMode === "local" ? "default" : "outline"}
              onClick={() => setMergeMode("local")}
              size="sm"
            >
              Use All Local
            </Button>
            <Button
              variant={mergeMode === "remote" ? "default" : "outline"}
              onClick={() => setMergeMode("remote")}
              size="sm"
            >
              Use All Remote
            </Button>
          </div>
          <Button
            onClick={handleAutoResolve}
            className="w-full"
            disabled={conflictCount === 0}
          >
            Apply to All Conflicts
          </Button>
        </CardContent>
      </Card>

      {/* Individual Conflicts */}
      <div className="space-y-3">
        {conflicts.map((conflict) => (
          <Card key={conflict.id}>
            <CardContent className="pt-6">
              {/* File Header */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === conflict.id ? null : conflict.id)
                }
                className="w-full flex items-center justify-between hover:bg-muted p-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  <GitCompare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{conflict.path}</p>
                    <p className="text-xs text-muted-foreground">
                      {conflict.status === "resolved" ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Resolved
                        </span>
                      ) : (
                        <span className="text-yellow-600">Unresolved</span>
                      )}
                    </p>
                  </div>
                </div>
                {expandedId === conflict.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {/* Expanded Details */}
              {expandedId === conflict.id && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  {/* Version Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Local Version */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Local Version</h4>
                        <Badge variant="outline">Current</Badge>
                      </div>
                      <div className="bg-muted p-3 rounded-lg font-mono text-xs max-h-40 overflow-auto">
                        <pre className="whitespace-pre-wrap break-words">
                          {conflict.localVersion}
                        </pre>
                      </div>
                      <Button
                        size="sm"
                        variant={
                          conflict.selectedVersion === "local"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          handleSelectVersion(conflict.id, "local")
                        }
                        className="w-full"
                      >
                        <Copy className="h-3 w-3 mr-2" />
                        Use Local
                      </Button>
                    </div>

                    {/* Remote Version */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Remote Version</h4>
                        <Badge variant="outline">GitHub</Badge>
                      </div>
                      <div className="bg-muted p-3 rounded-lg font-mono text-xs max-h-40 overflow-auto">
                        <pre className="whitespace-pre-wrap break-words">
                          {conflict.remoteVersion}
                        </pre>
                      </div>
                      <Button
                        size="sm"
                        variant={
                          conflict.selectedVersion === "remote"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          handleSelectVersion(conflict.id, "remote")
                        }
                        className="w-full"
                      >
                        <Copy className="h-3 w-3 mr-2" />
                        Use Remote
                      </Button>
                    </div>
                  </div>

                  {/* Manual Merge */}
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="text-sm font-medium">Manual Merge</h4>
                    <textarea
                      value={conflict.mergedVersion || ""}
                      onChange={(e) =>
                        handleMergeManual(conflict.id, e.target.value)
                      }
                      placeholder="Edit and combine both versions here..."
                      className="w-full p-3 border border-input rounded-lg font-mono text-xs h-32 resize-none"
                    />
                    <Button
                      size="sm"
                      variant={
                        conflict.selectedVersion === "merged"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => {
                        if (conflict.mergedVersion) {
                          handleMergeManual(conflict.id, conflict.mergedVersion);
                        }
                      }}
                      className="w-full"
                    >
                      Use Merged Version
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 sticky bottom-0 bg-background p-4 border-t">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={() => onResolve(conflicts)}
          disabled={!allResolved}
          className="flex-1"
        >
          {allResolved ? "Resolve Conflicts" : `Resolve ${conflictCount} Remaining`}
        </Button>
      </div>

      {/* Resolution Summary */}
      {allResolved && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">All conflicts resolved!</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
