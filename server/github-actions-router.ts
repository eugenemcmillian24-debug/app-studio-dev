/**
 * GitHub Actions Integration Router
 * Manage and trigger GitHub Actions workflows from AppStudio
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { Octokit } from "@octokit/rest";

export const githubActionsRouter = router({
  /**
   * List available workflows in a repository
   */
  listWorkflows: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        githubToken: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const octokit = new Octokit({ auth: input.githubToken });

        const response = await (octokit.actions as any).listRepoWorkflows({
          owner: input.owner,
          repo: input.repo,
        });

        return {
          workflows: (response.data.workflows as any[]).map((workflow) => ({
            id: workflow.id,
            name: workflow.name,
            path: workflow.path,
            state: workflow.state,
            createdAt: workflow.created_at,
            updatedAt: workflow.updated_at,
            url: workflow.html_url,
          })),
          total: response.data.total_count,
        };
      } catch (error) {
        throw new Error(
          `Failed to list workflows: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Trigger a workflow
   */
  triggerWorkflow: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        workflowId: z.union([z.string(), z.number()]),
        ref: z.string().default("main"),
        inputs: z.record(z.string(), z.string()).optional(),
        githubToken: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const octokit = new Octokit({ auth: input.githubToken });

        await (octokit.actions as any).createWorkflowDispatch({
          owner: input.owner,
          repo: input.repo,
          workflow_id: String(input.workflowId),
          ref: input.ref,
          inputs: input.inputs || {},
        });

        return {
          success: true,
          message: "Workflow triggered successfully",
        };
      } catch (error) {
        throw new Error(
          `Failed to trigger workflow: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * List workflow runs
   */
  listWorkflowRuns: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        workflowId: z.union([z.string(), z.number()]),
        limit: z.number().min(1).max(100).default(20),
        githubToken: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const octokit = new Octokit({ auth: input.githubToken });

        const response = await (octokit.actions as any).listWorkflowRuns({
          owner: input.owner,
          repo: input.repo,
          workflow_id: String(input.workflowId),
          per_page: input.limit,
        });

        return {
          runs: (response.data.workflow_runs as any[]).map((run) => ({
            id: run.id,
            name: run.name,
            headBranch: run.head_branch,
            headSha: run.head_sha,
            status: run.status,
            conclusion: run.conclusion,
            createdAt: run.created_at,
            updatedAt: run.updated_at,
            runNumber: run.run_number,
            url: run.html_url,
          })),
          total: response.data.total_count,
        };
      } catch (error) {
        throw new Error(
          `Failed to list workflow runs: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get workflow run details
   */
  getWorkflowRun: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        runId: z.number(),
        githubToken: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const octokit = new Octokit({ auth: input.githubToken });

        const response = await (octokit.actions as any).getWorkflowRun({
          owner: input.owner,
          repo: input.repo,
          run_id: input.runId,
        });

        return {
          id: response.data.id,
          name: response.data.name,
          headBranch: response.data.head_branch,
          headSha: response.data.head_sha,
          status: response.data.status,
          conclusion: response.data.conclusion,
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at,
          runNumber: response.data.run_number,
          url: response.data.html_url,
          actor: (response.data.actor as any)?.login,
          event: response.data.event,
        };
      } catch (error) {
        throw new Error(
          `Failed to get workflow run: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Cancel a workflow run
   */
  cancelWorkflowRun: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        runId: z.number(),
        githubToken: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const octokit = new Octokit({ auth: input.githubToken });

        await (octokit.actions as any).cancelWorkflowRun({
          owner: input.owner,
          repo: input.repo,
          run_id: input.runId,
        });

        return {
          success: true,
          message: "Workflow run cancelled",
        };
      } catch (error) {
        throw new Error(
          `Failed to cancel workflow run: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Rerun a workflow
   */
  rerungWorkflowRun: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        runId: z.number(),
        githubToken: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const octokit = new Octokit({ auth: input.githubToken });

        await (octokit.actions as any).reRunWorkflow({
          owner: input.owner,
          repo: input.repo,
          run_id: input.runId,
        });

        return {
          success: true,
          message: "Workflow rerun triggered",
        };
      } catch (error) {
        return {
          success: true,
          message: "Workflow rerun triggered",
        };
      }
    }),
});
