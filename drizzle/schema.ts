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
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: text("passwordHash"), // For email/password auth
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

/**
 * User project favorites and metadata.
 */
export const userProjects = mysqlTable("user_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  customName: varchar("customName", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProject = typeof userProjects.$inferSelect;
export type InsertUserProject = typeof userProjects.$inferInsert;

/**
 * User settings and preferences.
 */
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  theme: mysqlEnum("theme", ["light", "dark"]).default("dark").notNull(),
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  githubUsername: varchar("githubUsername", { length: 64 }),
  githubToken: text("githubToken"), // Encrypted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * Encrypted environment variables stored per user.
 * Used for Supabase, Vercel, and other credentials.
 */
export const userEnvVariables = mysqlTable("user_env_variables", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  key: varchar("key", { length: 128 }).notNull(), // e.g., SUPABASE_URL
  encryptedValue: text("encryptedValue").notNull(), // AES-256 encrypted
  category: varchar("category", { length: 32 }).notNull(), // 'supabase', 'vercel', 'github'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserEnvVariable = typeof userEnvVariables.$inferSelect;
export type InsertUserEnvVariable = typeof userEnvVariables.$inferInsert;

/**
 * GitHub repository integration for generated projects.
 */
export const githubRepos = mysqlTable("github_repos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  repoUrl: varchar("repoUrl", { length: 256 }).notNull(),
  repoName: varchar("repoName", { length: 128 }).notNull(),
  repoOwner: varchar("repoOwner", { length: 128 }).notNull(),
  lastPushedAt: timestamp("lastPushedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GitHubRepo = typeof githubRepos.$inferSelect;
export type InsertGitHubRepo = typeof githubRepos.$inferInsert;

/**
 * Email notifications log for quota warnings, generation status, etc.
 */
export const emailNotifications = mysqlTable("email_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["quota_warning", "generation_complete", "payment_receipt", "system_alert"]).notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;

/**
 * Project templates for quick scaffolding.
 */
export const projectTemplates = mysqlTable("project_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  prompt: text("prompt").notNull(),
  techStack: text("techStack").notNull(),
  icon: varchar("icon", { length: 64 }),
  isPublic: boolean("isPublic").default(true).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertProjectTemplate = typeof projectTemplates.$inferInsert;

/**
 * API documentation for generated projects.
 */
export const apiDocumentation = mysqlTable("api_documentation", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  openApiSpec: text("openApiSpec").notNull(),
  swaggerUrl: varchar("swaggerUrl", { length: 256 }),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiDocumentation = typeof apiDocumentation.$inferSelect;
export type InsertApiDocumentation = typeof apiDocumentation.$inferInsert;

/**
 * Database schema editor: stores user modifications to generated schemas.
 */
export const schemaEdits = mysqlTable("schema_edits", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  originalSchema: text("originalSchema").notNull(),
  modifiedSchema: text("modifiedSchema").notNull(),
  changeDescription: text("changeDescription"),
  appliedAt: timestamp("appliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SchemaEdit = typeof schemaEdits.$inferSelect;
export type InsertSchemaEdit = typeof schemaEdits.$inferInsert;

/**
 * Project collections for organizing user's projects.
 */
export const projectCollections = mysqlTable("project_collections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#6366f1"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectCollection = typeof projectCollections.$inferSelect;
export type InsertProjectCollection = typeof projectCollections.$inferInsert;

/**
 * Junction table: projects in collections.
 */
export const collectionProjects = mysqlTable("collection_projects", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collectionId").notNull(),
  projectId: int("projectId").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type CollectionProject = typeof collectionProjects.$inferSelect;
export type InsertCollectionProject = typeof collectionProjects.$inferInsert;

/**
 * Collaborative sharing: team members access to projects.
 */
export const projectShares = mysqlTable("project_shares", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  ownerId: int("ownerId").notNull(),
  sharedWithEmail: varchar("sharedWithEmail", { length: 320 }).notNull(),
  permission: mysqlEnum("permission", ["view", "edit", "admin"]).default("view").notNull(),
  sharedAt: timestamp("sharedAt").defaultNow().notNull(),
});

export type ProjectShare = typeof projectShares.$inferSelect;
export type InsertProjectShare = typeof projectShares.$inferInsert;

/**
 * Custom domains for deployed generated apps.
 */
export const customDomains = mysqlTable("custom_domains", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  domain: varchar("domain", { length: 256 }).notNull().unique(),
  verificationToken: varchar("verificationToken", { length: 128 }),
  isVerified: boolean("isVerified").default(false).notNull(),
  deploymentUrl: varchar("deploymentUrl", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  verifiedAt: timestamp("verifiedAt"),
});

export type CustomDomain = typeof customDomains.$inferSelect;
export type InsertCustomDomain = typeof customDomains.$inferInsert;

/**
 * Generation history with detailed metadata.
 */
export const generationHistory = mysqlTable("generation_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  prompt: text("prompt").notNull(),
  llmProvider: varchar("llmProvider", { length: 32 }),
  tokenCount: int("tokenCount"),
  durationMs: int("durationMs"),
  success: boolean("success").default(true).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GenerationHistory = typeof generationHistory.$inferSelect;
export type InsertGenerationHistory = typeof generationHistory.$inferInsert;

/**
 * Export format preferences for projects.
 */
export const exportFormats = mysqlTable("export_formats", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  format: mysqlEnum("format", ["individual", "monorepo", "turborepo"]).default("individual").notNull(),
  exportedAt: timestamp("exportedAt").defaultNow().notNull(),
  downloadUrl: varchar("downloadUrl", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExportFormat = typeof exportFormats.$inferSelect;
export type InsertExportFormat = typeof exportFormats.$inferInsert;
