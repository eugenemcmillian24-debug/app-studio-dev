/**
 * GitHub Actions CI/CD Integration Router
 * Manage GitHub Actions workflows for automated testing and deployment
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface WorkflowConfig {
  id: string;
  projectId: string;
  name: string;
  repository: string;
  workflowFile: string;
  branch: string;
  events: string[];
  status: "active" | "inactive";
  createdAt: string;
}

interface WorkflowRun {
  id: string;
  workflowId: string;
  runNumber: number;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "cancelled" | "skipped" | null;
  name: string;
  headBranch: string;
  headSha: string;
  runStartedAt: string;
  runCompletedAt?: string;
  duration?: number;
  jobs: Array<{
    id: string;
    name: string;
    status: string;
    conclusion: string | null;
    steps: Array<{
      name: string;
      status: string;
      conclusion: string | null;
    }>;
  }>;
}

interface TestResult {
  workflowRunId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage: number;
  duration: number;
  timestamp: string;
}

// In-memory storage (in production, use database)
const workflowConfigs = new Map<string, WorkflowConfig[]>();
const workflowRuns = new Map<string, WorkflowRun[]>();
const testResults = new Map<string, TestResult[]>();

export const githubActionsCICDRouter = router({
  /**
   * Create workflow configuration
   */
  createWorkflowConfig: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        repository: z.string(),
        workflowFile: z.string(),
        branch: z.string(),
        events: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const config: WorkflowConfig = {
          id: `workflow_${Date.now()}`,
          projectId: input.projectId,
          name: input.name,
          repository: input.repository,
          workflowFile: input.workflowFile,
          branch: input.branch,
          events: input.events,
          status: "active",
          createdAt: new Date().toISOString(),
        };

        let configs = workflowConfigs.get(input.projectId) || [];
        configs.push(config);
        workflowConfigs.set(input.projectId, configs);

        return {
          success: true,
          workflowId: config.id,
        };
      } catch (error) {
        throw new Error(
          `Failed to create workflow config: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get workflow configurations
   */
  getWorkflowConfigs: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const configs = workflowConfigs.get(input.projectId) || [];

        return {
          workflows: configs,
          total: configs.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get workflow configs: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Update workflow configuration
   */
  updateWorkflowConfig: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        projectId: z.string(),
        name: z.string().optional(),
        branch: z.string().optional(),
        events: z.array(z.string()).optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const configs = workflowConfigs.get(input.projectId) || [];
        const config = configs.find((c) => c.id === input.workflowId);

        if (!config) {
          throw new Error("Workflow config not found");
        }

        if (input.name) config.name = input.name;
        if (input.branch) config.branch = input.branch;
        if (input.events) config.events = input.events;
        if (input.status) config.status = input.status;

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to update workflow config: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Delete workflow configuration
   */
  deleteWorkflowConfig: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let configs = workflowConfigs.get(input.projectId) || [];
        const index = configs.findIndex((c) => c.id === input.workflowId);

        if (index < 0) {
          throw new Error("Workflow config not found");
        }

        configs.splice(index, 1);
        workflowConfigs.set(input.projectId, configs);

        // Clean up runs
        workflowRuns.delete(input.workflowId);
        testResults.delete(input.workflowId);

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to delete workflow config: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Record workflow run
   */
  recordWorkflowRun: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        runNumber: z.number(),
        status: z.enum(["queued", "in_progress", "completed"]),
        conclusion: z.enum(["success", "failure", "cancelled", "skipped"]).nullable(),
        name: z.string(),
        headBranch: z.string(),
        headSha: z.string(),
        runStartedAt: z.string(),
        runCompletedAt: z.string().optional(),
        jobs: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            status: z.string(),
            conclusion: z.string().nullable(),
            steps: z.array(
              z.object({
                name: z.string(),
                status: z.string(),
                conclusion: z.string().nullable(),
              })
            ),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const run: WorkflowRun = {
          id: `run_${Date.now()}`,
          workflowId: input.workflowId,
          runNumber: input.runNumber,
          status: input.status,
          conclusion: input.conclusion,
          name: input.name,
          headBranch: input.headBranch,
          headSha: input.headSha,
          runStartedAt: input.runStartedAt,
          runCompletedAt: input.runCompletedAt,
          duration: input.runCompletedAt
            ? (new Date(input.runCompletedAt).getTime() - new Date(input.runStartedAt).getTime()) / 1000
            : undefined,
          jobs: input.jobs,
        };

        let runs = workflowRuns.get(input.workflowId) || [];
        runs.push(run);
        workflowRuns.set(input.workflowId, runs.slice(-1000)); // Keep last 1000

        return {
          success: true,
          runId: run.id,
        };
      } catch (error) {
        throw new Error(
          `Failed to record workflow run: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get workflow runs
   */
  getWorkflowRuns: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const runs = workflowRuns.get(input.workflowId) || [];

        return {
          runs: runs
            .sort((a, b) => new Date(b.runStartedAt).getTime() - new Date(a.runStartedAt).getTime())
            .slice(0, input.limit),
          total: runs.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get workflow runs: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get workflow run details
   */
  getWorkflowRunDetails: protectedProcedure
    .input(
      z.object({
        runId: z.string(),
        workflowId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const runs = workflowRuns.get(input.workflowId) || [];
        const run = runs.find((r) => r.id === input.runId);

        if (!run) {
          throw new Error("Workflow run not found");
        }

        return run;
      } catch (error) {
        throw new Error(
          `Failed to get workflow run details: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Record test results
   */
  recordTestResults: protectedProcedure
    .input(
      z.object({
        workflowRunId: z.string(),
        workflowId: z.string(),
        totalTests: z.number(),
        passedTests: z.number(),
        failedTests: z.number(),
        skippedTests: z.number(),
        coverage: z.number(),
        duration: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result: TestResult = {
          workflowRunId: input.workflowRunId,
          totalTests: input.totalTests,
          passedTests: input.passedTests,
          failedTests: input.failedTests,
          skippedTests: input.skippedTests,
          coverage: input.coverage,
          duration: input.duration,
          timestamp: new Date().toISOString(),
        };

        let results = testResults.get(input.workflowId) || [];
        results.push(result);
        testResults.set(input.workflowId, results.slice(-1000)); // Keep last 1000

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to record test results: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get test results
   */
  getTestResults: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const results = testResults.get(input.workflowId) || [];

        const summary = {
          totalRuns: results.length,
          avgPassRate: results.length > 0
            ? (results.reduce((sum, r) => sum + (r.passedTests / r.totalTests), 0) / results.length * 100).toFixed(2)
            : "0",
          avgCoverage: results.length > 0
            ? (results.reduce((sum, r) => sum + r.coverage, 0) / results.length).toFixed(2)
            : "0",
          avgDuration: results.length > 0
            ? Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)
            : 0,
        };

        return {
          results: results
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, input.limit),
          summary,
          total: results.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get test results: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get test trends
   */
  getTestTrends: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const results = testResults.get(input.workflowId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const relevantResults = results.filter(
          (r) => new Date(r.timestamp) > cutoffDate
        );

        // Calculate trends
        const firstHalf = relevantResults.slice(0, Math.floor(relevantResults.length / 2));
        const secondHalf = relevantResults.slice(Math.floor(relevantResults.length / 2));

        const firstHalfPassRate = firstHalf.length > 0
          ? firstHalf.reduce((sum, r) => sum + (r.passedTests / r.totalTests), 0) / firstHalf.length * 100
          : 0;

        const secondHalfPassRate = secondHalf.length > 0
          ? secondHalf.reduce((sum, r) => sum + (r.passedTests / r.totalTests), 0) / secondHalf.length * 100
          : 0;

        const firstHalfCoverage = firstHalf.length > 0
          ? firstHalf.reduce((sum, r) => sum + r.coverage, 0) / firstHalf.length
          : 0;

        const secondHalfCoverage = secondHalf.length > 0
          ? secondHalf.reduce((sum, r) => sum + r.coverage, 0) / secondHalf.length
          : 0;

        return {
          period: `${input.days} days`,
          passRateTrend: secondHalfPassRate > firstHalfPassRate * 1.05 ? "improving" : secondHalfPassRate < firstHalfPassRate * 0.95 ? "degrading" : "stable",
          coverageTrend: secondHalfCoverage > firstHalfCoverage * 1.05 ? "improving" : secondHalfCoverage < firstHalfCoverage * 0.95 ? "degrading" : "stable",
          firstHalfAvgPassRate: parseFloat(firstHalfPassRate.toFixed(2)),
          secondHalfAvgPassRate: parseFloat(secondHalfPassRate.toFixed(2)),
          firstHalfAvgCoverage: parseFloat(firstHalfCoverage.toFixed(2)),
          secondHalfAvgCoverage: parseFloat(secondHalfCoverage.toFixed(2)),
          totalRuns: relevantResults.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get test trends: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get workflow statistics
   */
  getWorkflowStatistics: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const runs = workflowRuns.get(input.workflowId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const relevantRuns = runs.filter(
          (r) => new Date(r.runStartedAt) > cutoffDate
        );

        const successCount = relevantRuns.filter((r) => r.conclusion === "success").length;
        const failureCount = relevantRuns.filter((r) => r.conclusion === "failure").length;
        const cancelledCount = relevantRuns.filter((r) => r.conclusion === "cancelled").length;

        const avgDuration = relevantRuns.length > 0
          ? relevantRuns.reduce((sum, r) => sum + (r.duration || 0), 0) / relevantRuns.length
          : 0;

        return {
          period: `${input.days} days`,
          totalRuns: relevantRuns.length,
          successCount,
          failureCount,
          cancelledCount,
          successRate: relevantRuns.length > 0 ? ((successCount / relevantRuns.length) * 100).toFixed(2) : "0",
          avgDuration: Math.round(avgDuration),
          branches: Array.from(new Set(relevantRuns.map((r) => r.headBranch))),
        };
      } catch (error) {
        throw new Error(
          `Failed to get workflow statistics: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
