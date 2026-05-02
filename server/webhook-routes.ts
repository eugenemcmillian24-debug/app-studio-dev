/**
 * Express routes for GitHub and Vercel webhooks
 */

import { Router, Request, Response } from "express";
import { handleGitHubWebhook, handleVercelWebhook, retryFailedWebhooks } from "./webhooks";

const webhookRouter = Router();

/**
 * GitHub webhook endpoint
 * POST /api/webhooks/github
 */
webhookRouter.post("/github", async (req: Request, res: Response) => {
  await handleGitHubWebhook(req, res);
});

/**
 * Vercel webhook endpoint
 * POST /api/webhooks/vercel
 */
webhookRouter.post("/vercel", async (req: Request, res: Response) => {
  await handleVercelWebhook(req, res);
});

/**
 * Health check endpoint
 * GET /api/webhooks/health
 */
webhookRouter.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * Retry failed webhooks endpoint
 * POST /api/webhooks/retry
 */
webhookRouter.post("/retry", async (req: Request, res: Response) => {
  try {
    await retryFailedWebhooks();
    res.json({ success: true, message: "Webhook retry initiated" });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Retry failed" });
  }
});

export default webhookRouter;
