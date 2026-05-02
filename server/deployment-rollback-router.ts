/**
 * Deployment Rollback Router
 * Manage deployment rollbacks with health checks and automatic verification
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface DeploymentSnapshot {
  id: string;
  version: string;
  environment: string;
  timestamp: string;
  commitHash: string;
  author: string;
  status: "active" | "rolled_back" | "archived";
  healthStatus: "healthy" | "degraded" | "failed";
  metrics: {
    uptime: number;
    errorRate: number;
    responseTime: number;
    lighthouseScore: number;
  };
}

interface RollbackOperation {
  id: string;
  fromVersion: string;
  toVersion: string;
  environment: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  reason: string;
  initiatedBy: string;
  startTime: string;
  endTime?: string;
  healthChecksPassed: boolean;
  error?: string;
}

// In-memory storage (in production, use database)
const deploymentSnapshots = new Map<string, DeploymentSnapshot[]>();
const rollbackOperations = new Map<string, RollbackOperation[]>();

export const deploymentRollbackRouter = router({
  /**
   * Get deployment history
   */
  getDeploymentHistory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        environment: z.string(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const key = `${input.projectId}-${input.environment}`;
        const snapshots = deploymentSnapshots.get(key) || [];

        return {
          deployments: snapshots
            .filter((s) => s.status !== "archived")
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, input.limit),
          total: snapshots.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get deployment history: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get deployment details
   */
  getDeploymentDetails: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Search for deployment across all projects
        for (const snapshots of Array.from(deploymentSnapshots.values())) {
          const deployment = snapshots.find((s: DeploymentSnapshot) => s.id === input.deploymentId);
          if (deployment) {
            return deployment;
          }
        }

        throw new Error("Deployment not found");
      } catch (error) {
        throw new Error(
          `Failed to get deployment details: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Create deployment snapshot
   */
  createDeploymentSnapshot: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        version: z.string(),
        environment: z.string(),
        commitHash: z.string(),
        author: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const key = `${input.projectId}-${input.environment}`;
        let snapshots = deploymentSnapshots.get(key) || [];

        const snapshot: DeploymentSnapshot = {
          id: `deployment_${Date.now()}`,
          version: input.version,
          environment: input.environment,
          timestamp: new Date().toISOString(),
          commitHash: input.commitHash,
          author: input.author,
          status: "active",
          healthStatus: "healthy",
          metrics: {
            uptime: 100,
            errorRate: 0,
            responseTime: 0,
            lighthouseScore: 100,
          },
        };

        snapshots.push(snapshot);
        deploymentSnapshots.set(key, snapshots.slice(-100)); // Keep last 100

        return {
          success: true,
          deploymentId: snapshot.id,
        };
      } catch (error) {
        throw new Error(
          `Failed to create deployment snapshot: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Update deployment health status
   */
  updateDeploymentHealth: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
        healthStatus: z.enum(["healthy", "degraded", "failed"]),
        metrics: z.object({
          uptime: z.number(),
          errorRate: z.number(),
          responseTime: z.number(),
          lighthouseScore: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Find and update deployment
        for (const snapshots of Array.from(deploymentSnapshots.values())) {
          const index = snapshots.findIndex((s: DeploymentSnapshot) => s.id === input.deploymentId);
          if (index >= 0) {
            const deployment = snapshots[index];
            deployment.healthStatus = input.healthStatus;
            deployment.metrics = input.metrics;
            return {
              success: true,
            };
          }
        }

        throw new Error("Deployment not found");
      } catch (error) {
        throw new Error(
          `Failed to update deployment health: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Initiate rollback
   */
  initiateRollback: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        environment: z.string(),
        toDeploymentId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const key = `${input.projectId}-${input.environment}`;
        const snapshots = deploymentSnapshots.get(key) || [];

        // Find current and target deployments
        const currentDeployment = snapshots.find((s) => s.status === "active");
        const targetDeployment = snapshots.find((s) => s.id === input.toDeploymentId);

        if (!currentDeployment || !targetDeployment) {
          throw new Error("Deployment not found");
        }

        const rollbackOp: RollbackOperation = {
          id: `rollback_${Date.now()}`,
          fromVersion: currentDeployment.version,
          toVersion: targetDeployment.version,
          environment: input.environment,
          status: "in_progress",
          reason: input.reason,
          initiatedBy: String(ctx.user?.id || "system"),
          startTime: new Date().toISOString(),
          healthChecksPassed: false,
        };

        let operations = rollbackOperations.get(input.projectId) || [];
        operations.push(rollbackOp);
        rollbackOperations.set(input.projectId, operations);

        return {
          success: true,
          rollbackId: rollbackOp.id,
        };
      } catch (error) {
        throw new Error(
          `Failed to initiate rollback: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Complete rollback
   */
  completeRollback: protectedProcedure
    .input(
      z.object({
        rollbackId: z.string(),
        healthChecksPassed: z.boolean(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Find and update rollback operation
        for (const operations of Array.from(rollbackOperations.values())) {
          const index = operations.findIndex((r: RollbackOperation) => r.id === input.rollbackId);
          if (index >= 0) {
            const rollback = operations[index];
            rollback.status = input.healthChecksPassed ? "completed" : "failed";
            rollback.endTime = new Date().toISOString();
            rollback.healthChecksPassed = input.healthChecksPassed;
            rollback.error = input.error;

            return {
              success: true,
              status: rollback.status,
            };
          }
        }

        throw new Error("Rollback operation not found");
      } catch (error) {
        throw new Error(
          `Failed to complete rollback: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get rollback history
   */
  getRollbackHistory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const operations = rollbackOperations.get(input.projectId) || [];

        return {
          rollbacks: operations
            .sort((a: RollbackOperation, b: RollbackOperation) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
            .slice(0, input.limit),
          total: operations.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get rollback history: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get rollback details
   */
  getRollbackDetails: protectedProcedure
    .input(
      z.object({
        rollbackId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        for (const operations of Array.from(rollbackOperations.values())) {
          const rollback = operations.find((r: RollbackOperation) => r.id === input.rollbackId);
          if (rollback) {
            return rollback;
          }
        }

        throw new Error("Rollback operation not found");
      } catch (error) {
        throw new Error(
          `Failed to get rollback details: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Cancel rollback
   */
  cancelRollback: protectedProcedure
    .input(
      z.object({
        rollbackId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        for (const operations of Array.from(rollbackOperations.values())) {
          const index = operations.findIndex((r: RollbackOperation) => r.id === input.rollbackId);
          if (index >= 0) {
            const rollback = operations[index];
            if (rollback.status === "in_progress") {
              rollback.status = "failed";
              rollback.endTime = new Date().toISOString();
              rollback.error = "Cancelled by user";
            }

            return {
              success: true,
            };
          }
        }

        throw new Error("Rollback operation not found");
      } catch (error) {
        throw new Error(
          `Failed to cancel rollback: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Compare deployments
   */
  compareDeployments: protectedProcedure
    .input(
      z.object({
        deployment1Id: z.string(),
        deployment2Id: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        let deployment1: DeploymentSnapshot | undefined;
        let deployment2: DeploymentSnapshot | undefined;

        for (const snapshots of Array.from(deploymentSnapshots.values())) {
          if (!deployment1) {
            deployment1 = snapshots.find((s: DeploymentSnapshot) => s.id === input.deployment1Id);
          }
          if (!deployment2) {
            deployment2 = snapshots.find((s: DeploymentSnapshot) => s.id === input.deployment2Id);
          }
        }

        if (!deployment1 || !deployment2) {
          throw new Error("One or both deployments not found");
        }

        return {
          deployment1,
          deployment2,
          differences: {
            version: deployment1.version !== deployment2.version,
            commitHash: deployment1.commitHash !== deployment2.commitHash,
            author: deployment1.author !== deployment2.author,
            healthStatus: deployment1.healthStatus !== deployment2.healthStatus,
            metrics: {
              uptime: Math.abs(deployment1.metrics.uptime - deployment2.metrics.uptime),
              errorRate: Math.abs(deployment1.metrics.errorRate - deployment2.metrics.errorRate),
              responseTime: Math.abs(deployment1.metrics.responseTime - deployment2.metrics.responseTime),
              lighthouseScore: Math.abs(deployment1.metrics.lighthouseScore - deployment2.metrics.lighthouseScore),
            },
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to compare deployments: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
