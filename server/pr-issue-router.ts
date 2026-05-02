/**
 * Pull Request and Issue Management Router
 * Handles creation, management, and tracking of PRs and issues
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { Octokit } from "@octokit/rest";

export const prIssueRouter = router({
  /**
   * List pull requests for a repository
   */
  listPullRequests: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        state: z.enum(["open", "closed", "all"]).default("open"),
        limit: z.number().min(1).max(100).default(20),
        githubToken: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const token = input.githubToken;
        if (!token) {
          throw new Error("GitHub token not found");
        }

        const octokit = new Octokit({ auth: token });

        const response = await octokit.pulls.list({
          owner: input.owner,
          repo: input.repo,
          state: input.state,
          per_page: input.limit,
        });

        return {
          pullRequests: response.data.map((pr: any) => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            description: pr.body,
            state: pr.state,
            author: pr.user?.login,
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            url: pr.html_url,
            commits: pr.commits || 0,
            additions: pr.additions || 0,
            deletions: pr.deletions || 0,
            changedFiles: pr.changed_files || 0,
          })),
          total: response.data.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to list pull requests: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Create a pull request
   */
  createPullRequest: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        title: z.string(),
        description: z.string().optional(),
        head: z.string(), // source branch
        base: z.string(), // target branch
        draft: z.boolean().default(false),
        githubToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const token = input.githubToken;
        if (!token) {
          throw new Error("GitHub token not found");
        }

        const octokit = new Octokit({ auth: token });

        const response = await octokit.pulls.create({
          owner: input.owner,
          repo: input.repo,
          title: input.title,
          body: input.description,
          head: input.head,
          base: input.base,
          draft: input.draft,
        });

        return {
          success: true,
          pullRequest: {
            id: response.data.id,
            number: response.data.number,
            title: response.data.title,
            url: response.data.html_url,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to create pull request: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get pull request details
   */
  getPullRequest: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        prNumber: z.number(),
        githubToken: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const token = input.githubToken;
        if (!token) {
          throw new Error("GitHub token not found");
        }

        const octokit = new Octokit({ auth: token });

        const response = await octokit.pulls.get({
          owner: input.owner,
          repo: input.repo,
          pull_number: input.prNumber,
        });

        return {
          id: response.data.id,
          number: response.data.number,
          title: response.data.title,
          description: response.data.body,
          state: response.data.state,
          author: response.data.user?.login,
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at,
          mergedAt: response.data.merged_at,
          url: response.data.html_url,
          commits: response.data.commits,
          additions: response.data.additions,
          deletions: response.data.deletions,
          changedFiles: response.data.changed_files,
          reviewComments: response.data.review_comments,
        };
      } catch (error) {
        throw new Error(
          `Failed to get pull request: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * List issues for a repository
   */
  listIssues: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        state: z.enum(["open", "closed", "all"]).default("open"),
        labels: z.array(z.string()).optional(),
        limit: z.number().min(1).max(100).default(20),
        githubToken: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const token = input.githubToken;
        if (!token) {
          throw new Error("GitHub token not found");
        }

        const octokit = new Octokit({ auth: token });

        const response = await octokit.issues.listForRepo({
          owner: input.owner,
          repo: input.repo,
          state: input.state,
          labels: input.labels?.join(","),
          per_page: input.limit,
        });

        return {
          issues: response.data.map((issue) => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            description: issue.body,
            state: issue.state,
            author: issue.user?.login,
            labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name)),
            createdAt: issue.created_at,
            updatedAt: issue.updated_at,
            url: issue.html_url,
            comments: issue.comments,
          })),
          total: response.data.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to list issues: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Create an issue
   */
  createIssue: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        title: z.string(),
        description: z.string().optional(),
        labels: z.array(z.string()).optional(),
        assignees: z.array(z.string()).optional(),
        githubToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const token = input.githubToken;
        if (!token) {
          throw new Error("GitHub token not found");
        }

        const octokit = new Octokit({ auth: token });

        const response = await octokit.issues.create({
          owner: input.owner,
          repo: input.repo,
          title: input.title,
          body: input.description,
          labels: input.labels,
          assignees: input.assignees,
        });

        return {
          success: true,
          issue: {
            id: response.data.id,
            number: response.data.number,
            title: response.data.title,
            url: response.data.html_url,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to create issue: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get issue details
   */
  getIssue: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        issueNumber: z.number(),
        githubToken: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const token = input.githubToken;
        if (!token) {
          throw new Error("GitHub token not found");
        }

        const octokit = new Octokit({ auth: token });

        const response = await octokit.issues.get({
          owner: input.owner,
          repo: input.repo,
          issue_number: input.issueNumber,
        });

        return {
          id: response.data.id,
          number: response.data.number,
          title: response.data.title,
          description: response.data.body,
          state: response.data.state,
          author: response.data.user?.login,
          labels: response.data.labels.map((l) => (typeof l === "string" ? l : l.name)),
          assignees: response.data.assignees?.map((a) => a.login),
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at,
          closedAt: response.data.closed_at,
          url: response.data.html_url,
          comments: response.data.comments,
        };
      } catch (error) {
        throw new Error(
          `Failed to get issue: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Add comment to issue or PR
   */
  addComment: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        issueNumber: z.number(),
        comment: z.string(),
        githubToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const token = input.githubToken;
        if (!token) {
          throw new Error("GitHub token not found");
        }

        const octokit = new Octokit({ auth: token });

        const response = await octokit.issues.createComment({
          owner: input.owner,
          repo: input.repo,
          issue_number: input.issueNumber,
          body: input.comment,
        });

        return {
          success: true,
          comment: {
            id: response.data.id,
            author: response.data.user?.login,
            body: response.data.body,
            createdAt: response.data.created_at,
            url: response.data.html_url,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to add comment: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Close issue or PR
   */
  closeIssue: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        issueNumber: z.number(),
        reason: z.string().optional(),
        githubToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const token = input.githubToken;
        if (!token) {
          throw new Error("GitHub token not found");
        }

        const octokit = new Octokit({ auth: token });

        const response = await octokit.issues.update({
          owner: input.owner,
          repo: input.repo,
          issue_number: input.issueNumber,
          state: "closed",
        });

        return {
          success: true,
          issue: {
            id: response.data.id,
            number: response.data.number,
            state: response.data.state,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to close issue: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Merge pull request
   */
  mergePullRequest: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        prNumber: z.number(),
        mergeMethod: z.enum(["merge", "squash", "rebase"]).default("merge"),
        commitTitle: z.string().optional(),
        commitMessage: z.string().optional(),
        githubToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const token = input.githubToken;
        if (!token) {
          throw new Error("GitHub token not found");
        }

        const octokit = new Octokit({ auth: token });

        const response = await octokit.pulls.merge({
          owner: input.owner,
          repo: input.repo,
          pull_number: input.prNumber,
          merge_method: input.mergeMethod,
          commit_title: input.commitTitle,
          commit_message: input.commitMessage,
        });

        return {
          success: true,
          merged: response.data.merged,
          sha: response.data.sha,
          message: response.data.message,
        };
      } catch (error) {
        throw new Error(
          `Failed to merge pull request: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
