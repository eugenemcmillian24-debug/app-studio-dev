/**
 * Advanced GitHub integration router for AppStudio
 * Handles OAuth, repo creation, 2-way sync, PRs, issues, and webhooks
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { GitHubClient } from "./_core/github-client";
import {
  getDb,
  getProjectById,
} from "./db";
import {
  githubIntegrations,
  vercelIntegrations,
  projectGitHubRepos,
  projectVercelDeployments,
  githubPullRequests,
  githubIssues,
  gitHubVercelSyncLogs,
  webhookDeliveries,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * GitHub Integration Router
 */
export const githubIntegrationAdvancedRouter = router({
  // ── OAuth & Connection ────────────────────────────────────────────────────────

  /**
   * Get GitHub OAuth authorization URL
   */
  getOAuthUrl: protectedProcedure.query(({ ctx }) => {
    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
    if (!clientId) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "GitHub OAuth not configured",
      });
    }

    const redirectUri = `${ctx.req.headers.origin}/api/github/callback`;
    const scope = "repo,user,workflow,admin:repo_hook";
    const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, timestamp: Date.now() })).toString("base64");

    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

    return { url };
  }),

  /**
   * Check GitHub connection status
   */
  checkConnection: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const integration = await db.select().from(githubIntegrations).where(eq(githubIntegrations.userId, ctx.user.id)).limit(1);

      if (integration.length === 0) {
        return {
          connected: false,
          message: "GitHub not connected",
        };
      }

      const ghIntegration = integration[0];
      if (!ghIntegration.isActive) {
        return {
          connected: false,
          message: "GitHub connection is inactive",
        };
      }

      // Verify token is still valid
      const client = new GitHubClient({ accessToken: ghIntegration.accessToken });
      const userResult = await client.getUser();

      if (!userResult.success) {
        return {
          connected: false,
          message: "GitHub token is invalid or expired",
        };
      }

      return {
        connected: true,
        user: userResult.user,
        connectedAt: ghIntegration.connectedAt,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to check GitHub connection",
      });
    }
  }),

  /**
   * Get GitHub user info
   */
  getUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const integration = await db.select().from(githubIntegrations).where(eq(githubIntegrations.userId, ctx.user.id)).limit(1);

      if (integration.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "GitHub not connected",
        });
      }

      const client = new GitHubClient({ accessToken: integration[0].accessToken });
      const result = await client.getUser();

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error,
        });
      }

      return result.user;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to get GitHub user",
      });
    }
  }),

  // ── Repository Management ─────────────────────────────────────────────────────

  /**
   * List user's GitHub repositories
   */
  listRepositories: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const integration = await db.select().from(githubIntegrations).where(eq(githubIntegrations.userId, ctx.user.id)).limit(1);

      if (integration.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "GitHub not connected",
        });
      }

      const client = new GitHubClient({ accessToken: integration[0].accessToken });
      const result = await client.listRepositories();

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error,
        });
      }

      return result.repositories;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to list repositories",
      });
    }
  }),

  /**
   * Create a new GitHub repository for a generated project
   */
  createRepository: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        repoName: z.string().min(1).max(100),
        description: z.string().optional(),
        isPrivate: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify project exists
        const project = await getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        // Get GitHub integration
        const integration = await db.select().from(githubIntegrations).where(eq(githubIntegrations.userId, ctx.user.id)).limit(1);

        if (integration.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "GitHub not connected",
          });
        }

        // Create repository
        const client = new GitHubClient({ accessToken: integration[0].accessToken });
        const createResult = await client.createRepository({
          name: input.repoName,
          description: input.description || project.appDescription,
          private: input.isPrivate,
          autoInit: true,
        });

        if (!createResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: createResult.error,
          });
        }

        // Store repository link in database
        if (createResult.repository) {
          await db.insert(projectGitHubRepos).values({
            projectId: input.projectId,
            userId: ctx.user.id,
            githubRepoId: createResult.repository.id,
            repoUrl: createResult.repository.url,
            repoName: createResult.repository.name,
            repoOwner: createResult.repository.fullName.split("/")[0],
            defaultBranch: createResult.repository.defaultBranch,
            syncStatus: "in_sync",
          });
        }

        return {
          success: true,
          repository: createResult.repository!,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create repository",
        });
      }
    }),

  /**
   * Push generated project files to GitHub repository
   */
  pushScaffold: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        repoName: z.string(),
        commitMessage: z.string().default("Initial commit from AppStudio"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get project
        const project = await getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        // Get GitHub integration
        const integration = await db.select().from(githubIntegrations).where(eq(githubIntegrations.userId, ctx.user.id)).limit(1);

        if (integration.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "GitHub not connected",
          });
        }

        // Get repository info
        const repoLink = await db.select().from(projectGitHubRepos).where(eq(projectGitHubRepos.projectId, input.projectId)).limit(1);

        if (repoLink.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Repository not linked to project",
          });
        }

        const repo = repoLink[0];

        // Parse project files
        const files = JSON.parse(project.files);
        const content: Record<string, string> = {};

        files.forEach((file: any) => {
          content[file.path] = file.content;
        });

        // Push files
        const client = new GitHubClient({ accessToken: integration[0].accessToken });
        const pushResult = await client.pushFiles(repo.repoOwner, repo.repoName, {
          branch: repo.defaultBranch,
          message: input.commitMessage,
          content,
        });

        if (!pushResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: pushResult.error,
          });
        }

        // Update sync status
        await db
          .update(projectGitHubRepos)
          .set({
            lastPushedAt: new Date(),
            lastSyncedAt: new Date(),
            syncStatus: "in_sync",
          })
          .where(eq(projectGitHubRepos.projectId, input.projectId));

        // Log sync
        await db.insert(gitHubVercelSyncLogs).values({
          projectId: input.projectId,
          syncType: "local_to_github",
          status: "completed",
          filesChanged: files.length,
          filesAdded: files.length,
          triggeredBy: "manual",
        });

        return {
          success: true,
          commit: pushResult.commit,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to push scaffold",
        });
      }
    }),

  // ── Pull Request Management ───────────────────────────────────────────────────

  /**
   * List pull requests for a repository
   */
  listPullRequests: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        state: z.enum(["open", "closed", "all"]).default("open"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get repository link
        const repoLink = await db.select().from(projectGitHubRepos).where(eq(projectGitHubRepos.projectId, input.projectId)).limit(1);

        if (repoLink.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Repository not linked to project",
          });
        }

        const repo = repoLink[0];

        // Get GitHub integration
        const integration = await db.select().from(githubIntegrations).where(eq(githubIntegrations.userId, ctx.user.id)).limit(1);

        if (integration.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "GitHub not connected",
          });
        }

        // List PRs
        const client = new GitHubClient({ accessToken: integration[0].accessToken });
        const result = await client.listPullRequests(repo.repoOwner, repo.repoName, {
          state: input.state as any,
        });

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error,
          });
        }

        return result.pullRequests;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to list pull requests",
        });
      }
    }),

  /**
   * Create a pull request
   */
  createPullRequest: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        sourceBranch: z.string().min(1),
        targetBranch: z.string().default("main"),
        draft: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get repository link
        const repoLink = await db.select().from(projectGitHubRepos).where(eq(projectGitHubRepos.projectId, input.projectId)).limit(1);

        if (repoLink.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Repository not linked to project",
          });
        }

        const repo = repoLink[0];

        // Get GitHub integration
        const integration = await db.select().from(githubIntegrations).where(eq(githubIntegrations.userId, ctx.user.id)).limit(1);

        if (integration.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "GitHub not connected",
          });
        }

        // Create PR
        const client = new GitHubClient({ accessToken: integration[0].accessToken });
        const result = await client.createPullRequest(repo.repoOwner, repo.repoName, {
          title: input.title,
          body: input.description,
          head: input.sourceBranch,
          base: input.targetBranch,
          draft: input.draft,
        });

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error,
          });
        }

        // Store PR in database
        if (result.pullRequest) {
          await db.insert(githubPullRequests).values({
            projectId: input.projectId,
            githubRepoId: repo.githubRepoId,
            prNumber: result.pullRequest.number,
            prTitle: input.title,
            prDescription: input.description,
            author: integration[0].githubUsername,
            sourceBranch: input.sourceBranch,
            targetBranch: input.targetBranch,
            status: "open",
          });
        }

        return {
          success: true,
          pullRequest: result.pullRequest!,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create pull request",
        });
      }
    }),

  // ── Issue Management ──────────────────────────────────────────────────────────

  /**
   * List issues for a repository
   */
  listIssues: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        state: z.enum(["open", "closed", "all"]).default("open"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get repository link
        const repoLink = await db.select().from(projectGitHubRepos).where(eq(projectGitHubRepos.projectId, input.projectId)).limit(1);

        if (repoLink.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Repository not linked to project",
          });
        }

        const repo = repoLink[0];

        // Get GitHub integration
        const integration = await db.select().from(githubIntegrations).where(eq(githubIntegrations.userId, ctx.user.id)).limit(1);

        if (integration.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "GitHub not connected",
          });
        }

        // List issues
        const client = new GitHubClient({ accessToken: integration[0].accessToken });
        const result = await client.listIssues(repo.repoOwner, repo.repoName, {
          state: input.state as any,
        });

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error,
          });
        }

        return result.issues;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to list issues",
        });
      }
    }),

  /**
   * Create an issue
   */
  createIssue: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        labels: z.array(z.string()).optional(),
        assignees: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get repository link
        const repoLink = await db.select().from(projectGitHubRepos).where(eq(projectGitHubRepos.projectId, input.projectId)).limit(1);

        if (repoLink.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Repository not linked to project",
          });
        }

        const repo = repoLink[0];

        // Get GitHub integration
        const integration = await db.select().from(githubIntegrations).where(eq(githubIntegrations.userId, ctx.user.id)).limit(1);

        if (integration.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "GitHub not connected",
          });
        }

        // Create issue
        const client = new GitHubClient({ accessToken: integration[0].accessToken });
        const result = await client.createIssue(repo.repoOwner, repo.repoName, {
          title: input.title,
          body: input.description,
          labels: input.labels,
          assignees: input.assignees,
        });

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error,
          });
        }

        // Store issue in database
        if (result.issue) {
          await db.insert(githubIssues).values({
            projectId: input.projectId,
            githubRepoId: repo.githubRepoId,
            issueNumber: result.issue.number,
            issueTitle: input.title,
            issueDescription: input.description,
            author: integration[0].githubUsername,
            status: "open",
            labels: input.labels ? JSON.stringify(input.labels) : null,
            assignees: input.assignees ? JSON.stringify(input.assignees) : null,
          });
        }

        return {
          success: true,
          issue: result.issue!,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create issue",
        });
      }
    }),
});
