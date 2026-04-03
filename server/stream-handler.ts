import { Request, Response } from "express";
import { generateScaffold } from "./scaffold-engine";
import { getMonthlyUsage, getSubscriptionByUserId, saveProject, logGeneration } from "./db";
import { TRPCError } from "@trpc/server";

/**
 * SSE (Server-Sent Events) handler for streaming scaffold generation progress.
 * Streams real-time updates as the LLM generates files.
 */
export async function handleScaffoldStream(
  req: Request,
  res: Response,
  userId: number | null
) {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Helper to send SSE message
  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Check quota if user is authenticated
    if (userId) {
      const subscription = await getSubscriptionByUserId(userId);
      if (!subscription) {
        sendEvent("error", { message: "No active subscription" });
        res.end();
        return;
      }

      const now = new Date();
      const usageRecord = await getMonthlyUsage(userId, now.getMonth() + 1, now.getFullYear());
      const limits: Record<string, number> = { free: 0, starter: 10, pro: 999 };
      const limit = limits[subscription.plan] || 0;
      const usage = usageRecord?.scaffoldsGenerated || 0;
      if (usage >= limit) {
        sendEvent("error", { message: "Monthly quota exceeded" });
        res.end();
        return;
      }
    }

    // Stream generation steps
    sendEvent("step", { stage: "analyzing", message: "Analyzing your prompt..." });
    await new Promise(resolve => setTimeout(resolve, 500));

    sendEvent("step", { stage: "generating_files", message: "Generating project files..." });
    await new Promise(resolve => setTimeout(resolve, 1000));

    sendEvent("step", { stage: "creating_schema", message: "Creating database schema..." });
    await new Promise(resolve => setTimeout(resolve, 800));

    sendEvent("step", { stage: "generating_config", message: "Generating configuration files..." });
    await new Promise(resolve => setTimeout(resolve, 600));

    // Generate the actual scaffold
    sendEvent("step", { stage: "llm_generation", message: "Running LLM generation..." });

    const scaffold = await generateScaffold(prompt);

    sendEvent("step", { stage: "finalizing", message: "Finalizing project..." });
    await new Promise(resolve => setTimeout(resolve, 300));

    // Save project if user is authenticated
    let projectId: number | null = null;
    if (userId) {
      projectId = await saveProject({
        userId,
        prompt,
        appName: scaffold.appName,
        appDescription: scaffold.appDescription,
        appCategory: scaffold.appCategory,
        techStack: JSON.stringify(scaffold.techStack),
        files: JSON.stringify(scaffold.files),
        sqlSchema: "",
        envExample: "",
        readmeContent: "",
        packageJson: "",
        aiModel: scaffold.aiModel,
        isPublic: false,
      });

      if (projectId) {
        const timeMatch = scaffold.aiModel.match(/(\d+)ms/);
        const responseTime = timeMatch ? parseInt(timeMatch[1]) : 0;
        await logGeneration({
          prompt,
          success: true,
        });
      }
    }

    // Send completion event with project data
    sendEvent("complete", {
      projectId: projectId || undefined,
      scaffold: {
        appName: scaffold.appName,
        appDescription: scaffold.appDescription,
        appCategory: scaffold.appCategory,
        techStack: scaffold.techStack,
        aiModel: scaffold.aiModel,
        fileCount: scaffold.files.length,
      },
    });

    res.end();
  } catch (error) {
    console.error("[Stream] Error:", error);
    sendEvent("error", {
      message: error instanceof Error ? error.message : "Generation failed",
    });
    res.end();
  }
}
