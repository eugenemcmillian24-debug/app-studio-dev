/**
 * Webhook handlers for GitHub and Vercel events
 * Handles push events, PR updates, deployment status, and triggers auto-deployment
 */

import { Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "./db";
import {
  webhookDeliveries,
  projectGitHubRepos,
  projectVercelDeployments,
  vercelDeploymentHistory,
  gitHubVercelSyncLogs,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { VercelClient } from "./_core/vercel-client";

/**
 * Verify GitHub webhook signature
 */
export function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const digest = `sha256=${hmac.digest("hex")}`;
    // Ensure both buffers have the same length before comparison
    const digestBuf = Buffer.from(digest);
    const signatureBuf = Buffer.from(signature);
    if (digestBuf.length !== signatureBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(digestBuf, signatureBuf);
  } catch (error) {
    return false;
  }
}

/**
 * Verify Vercel webhook signature
 */
export function verifyVercelSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const digest = hmac.digest("hex");
    // Ensure both buffers have the same length before comparison
    const digestBuf = Buffer.from(digest);
    const signatureBuf = Buffer.from(signature);
    if (digestBuf.length !== signatureBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(digestBuf, signatureBuf);
  } catch (error) {
    return false;
  }
}

/**
 * GitHub Webhook Handler
 * Handles push, pull_request, and other GitHub events
 */
export async function handleGitHubWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-hub-signature-256"] as string;
    const deliveryId = req.headers["x-github-delivery"] as string;
    const eventType = req.headers["x-github-event"] as string;

    if (!signature || !deliveryId) {
      return res.status(400).json({ error: "Missing GitHub signature or delivery ID" });
    }

    // Verify signature
    const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
    const payload = JSON.stringify(req.body);

    if (!verifyGitHubSignature(payload, signature, secret)) {
      return res.status(401).json({ error: "Invalid GitHub signature" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const body = req.body;

    // Log webhook delivery
    await db.insert(webhookDeliveries).values({
      projectId: 0, // Will be updated based on repo
      webhookSource: "github",
      eventType,
      deliveryId,
      payload: JSON.stringify(body),
      isSuccessful: false,
    });

    // Handle push events
    if (eventType === "push") {
      await handleGitHubPush(db, body, deliveryId);
    }

    // Handle pull request events
    if (eventType === "pull_request") {
      await handleGitHubPullRequest(db, body, deliveryId);
    }

    // Handle issue events
    if (eventType === "issues") {
      await handleGitHubIssue(db, body, deliveryId);
    }

    // Mark webhook as processed
    await db
      .update(webhookDeliveries)
      .set({
        isSuccessful: true,
        processedAt: new Date(),
      })
      .where(eq(webhookDeliveries.deliveryId, deliveryId));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("GitHub webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Handle GitHub push event
 */
async function handleGitHubPush(db: any, payload: any, deliveryId: string) {
  try {
    const repoName = payload.repository?.name;
    const repoOwner = payload.repository?.owner?.login;
    const branch = payload.ref?.split("/").pop();
    const commitSha = payload.after;

    if (!repoName || !repoOwner) return;

    // Find linked project
    const repos = await db
      .select()
      .from(projectGitHubRepos)
      .where(eq(projectGitHubRepos.repoName, repoName))
      .limit(1);

    if (repos.length === 0) return;

    const repo = repos[0];
    const projectId = repo.projectId;

    // Get Vercel project
    const vercelProjects = await db
      .select()
      .from(projectVercelDeployments)
      .where(eq(projectVercelDeployments.projectId, projectId))
      .limit(1);

    if (vercelProjects.length === 0) return;

    const vercelProject = vercelProjects[0];

    // Check if auto-deploy is enabled
    if (!vercelProject.autoDeployEnabled) {
      // Log sync event
      await db.insert(gitHubVercelSyncLogs).values({
        projectId,
        syncType: "github_to_vercel",
        status: "completed",
        filesChanged: payload.commits?.length || 0,
        triggeredBy: "webhook",
      });
      return;
    }

    // Trigger Vercel deployment
    const vercelIntegrations = await db
      .select()
      .from(db.schema.vercelIntegrations)
      .where(eq(db.schema.vercelIntegrations.userId, repo.userId))
      .limit(1);

    if (vercelIntegrations.length === 0) return;

    const vercelIntegration = vercelIntegrations[0];
    const vercelClient = new VercelClient({
      accessToken: vercelIntegration.accessToken,
      teamId: vercelIntegration.teamId || undefined,
    });

    // Determine if production deployment
    const isProduction = branch === vercelProject.productionUrl ? true : false;

    const deployResult = await vercelClient.triggerDeployment(vercelProject.vercelProjectId, {
      projectId: vercelProject.vercelProjectId,
      gitCommitSha: commitSha,
      gitBranch: branch,
      production: isProduction,
    });

    if (deployResult.success && deployResult.deployment) {
      // Store deployment
      await db.insert(vercelDeploymentHistory).values({
        projectId,
        vercelDeploymentId: deployResult.deployment.id,
        vercelProjectId: vercelProject.vercelProjectId,
        status: "building",
        environment: isProduction ? "production" : "preview",
        gitCommitSha: commitSha,
        gitBranch: branch,
        gitCommitMessage: payload.head_commit?.message,
        deploymentUrl: deployResult.deployment.url,
      });

      // Update project status
      await db
        .update(projectVercelDeployments)
        .set({
          deploymentStatus: "building",
          lastDeploymentAt: new Date(),
          lastDeploymentStatus: "building",
        })
        .where(eq(projectVercelDeployments.projectId, projectId));
    }

    // Log sync event
    await db.insert(gitHubVercelSyncLogs).values({
      projectId,
      syncType: "github_to_vercel",
      status: "completed",
      filesChanged: payload.commits?.length || 0,
      triggeredBy: "webhook",
    });
  } catch (error) {
    console.error("GitHub push handler error:", error);
  }
}

/**
 * Handle GitHub pull request event
 */
async function handleGitHubPullRequest(db: any, payload: any, deliveryId: string) {
  try {
    const action = payload.action;
    const prNumber = payload.number;
    const repoName = payload.repository?.name;
    const repoOwner = payload.repository?.owner?.login;

    if (!repoName || !repoOwner) return;

    // Find linked project
    const repos = await db
      .select()
      .from(projectGitHubRepos)
      .where(eq(projectGitHubRepos.repoName, repoName))
      .limit(1);

    if (repos.length === 0) return;

    const repo = repos[0];

    // Log PR event
    console.log(`PR ${action}: #${prNumber} in ${repoOwner}/${repoName}`);

    // Could trigger additional workflows here (e.g., preview deployments, status checks)
  } catch (error) {
    console.error("GitHub PR handler error:", error);
  }
}

/**
 * Handle GitHub issue event
 */
async function handleGitHubIssue(db: any, payload: any, deliveryId: string) {
  try {
    const action = payload.action;
    const issueNumber = payload.issue?.number;
    const repoName = payload.repository?.name;
    const repoOwner = payload.repository?.owner?.login;

    if (!repoName || !repoOwner) return;

    // Find linked project
    const repos = await db
      .select()
      .from(projectGitHubRepos)
      .where(eq(projectGitHubRepos.repoName, repoName))
      .limit(1);

    if (repos.length === 0) return;

    const repo = repos[0];

    // Log issue event
    console.log(`Issue ${action}: #${issueNumber} in ${repoOwner}/${repoName}`);
  } catch (error) {
    console.error("GitHub issue handler error:", error);
  }
}

/**
 * Vercel Webhook Handler
 * Handles deployment status updates
 */
export async function handleVercelWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-vercel-signature"] as string;
    const deliveryId = req.headers["x-vercel-delivery-id"] as string;

    if (!signature || !deliveryId) {
      return res.status(400).json({ error: "Missing Vercel signature or delivery ID" });
    }

    // Verify signature
    const secret = process.env.VERCEL_WEBHOOK_SECRET || "";
    const payload = JSON.stringify(req.body);

    if (!verifyVercelSignature(payload, signature, secret)) {
      return res.status(401).json({ error: "Invalid Vercel signature" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const body = req.body;
    const eventType = body.type;

    // Log webhook delivery
    await db.insert(webhookDeliveries).values({
      projectId: 0, // Will be updated based on deployment
      webhookSource: "vercel",
      eventType,
      deliveryId,
      payload: JSON.stringify(body),
      isSuccessful: false,
    });

    // Handle deployment events
    if (eventType === "deployment.created" || eventType === "deployment.ready" || eventType === "deployment.error") {
      await handleVercelDeployment(db, body, deliveryId);
    }

    // Mark webhook as processed
    await db
      .update(webhookDeliveries)
      .set({
        isSuccessful: true,
        processedAt: new Date(),
      })
      .where(eq(webhookDeliveries.deliveryId, deliveryId));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Vercel webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Handle Vercel deployment event
 */
async function handleVercelDeployment(db: any, payload: any, deliveryId: string) {
  try {
    const deploymentId = payload.deployment?.id;
    const projectId = payload.project?.id;
    const status = payload.deployment?.state;
    const url = payload.deployment?.url;

    if (!deploymentId || !projectId) return;

    // Find linked project
    const vercelProjects = await db
      .select()
      .from(projectVercelDeployments)
      .where(eq(projectVercelDeployments.vercelProjectId, projectId))
      .limit(1);

    if (vercelProjects.length === 0) return;

    const vercelProject = vercelProjects[0];

    // Update deployment history
    const deployments = await db
      .select()
      .from(vercelDeploymentHistory)
      .where(eq(vercelDeploymentHistory.vercelDeploymentId, deploymentId))
      .limit(1);

    if (deployments.length > 0) {
      await db
        .update(vercelDeploymentHistory)
        .set({
          status,
          deploymentUrl: url,
          completedAt: new Date(),
        })
        .where(eq(vercelDeploymentHistory.vercelDeploymentId, deploymentId));
    }

    // Update project deployment status
    await db
      .update(projectVercelDeployments)
      .set({
        deploymentStatus: status,
        lastDeploymentStatus: status,
        ...(status === "ready" && { productionUrl: url }),
      })
      .where(eq(projectVercelDeployments.projectId, vercelProject.projectId));

    console.log(`Deployment ${deploymentId} status: ${status}`);
  } catch (error) {
    console.error("Vercel deployment handler error:", error);
  }
}

/**
 * Retry failed webhook deliveries
 */
export async function retryFailedWebhooks() {
  try {
    const db = await getDb();
    if (!db) return;

    // Find failed webhooks that need retry
    const failedWebhooks = await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.isSuccessful, false))
      .limit(10);

    for (const webhook of failedWebhooks) {
      if (webhook.retryCount >= webhook.maxRetries) {
        console.log(`Webhook ${webhook.deliveryId} exceeded max retries`);
        continue;
      }

      // Retry logic would go here
      // For now, just increment retry count
      await db
        .update(webhookDeliveries)
        .set({
          retryCount: webhook.retryCount + 1,
          nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
        })
        .where(eq(webhookDeliveries.deliveryId, webhook.deliveryId));
    }
  } catch (error) {
    console.error("Webhook retry error:", error);
  }
}
