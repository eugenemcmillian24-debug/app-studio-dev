import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";

export const devtoolsRouter = router({
  // Generate CLI installation command
  getCliInstallCommand: protectedProcedure.query(async ({ ctx }) => {
    const apiKey = `sk_${ctx.user?.id}_${Date.now()}`;
    return {
      command: `npm install -g appstudio-cli && appstudio login --key ${apiKey}`,
      apiKey,
    };
  }),

  // Generate IDE extension installation
  getIDEExtensionInfo: protectedProcedure
    .input(z.object({ ide: z.enum(["vscode", "jetbrains"]) }))
    .query(async ({ input }) => {
      const extensions: Record<string, any> = {
        vscode: {
          name: "AppStudio Generator",
          id: "appstudio.generator",
          marketplace: "https://marketplace.visualstudio.com/items?itemName=appstudio.generator",
          installCommand: "code --install-extension appstudio.generator",
        },
        jetbrains: {
          name: "AppStudio Generator",
          id: "com.appstudio.generator",
          marketplace: "https://plugins.jetbrains.com/plugin/appstudio-generator",
          installCommand: "Search 'AppStudio Generator' in JetBrains Marketplace",
        },
      };

      return extensions[input.ide];
    }),

  // Get Git integration setup
  getGitIntegrationSetup: protectedProcedure.query(async ({ ctx }) => {
    return {
      steps: [
        "1. Connect your GitHub account in Settings",
        "2. Enable auto-commit on generation",
        "3. Each generated project will auto-commit to your repo",
      ],
      webhook: "https://api.appstudio.com/webhooks/github",
      documentation: "https://docs.appstudio.com/git-integration",
    };
  }),

  // Get project versioning info
  getProjectVersioning: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async () => {
      return {
        versions: [
          { version: "1.0.0", createdAt: new Date(), tag: "latest" },
          { version: "0.9.0", createdAt: new Date(Date.now() - 86400000), tag: "stable" },
        ],
        currentVersion: "1.0.0",
        canRollback: true,
      };
    }),

  // Get API documentation
  getAPIDocumentation: protectedProcedure.query(async () => {
    return {
      baseUrl: "https://api.appstudio.com/v1",
      authentication: "Bearer token",
      endpoints: [
        {
          method: "POST",
          path: "/projects/generate",
          description: "Generate a new project",
        },
        {
          method: "GET",
          path: "/projects/:id",
          description: "Get project details",
        },
        {
          method: "GET",
          path: "/projects/:id/download",
          description: "Download project files",
        },
      ],
      documentation: "https://docs.appstudio.com/api",
    };
  }),

  // Get webhook configuration
  getWebhookConfig: protectedProcedure.query(async () => {
    return {
      events: [
        "generation.started",
        "generation.completed",
        "generation.failed",
        "project.shared",
        "project.forked",
      ],
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
      },
      documentation: "https://docs.appstudio.com/webhooks",
    };
  }),

  // Get local development setup
  getLocalDevSetup: protectedProcedure.query(async () => {
    return {
      requirements: ["Node.js 18+", "npm or yarn", "Git"],
      steps: [
        "1. Clone the generated project",
        "2. Run 'npm install'",
        "3. Copy .env.example to .env",
        "4. Run 'npm run dev'",
      ],
      documentation: "https://docs.appstudio.com/local-development",
    };
  }),
});
