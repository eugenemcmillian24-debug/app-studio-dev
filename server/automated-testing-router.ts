/**
 * Automated Testing Integration Router
 * Manage pre-deployment testing with automatic rollback on failures
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface TestResult {
  id: string;
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  message?: string;
  error?: string;
}

interface TestRun {
  id: string;
  deploymentId: string;
  status: "running" | "passed" | "failed" | "cancelled";
  startTime: string;
  endTime?: string;
  results: TestResult[];
  coverage?: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  shouldRollback: boolean;
}

interface TestConfig {
  projectId: string;
  enabled: boolean;
  runBeforeDeploy: boolean;
  autoRollbackOnFailure: boolean;
  requiredCoverage: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  failureThreshold: number; // percentage of tests that can fail
  timeout: number; // in seconds
}

// In-memory storage (in production, use database)
const testRuns = new Map<string, TestRun>();
const testConfigs = new Map<string, TestConfig>();

export const automatedTestingRouter = router({
  /**
   * Get test configuration for a project
   */
  getTestConfig: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const config = testConfigs.get(input.projectId);

        if (!config) {
          return {
            projectId: input.projectId,
            enabled: false,
            runBeforeDeploy: false,
            autoRollbackOnFailure: false,
            requiredCoverage: {
              lines: 80,
              branches: 75,
              functions: 80,
              statements: 80,
            },
            failureThreshold: 0,
            timeout: 300,
          };
        }

        return config;
      } catch (error) {
        throw new Error(
          `Failed to get test config: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Update test configuration
   */
  updateTestConfig: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        enabled: z.boolean(),
        runBeforeDeploy: z.boolean(),
        autoRollbackOnFailure: z.boolean(),
        requiredCoverage: z.object({
          lines: z.number().min(0).max(100),
          branches: z.number().min(0).max(100),
          functions: z.number().min(0).max(100),
          statements: z.number().min(0).max(100),
        }),
        failureThreshold: z.number().min(0).max(100),
        timeout: z.number().min(10).max(3600),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const config: TestConfig = {
          projectId: input.projectId,
          enabled: input.enabled,
          runBeforeDeploy: input.runBeforeDeploy,
          autoRollbackOnFailure: input.autoRollbackOnFailure,
          requiredCoverage: input.requiredCoverage,
          failureThreshold: input.failureThreshold,
          timeout: input.timeout,
        };

        testConfigs.set(input.projectId, config);

        return {
          success: true,
          config,
        };
      } catch (error) {
        throw new Error(
          `Failed to update test config: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Start a test run
   */
  startTestRun: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        deploymentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const testRun: TestRun = {
          id: `test_${Date.now()}`,
          deploymentId: input.deploymentId,
          status: "running",
          startTime: new Date().toISOString(),
          results: [],
          shouldRollback: false,
        };

        testRuns.set(testRun.id, testRun);

        return {
          success: true,
          testRunId: testRun.id,
        };
      } catch (error) {
        throw new Error(
          `Failed to start test run: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Add test result
   */
  addTestResult: protectedProcedure
    .input(
      z.object({
        testRunId: z.string(),
        name: z.string(),
        status: z.enum(["passed", "failed", "skipped"]),
        duration: z.number(),
        message: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const testRun = testRuns.get(input.testRunId);

        if (!testRun) {
          throw new Error("Test run not found");
        }

        const result: TestResult = {
          id: `result_${Date.now()}`,
          name: input.name,
          status: input.status,
          duration: input.duration,
          message: input.message,
          error: input.error,
        };

        testRun.results.push(result);

        return {
          success: true,
          resultId: result.id,
        };
      } catch (error) {
        throw new Error(
          `Failed to add test result: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Complete test run
   */
  completeTestRun: protectedProcedure
    .input(
      z.object({
        testRunId: z.string(),
        coverage: z.object({
          lines: z.number(),
          branches: z.number(),
          functions: z.number(),
          statements: z.number(),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const testRun = testRuns.get(input.testRunId);

        if (!testRun) {
          throw new Error("Test run not found");
        }

        testRun.endTime = new Date().toISOString();
        testRun.coverage = input.coverage;

        // Determine status
        const failedTests = testRun.results.filter((r) => r.status === "failed").length;
        const totalTests = testRun.results.length;
        const failureRate = (failedTests / totalTests) * 100;

        testRun.status = failureRate === 0 ? "passed" : "failed";
        testRun.shouldRollback = failureRate > 0;

        testRuns.set(input.testRunId, testRun);

        return {
          success: true,
          status: testRun.status,
          shouldRollback: testRun.shouldRollback,
          summary: {
            total: totalTests,
            passed: totalTests - failedTests,
            failed: failedTests,
            failureRate: failureRate.toFixed(2),
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to complete test run: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get test run details
   */
  getTestRun: protectedProcedure
    .input(
      z.object({
        testRunId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const testRun = testRuns.get(input.testRunId);

        if (!testRun) {
          throw new Error("Test run not found");
        }

        return testRun;
      } catch (error) {
        throw new Error(
          `Failed to get test run: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get test runs for a deployment
   */
  getDeploymentTestRuns: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const runs = Array.from(testRuns.values())
          .filter((r) => r.deploymentId === input.deploymentId)
          .sort(
            (a, b) =>
              new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          )
          .slice(0, input.limit);

        return {
          runs,
          total: runs.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get deployment test runs: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Cancel test run
   */
  cancelTestRun: protectedProcedure
    .input(
      z.object({
        testRunId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const testRun = testRuns.get(input.testRunId);

        if (!testRun) {
          throw new Error("Test run not found");
        }

        testRun.status = "cancelled";
        testRun.endTime = new Date().toISOString();

        testRuns.set(input.testRunId, testRun);

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to cancel test run: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get test statistics
   */
  getTestStatistics: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const relevantRuns = Array.from(testRuns.values()).filter(
          (r) => new Date(r.startTime) > cutoffDate
        );

        const totalRuns = relevantRuns.length;
        const passedRuns = relevantRuns.filter((r) => r.status === "passed").length;
        const failedRuns = relevantRuns.filter((r) => r.status === "failed").length;

        const totalTests = relevantRuns.reduce((sum, r) => sum + r.results.length, 0);
        const passedTests = relevantRuns.reduce(
          (sum, r) => sum + r.results.filter((t) => t.status === "passed").length,
          0
        );

        const avgDuration =
          relevantRuns.reduce((sum, r) => {
            if (r.endTime) {
              return (
                sum +
                (new Date(r.endTime).getTime() -
                  new Date(r.startTime).getTime())
              );
            }
            return sum;
          }, 0) / (totalRuns || 1);

        return {
          period: `${input.days} days`,
          totalRuns,
          passedRuns,
          failedRuns,
          passRate: totalRuns > 0 ? ((passedRuns / totalRuns) * 100).toFixed(2) : "0",
          totalTests,
          passedTests,
          testPassRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : "0",
          avgDuration: Math.round(avgDuration),
        };
      } catch (error) {
        throw new Error(
          `Failed to get test statistics: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
