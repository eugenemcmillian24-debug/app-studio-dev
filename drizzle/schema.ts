import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Stores every generated full-stack scaffold project.
 * `files` is a JSON string: Record<string, string> mapping filepath → content.
 */
export const generatedProjects = mysqlTable("generated_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  prompt: text("prompt").notNull(),
  appName: varchar("appName", { length: 128 }).notNull(),
  appDescription: text("appDescription").notNull(),
  appCategory: varchar("appCategory", { length: 32 }).notNull(),
  techStack: text("techStack").notNull(), // JSON array string
  files: text("files").notNull(),         // JSON: Record<string, string>
  sqlSchema: text("sqlSchema").notNull(),
  envExample: text("envExample").notNull(),
  readmeContent: text("readmeContent").notNull(),
  packageJson: text("packageJson").notNull(),
  aiModel: varchar("aiModel", { length: 64 }),
  isPublic: boolean("isPublic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GeneratedProject = typeof generatedProjects.$inferSelect;
export type InsertGeneratedProject = typeof generatedProjects.$inferInsert;

/**
 * Analytics log for every generation attempt.
 */
export const generationLogs = mysqlTable("generation_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  prompt: text("prompt"),
  success: boolean("success").default(true).notNull(),
  modelUsed: varchar("modelUsed", { length: 64 }),
  durationMs: int("durationMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GenerationLog = typeof generationLogs.$inferSelect;
export type InsertGenerationLog = typeof generationLogs.$inferInsert;

/**
 * User subscription and payment information.
 * Stores only essential Stripe identifiers; fetch other data from Stripe API.
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }).notNull().unique(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  plan: mysqlEnum("plan", ["free", "starter", "pro"]).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Track monthly scaffold generation quota usage per user.
 */
export const usageTracking = mysqlTable("usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: int("month").notNull(),  // 1-12
  year: int("year").notNull(),    // e.g., 2026
  scaffoldsGenerated: int("scaffoldsGenerated").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

/**
 * LLM provider configuration and performance metrics.
 */
export const llmProviders = mysqlTable("llm_providers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 32 }).notNull().unique(), // 'groq', 'gemini', 'openrouter'
  enabled: boolean("enabled").default(true).notNull(),
  avgResponseTimeMs: int("avgResponseTimeMs").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  totalRequests: int("totalRequests").default(0).notNull(),
  failedRequests: int("failedRequests").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LLMProvider = typeof llmProviders.$inferSelect;
export type InsertLLMProvider = typeof llmProviders.$inferInsert;
