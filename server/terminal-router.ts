import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createProjectDirectory, executeCommand, cleanupProjectDirectory, cancelProcess } from "./terminal-executor";
import { getProjectById } from "./db";

export const terminalRouter = router({
  /**
   * Start a terminal session and run npm install
   */
  startSession: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const project = await getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        // Parse the scaffold data
        const scaffold = {
          appName: project.appName,
          appDescription: project.appDescription,
          appCategory: project.appCategory as any,
          techStack: JSON.parse(project.techStack),
          files: JSON.parse(project.files),
          sqlSchema: project.sqlSchema,
          envExample: project.envExample,
          readmeContent: project.readmeContent,
          packageJson: project.packageJson,
          aiModel: project.aiModel || "",
        };

        // Create project directory
        const projectDir = createProjectDirectory(scaffold);

        return {
          success: true,
          projectDir,
          message: "Project directory created. Ready to run npm install.",
        };
      } catch (error) {
        console.error("[Terminal] Session start error:", error);
        throw error;
      }
    }),

  /**
   * Run npm install in the project directory
   * Note: This is a placeholder. Real implementation would use SSE or WebSocket
   */
  runInstall: protectedProcedure
    .input(z.object({ projectDir: z.string() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: "npm install would run here (requires SSE/WebSocket for streaming)",
        projectDir: input.projectDir,
      };
    }),

  /**
   * Run npm run dev in the project directory
   * Note: This is a placeholder. Real implementation would use SSE or WebSocket
   */
  runDev: protectedProcedure
    .input(z.object({ projectDir: z.string() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: "npm run dev would run here (requires SSE/WebSocket for streaming)",
        projectDir: input.projectDir,
        devUrl: "http://localhost:3000",
      };
    }),

  /**
   * Cleanup project directory
   */
  cleanup: protectedProcedure
    .input(z.object({ projectDir: z.string() }))
    .mutation(async ({ input }) => {
      try {
        cleanupProjectDirectory(input.projectDir);
        return { success: true };
      } catch (error) {
        console.error("[Terminal] Cleanup error:", error);
        throw error;
      }
    }),
});
