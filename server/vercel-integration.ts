/**
 * Vercel integration router for AppStudio
 * Handles project creation, deployments, and environment variables
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { VercelClient } from "./_core/vercel-client";
import { getDb, getProjectById } from "./db";
import {
  vercelIntegrations,
  projectVercelDeployments,
  vercelDeploymentHistory,
  projectGitHubRepos,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Vercel Integration Router
 */
export const vercelIntegrationRouter = router({
  // ── Connection & Authentication ───────────────────────────────────────────────

  /**
   * Check Vercel connection status
   */
  checkConnection: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const integration = await db
        .select()
        .from(vercelIntegrations)
        .where(eq(vercelIntegrations.userId, ctx.user.id))
        .limit(1);

      if (integration.length === 0) {
        return {
          connected: false,
          message: "Vercel not connected",
        };
      }

      const vercelIntegration = integration[0];
      if (!vercelIntegration.isActive) {
        return {
          connected: false,
          message: "Vercel connection is inactive",
        };
      }

      // Verify token is still valid
      const client = new VercelClient({ accessToken: vercelIntegration.accessToken, teamId: vercelIntegration.teamId || undefined });
      const userResult = await client.getUser();

      if (!userResult.success) {
        return {
          connected: false,
          message: "Vercel token is invalid or expired",
        };
      }

      return {
        connected: true,
        user: userResult.user,
        connectedAt: vercelIntegration.connectedAt,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to check Vercel connection",
      });
    }
  }),

  /**
   * Get Vercel user info
   */
  getUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const integration = await db
        .select()
        .from(vercelIntegrations)
        .where(eq(vercelIntegrations.userId, ctx.user.id))
        .limit(1);

      if (integration.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Vercel not connected",
        });
      }

      const client = new VercelClient({ accessToken: integration[0].accessToken, teamId: integration[0].teamId || undefined });
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
        message: error instanceof Error ? error.message : "Failed to get Vercel user",
      });
    }
  }),

  // ── Project Management ────────────────────────────────────────────────────────

  /**
   * List user's Vercel projects
   */
  listProjects: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const integration = await db
        .select()
        .from(vercelIntegrations)
        .where(eq(vercelIntegrations.userId, ctx.user.id))
        .limit(1);

      if (integration.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Vercel not connected",
        });
      }

      const client = new VercelClient({ accessToken: integration[0].accessToken, teamId: integration[0].teamId || undefined });
      const result = await client.listProjects();

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error,
        });
      }

      return result.projects;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to list Vercel projects",
      });
    }
  }),

  /**
   * Create a new Vercel project for a generated app
   */
  createProject: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        projectName: z.string().min(1).max(100),
        framework: z.string().default("nextjs"),
        gitHubRepoId: z.number().optional(),
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

        // Get Vercel integration
        const integration = await db
          .select()
          .from(vercelIntegrations)
          .where(eq(vercelIntegrations.userId, ctx.user.id))
          .limit(1);

        if (integration.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Vercel not connected",
          });
        }

        // Get GitHub repo if linked
        let gitRepository: any = undefined;
        if (input.gitHubRepoId) {
          const githubRepo = await db
            .select()
            .from(projectGitHubRepos)
            .where(eq(projectGitHubRepos.id, input.gitHubRepoId))
            .limit(1);

          if (githubRepo.length > 0) {
            const repo = githubRepo[0];
            gitRepository = {
              repo: `${repo.repoOwner}/${repo.repoName}`,
              type: "github",
            };
          }
        }

        // Create Vercel project
        const client = new VercelClient({ accessToken: integration[0].accessToken, teamId: integration[0].teamId || undefined });
        const createResult = await client.createProject({
          name: input.projectName,
          framework: input.framework,
          gitRepository,
        });

        if (!createResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: createResult.error,
          });
        }

        // Store project link in database
        if (createResult.project) {
          await db.insert(projectVercelDeployments).values({
            projectId: input.projectId,
            userId: ctx.user.id,
            vercelProjectId: createResult.project.id,
            vercelProjectName: createResult.project.name,
            gitHubRepoId: input.gitHubRepoId,
            autoDeployEnabled: true,
            deploymentStatus: "idle",
          });
        }

        return {
          success: true,
          project: createResult.project,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create Vercel project",
        });
      }
    }),

  // ── Deployment Management ─────────────────────────────────────────────────────

  /**
   * List deployments for a project
   */
  listDeployments: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get Vercel project link
        const vercelProject = await db
          .select()
          .from(projectVercelDeployments)
          .where(eq(projectVercelDeployments.projectId, input.projectId))
          .limit(1);

        if (vercelProject.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vercel project not linked",
          });
        }

        const project = vercelProject[0];

        // Get Vercel integration
        const integration = await db
          .select()
          .from(vercelIntegrations)
          .where(eq(vercelIntegrations.userId, ctx.user.id))
          .limit(1);

        if (integration.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Vercel not connected",
          });
        }

        // List deployments
        const client = new VercelClient({ accessToken: integration[0].accessToken, teamId: integration[0].teamId || undefined });
        const result = await client.listDeployments(project.vercelProjectId, { limit: input.limit });

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error,
          });
        }

        return result.deployments;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to list deployments",
        });
      }
    }),

  /**
   * Trigger a deployment
   */
  triggerDeployment: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        gitCommitSha: z.string().optional(),
        gitBranch: z.string().optional(),
        production: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get Vercel project link
        const vercelProject = await db
          .select()
          .from(projectVercelDeployments)
          .where(eq(projectVercelDeployments.projectId, input.projectId))
          .limit(1);

        if (vercelProject.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vercel project not linked",
          });
        }

        const project = vercelProject[0];

        // Get Vercel integration
        const integration = await db
          .select()
          .from(vercelIntegrations)
          .where(eq(vercelIntegrations.userId, ctx.user.id))
          .limit(1);

        if (integration.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Vercel not connected",
          });
        }

        // Trigger deployment
        const client = new VercelClient({ accessToken: integration[0].accessToken, teamId: integration[0].teamId || undefined });
        const deployResult = await client.triggerDeployment(project.vercelProjectId, {
          projectId: project.vercelProjectId,
          gitCommitSha: input.gitCommitSha,
          gitBranch: input.gitBranch,
          production: input.production,
        });


        if (!deployResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: deployResult.error,
          });
        }

        // Store deployment in history
        if (deployResult.deployment) {
          await db.insert(vercelDeploymentHistory).values({
            projectId: input.projectId,
            vercelDeploymentId: deployResult.deployment.id,
            vercelProjectId: project.vercelProjectId,
            status: "building",
            environment: input.production ? "production" : "preview",
            gitCommitSha: input.gitCommitSha,
            gitBranch: input.gitBranch,
            deploymentUrl: deployResult.deployment.url,
          });

          // Update project deployment status
          await db
            .update(projectVercelDeployments)
            .set({
              deploymentStatus: "building",
              lastDeploymentAt: new Date(),
              lastDeploymentStatus: "building",
            })
            .where(eq(projectVercelDeployments.projectId, input.projectId));
        }

        return {
          success: true,
          deployment: deployResult.deployment,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to trigger deployment",
        });
      }
    }),

  /**
   * Get deployment status
   */
  getDeploymentStatus: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get Vercel integration
        const integration = await db
          .select()
          .from(vercelIntegrations)
          .where(eq(vercelIntegrations.userId, ctx.user.id))
          .limit(1);

        if (integration.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Vercel not connected",
          });
        }

        // Get deployment status
        const client = new VercelClient({ accessToken: integration[0].accessToken, teamId: integration[0].teamId || undefined });
        const result = await client.getDeployment(input.deploymentId);

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error,
          });
        }

        return result.deployment;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to get deployment status",
        });
      }
    }),

  // ── Environment Variables ─────────────────────────────────────────────────────

  /**
   * Get environment variables for a project
   */
  getEnvironmentVariables: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get Vercel project link
        const vercelProject = await db
          .select()
          .from(projectVercelDeployments)
          .where(eq(projectVercelDeployments.projectId, input.projectId))
          .limit(1);

        if (vercelProject.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vercel project not linked",
          });
        }

        const project = vercelProject[0];

        // Get Vercel integration
        const integration = await db
          .select()
          .from(vercelIntegrations)
          .where(eq(vercelIntegrations.userId, ctx.user.id))
          .limit(1);

        if (integration.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Vercel not connected",
          });
        }

        // Get environment variables
        const client = new VercelClient({ accessToken: integration[0].accessToken, teamId: integration[0].teamId || undefined });
        const result = await client.getEnvironmentVariables(project.vercelProjectId);

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error,
          });
        }

        return result.variables;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to get environment variables",
        });
      }
    }),

  /**
   * Set environment variables for a project
   */
  setEnvironmentVariables: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        variables: z.array(
          z.object({
            key: z.string(),
            value: z.string(),
            target: z.array(z.enum(["production", "preview", "development"])).optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get Vercel project link
        const vercelProject = await db
          .select()
          .from(projectVercelDeployments)
          .where(eq(projectVercelDeployments.projectId, input.projectId))
          .limit(1);

        if (vercelProject.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vercel project not linked",
          });
        }

        const project = vercelProject[0];

        // Get Vercel integration
        const integration = await db
          .select()
          .from(vercelIntegrations)
          .where(eq(vercelIntegrations.userId, ctx.user.id))
          .limit(1);

        if (integration.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Vercel not connected",
          });
        }

        // Set environment variables
        const client = new VercelClient({ accessToken: integration[0].accessToken, teamId: integration[0].teamId || undefined });
        const result = await client.setEnvironmentVariables(project.vercelProjectId, input.variables);

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error,
          });
        }

        return result.variables;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to set environment variables",
        });
      }
    }),
});
