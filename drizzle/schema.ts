import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
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


/**
 * Project analytics: views, downloads, engagement metrics
 */
export const projectAnalytics = mysqlTable("project_analytics", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  views: int("views").default(0).notNull(),
  downloads: int("downloads").default(0).notNull(),
  forks: int("forks").default(0).notNull(),
  stars: int("stars").default(0).notNull(),
  lastViewedAt: timestamp("lastViewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectAnalytics = typeof projectAnalytics.$inferSelect;
export type InsertProjectAnalytics = typeof projectAnalytics.$inferInsert;

/**
 * Generation analytics: LLM costs, tokens, success rates
 */
export const generationAnalytics = mysqlTable("generation_analytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  llmProvider: varchar("llmProvider", { length: 64 }).notNull(),
  tokensUsed: int("tokensUsed").notNull(),
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 4 }),
  generationTime: int("generationTime"), // milliseconds
  success: boolean("success").default(true).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GenerationAnalytics = typeof generationAnalytics.$inferSelect;
export type InsertGenerationAnalytics = typeof generationAnalytics.$inferInsert;

/**
 * User activity tracking
 */
export const userActivity = mysqlTable("user_activity", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 64 }).notNull(), // "view", "download", "generate", "share", etc
  projectId: int("projectId"),
  metadata: text("metadata"), // JSON
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = typeof userActivity.$inferInsert;

/**
 * Team workspaces for collaboration
 */
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 128 }).unique().notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * Team members with roles
 */
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "editor", "viewer"]).default("viewer").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * Project comments and feedback
 */
export const projectComments = mysqlTable("project_comments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  parentCommentId: int("parentCommentId"), // For nested replies
  likes: int("likes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectComment = typeof projectComments.$inferSelect;
export type InsertProjectComment = typeof projectComments.$inferInsert;

/**
 * Real-time collaborative editing sessions
 */
export const collaborationSessions = mysqlTable("collaboration_sessions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sessionToken: varchar("sessionToken", { length: 256 }).unique().notNull(),
  activeUsers: int("activeUsers").default(0).notNull(),
  lastActivity: timestamp("lastActivity").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type InsertCollaborationSession = typeof collaborationSessions.$inferInsert;

/**
 * LLM model preferences and comparisons
 */
export const llmModelPreferences = mysqlTable("llm_model_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  preferredModel: varchar("preferredModel", { length: 64 }).notNull(),
  costPerMillion: decimal("costPerMillion", { precision: 10, scale: 4 }),
  speedRating: int("speedRating"), // 1-5
  qualityRating: int("qualityRating"), // 1-5
  lastUsed: timestamp("lastUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LLMModelPreference = typeof llmModelPreferences.$inferSelect;
export type InsertLLMModelPreference = typeof llmModelPreferences.$inferInsert;

/**
 * Batch generation jobs
 */
export const batchJobs = mysqlTable("batch_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jobId: varchar("jobId", { length: 128 }).unique().notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  totalItems: int("totalItems").notNull(),
  completedItems: int("completedItems").default(0).notNull(),
  failedItems: int("failedItems").default(0).notNull(),
  inputFile: varchar("inputFile", { length: 256 }), // S3 path
  outputFile: varchar("outputFile", { length: 256 }), // S3 path
  errorLog: text("errorLog"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type BatchJob = typeof batchJobs.$inferSelect;
export type InsertBatchJob = typeof batchJobs.$inferInsert;

/**
 * Project marketplace listings
 */
export const marketplaceListings = mysqlTable("marketplace_listings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sellerId: int("sellerId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  tags: text("tags"), // JSON array
  downloads: int("downloads").default(0).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviews: int("reviews").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = typeof marketplaceListings.$inferInsert;

/**
 * Referral program tracking
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId"),
  referralCode: varchar("referralCode", { length: 32 }).unique().notNull(),
  status: mysqlEnum("status", ["pending", "activated", "rewarded"]).default("pending").notNull(),
  rewardCredits: int("rewardCredits").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  activatedAt: timestamp("activatedAt"),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Webhook integrations
 */
export const webhooks = mysqlTable("webhooks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  events: text("events").notNull(), // JSON array: ["generation.complete", "project.shared", ...]
  secret: varchar("secret", { length: 256 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastTriggered: timestamp("lastTriggered"),
  failureCount: int("failureCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;

/**
 * Security scanning results
 */
export const securityScans = mysqlTable("security_scans", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  scanType: varchar("scanType", { length: 64 }).notNull(), // "dependency", "code", "config"
  vulnerabilities: int("vulnerabilities").default(0).notNull(),
  warnings: int("warnings").default(0).notNull(),
  criticalIssues: int("criticalIssues").default(0).notNull(),
  report: text("report"), // JSON
  status: mysqlEnum("status", ["passed", "warning", "failed"]).default("passed").notNull(),
  scannedAt: timestamp("scannedAt").defaultNow().notNull(),
});

export type SecurityScan = typeof securityScans.$inferSelect;
export type InsertSecurityScan = typeof securityScans.$inferInsert;

/**
 * Accessibility audit reports
 */
export const accessibilityAudits = mysqlTable("accessibility_audits", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  score: int("score"), // 0-100
  issues: int("issues").default(0).notNull(),
  wcagLevel: varchar("wcagLevel", { length: 8 }), // A, AA, AAA
  report: text("report"), // JSON
  auditedAt: timestamp("auditedAt").defaultNow().notNull(),
});

export type AccessibilityAudit = typeof accessibilityAudits.$inferSelect;
export type InsertAccessibilityAudit = typeof accessibilityAudits.$inferInsert;

/**
 * API rate limiting and quotas
 */
export const apiQuotas = mysqlTable("api_quotas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  apiKey: varchar("apiKey", { length: 256 }).unique().notNull(),
  requestsPerMinute: int("requestsPerMinute").default(60).notNull(),
  requestsPerDay: int("requestsPerDay").default(10000).notNull(),
  currentMinuteRequests: int("currentMinuteRequests").default(0).notNull(),
  currentDayRequests: int("currentDayRequests").default(0).notNull(),
  lastResetMinute: timestamp("lastResetMinute").defaultNow().notNull(),
  lastResetDay: timestamp("lastResetDay").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type APIQuota = typeof apiQuotas.$inferSelect;
export type InsertAPIQuota = typeof apiQuotas.$inferInsert;
