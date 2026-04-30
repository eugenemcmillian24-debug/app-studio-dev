import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { generateScaffold } from "./scaffold-engine";
import { generateProjectZip } from "./zip-generator";
import { paymentRouter } from "./payment-router";
import { userRouter } from "./user-router";
import { adminRouter } from "./admin-router";
import { githubRouter } from "./github-router";
import { terminalRouter } from "./terminal-router";
import { templatesRouter } from "./templates-router";
import { notificationsRouter } from "./notifications-router";
import { collectionsRouter } from "./collections-router";
import { apiDocsRouter } from "./api-docs-router";
import { domainsRouter } from "./domains-router";
import { schemaEditorRouter } from "./schema-editor-router";
import { exportRouter } from "./export-router";
import { historyRouter } from "./history-router";
import { collaborationRouter } from "./collaboration-router";
import { themeRouter } from "./theme-router";
import { searchRouter } from "./search-router";
import { shortcutsRouter } from "./shortcuts-router";
import { githubIntegrationRouter } from "./github-integration-router";
import {
  saveProject,
  getProjectById,
  getUserProjects,
  getRecentPublicProjects,
  logGeneration,
  getSubscriptionByUserId,
  incrementUsage,
  getMonthlyUsage,

  getDb,
} from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ONE_YEAR_MS } from "@shared/const";
import { sdk } from "./_core/sdk";
import type { ScaffoldFile } from "../shared/scaffold-types";

// ─── Helper: parse stored JSON fields ────────────────────────────────────────

function parseProjectRow(row: {
  id: number;
  userId: number | null;
  prompt: string;
  appName: string;
  appDescription: string;
  appCategory: string;
  techStack: string;
  files: string;
  sqlSchema: string;
  envExample: string;
  readmeContent: string;
  packageJson: string;
  aiModel: string | null;
  isPublic: boolean;
  createdAt: Date;
}) {
  return {
    ...row,
    techStack: JSON.parse(row.techStack) as string[],
    files: JSON.parse(row.files) as ScaffoldFile[],
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  payment: paymentRouter,
  user: userRouter,
  admin: adminRouter,
  github: githubRouter,
  terminal: terminalRouter,
  templates: templatesRouter,
  notifications: notificationsRouter,
  collections: collectionsRouter,
  apiDocs: apiDocsRouter,
  domains: domainsRouter,
  schemaEditor: schemaEditorRouter,
  exports: exportRouter,
  history: historyRouter,
  collaboration: collaborationRouter,
  theme: themeRouter,
  search: searchRouter,
  shortcuts: shortcutsRouter,
  githubIntegration: githubIntegrationRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    signup: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
      }))
      .mutation(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          // Check if user exists
          const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
          if (existing.length > 0) {
            return { success: false, message: "Email already registered" };
          }

          // Hash password
          const passwordHash = await bcrypt.hash(input.password, 10);

          // Create user
          await db.insert(users).values({
            email: input.email,
            name: input.name,
            passwordHash,
            openId: `local_${Date.now()}`,
            loginMethod: "email",
            role: "user",
          });

          return { success: true, message: "Account created successfully" };
        } catch (error) {
          console.error("Signup error:", error);
          return { success: false, message: "Sign up failed" };
        }
      }),
    signin: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          // Find user by email
          const userRows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
          if (userRows.length === 0) {
            return { success: false, message: "Invalid email or password" };
          }

          const user = userRows[0];
          if (!user.passwordHash) {
            return { success: false, message: "This account uses OAuth only" };
          }

          // Verify password
          const isValid = await bcrypt.compare(input.password, user.passwordHash);
          if (!isValid) {
            return { success: false, message: "Invalid email or password" };
          }

          // Create session token and set cookie (same pattern as OAuth callback)
          const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "" });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          return { success: true, message: "Sign in successful", userId: user.id };
        } catch (error) {
          console.error("Signin error:", error);
          return { success: false, message: "Sign in failed" };
        }
      }),
  }),

  scaffold: router({
    // ── Generate a new scaffold (requires payment) ───────────────────────────
    generate: protectedProcedure
      .input(z.object({ prompt: z.string().min(10).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        const start = Date.now();
        const userId = ctx.user.id;

        // Check quota
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const subscription = await getSubscriptionByUserId(userId);
        const plan = (subscription?.plan || "free") as "free" | "starter" | "pro";
        const quotas = { free: 0, starter: 10, pro: 999 };
        const limit = quotas[plan];

        if (limit === 0) {
          throw new Error("Free plan has no scaffolds. Please upgrade to Starter or Pro.");
        }

        const usage = await getMonthlyUsage(userId, month, year);
        if (usage && usage.scaffoldsGenerated >= limit) {
          throw new Error(`Monthly quota exceeded. You have ${limit} scaffolds/month on ${plan} plan.`);
        }

        try {
          const scaffold = await generateScaffold(input.prompt);

          const projectId = await saveProject({
            userId,
            prompt: input.prompt,
            appName: scaffold.appName,
            appDescription: scaffold.appDescription,
            appCategory: scaffold.appCategory,
            techStack: JSON.stringify(scaffold.techStack),
            files: JSON.stringify(scaffold.files),
            sqlSchema: scaffold.sqlSchema,
            envExample: scaffold.envExample,
            readmeContent: scaffold.readmeContent,
            packageJson: scaffold.packageJson,
            aiModel: scaffold.aiModel ?? null,
            isPublic: true,
          });

          await logGeneration({
            userId,
            prompt: input.prompt,
            success: true,
            modelUsed: scaffold.aiModel,
            durationMs: Date.now() - start,
          });

          // Increment usage only after successful generation
          await incrementUsage(userId, month, year);

          return { success: true, projectId, scaffold };
        } catch (err) {
          await logGeneration({
            userId,
            prompt: input.prompt,
            success: false,
            durationMs: Date.now() - start,
          });
          throw err;
        }
      }),

    // ── Get a single project by ID ───────────────────────────────────────────
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const row = await getProjectById(input.id);
        if (!row) return null;
        return parseProjectRow(row);
      }),

    // ── Download zip as base64 ───────────────────────────────────────────────
    downloadZip: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const row = await getProjectById(input.id);
        if (!row) throw new Error("Project not found");

        const project = parseProjectRow(row);
        const buffer = await generateProjectZip({
          appName: project.appName,
          files: project.files,
          sqlSchema: project.sqlSchema,
          envExample: project.envExample,
          readmeContent: project.readmeContent,
          packageJson: project.packageJson,
        });

        return {
          filename: `${project.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.zip`,
          base64: buffer.toString("base64"),
        };
      }),

    // ── List recent public projects ──────────────────────────────────────────
    listRecent: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(24) }))
      .query(async ({ input }) => {
        const rows = await getRecentPublicProjects(input.limit);
        return rows.map(r => ({
          id: r.id,
          appName: r.appName,
          appDescription: r.appDescription,
          appCategory: r.appCategory,
          techStack: JSON.parse(r.techStack) as string[],
          aiModel: r.aiModel,
          createdAt: r.createdAt,
        }));
      }),

    // ── List user's own projects ─────────────────────────────────────────────
    listMine: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
      .query(async ({ ctx, input }) => {
        const rows = await getUserProjects(ctx.user.id, input.limit);
        return rows.map(r => ({
          id: r.id,
          appName: r.appName,
          appDescription: r.appDescription,
          appCategory: r.appCategory,
          techStack: JSON.parse(r.techStack) as string[],
          aiModel: r.aiModel,
          createdAt: r.createdAt,
        }));
      }),
  }),
});

export type AppRouter = typeof appRouter;
