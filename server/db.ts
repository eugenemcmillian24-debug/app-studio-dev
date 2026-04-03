import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, generatedProjects, generationLogs, InsertGeneratedProject, subscriptions, usageTracking, llmProviders, InsertSubscription, InsertUsageTracking, InsertLLMProvider } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ─────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Project helpers ──────────────────────────────────────────────────────────

export async function saveProject(data: InsertGeneratedProject): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(generatedProjects).values(data);
  return Number((result as unknown as { insertId: number }[])[0]?.insertId ?? 0);
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(generatedProjects).where(eq(generatedProjects.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserProjects(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(generatedProjects)
    .where(eq(generatedProjects.userId, userId))
    .orderBy(desc(generatedProjects.createdAt))
    .limit(limit);
}

export async function getRecentPublicProjects(limit = 24) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(generatedProjects)
    .where(eq(generatedProjects.isPublic, true))
    .orderBy(desc(generatedProjects.createdAt))
    .limit(limit);
}

// ─── Log helpers ──────────────────────────────────────────────────────────────

export async function logGeneration(data: {
  userId?: number;
  prompt: string;
  success: boolean;
  modelUsed?: string;
  durationMs?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(generationLogs).values({
    userId: data.userId ?? null,
    prompt: data.prompt,
    success: data.success,
    modelUsed: data.modelUsed ?? null,
    durationMs: data.durationMs ?? null,
  });
}

// ─── Subscription helpers ─────────────────────────────────────────────────────

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertSubscription(data: InsertSubscription): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getSubscriptionByUserId(data.userId);
  if (existing) {
    await db.update(subscriptions).set(data).where(eq(subscriptions.userId, data.userId));
  } else {
    await db.insert(subscriptions).values(data);
  }
}

// ─── Usage tracking helpers ───────────────────────────────────────────────────

export async function getMonthlyUsage(userId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(usageTracking)
    .where(and(eq(usageTracking.userId, userId), eq(usageTracking.month, month), eq(usageTracking.year, year)))
    .limit(1);
  return result[0] ?? null;
}

export async function incrementUsage(userId: number, month: number, year: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getMonthlyUsage(userId, month, year);
  if (existing) {
    await db
      .update(usageTracking)
      .set({ scaffoldsGenerated: existing.scaffoldsGenerated + 1, updatedAt: new Date() })
      .where(eq(usageTracking.id, existing.id));
  } else {
    await db.insert(usageTracking).values({ userId, month, year, scaffoldsGenerated: 1 });
  }
}

// ─── LLM Provider helpers ─────────────────────────────────────────────────────

export async function getLLMProviders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(llmProviders).orderBy(desc(llmProviders.avgResponseTimeMs));
}

export async function getLLMProviderByName(name: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(llmProviders).where(eq(llmProviders.name, name)).limit(1);
  return result[0] ?? null;
}

export async function updateLLMProviderMetrics(name: string, durationMs: number, success: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const provider = await getLLMProviderByName(name);
  if (!provider) return;

  const newAvgTime = Math.round(
    (provider.avgResponseTimeMs * provider.totalRequests + durationMs) / (provider.totalRequests + 1)
  );
  const newFailedCount = success ? provider.failedRequests : provider.failedRequests + 1;

  await db
    .update(llmProviders)
    .set({
      avgResponseTimeMs: newAvgTime,
      totalRequests: provider.totalRequests + 1,
      failedRequests: newFailedCount,
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(llmProviders.id, provider.id));
}

export async function initializeLLMProviders(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const providers = ["groq", "gemini", "openrouter"];
  for (const name of providers) {
    const existing = await getLLMProviderByName(name);
    if (!existing) {
      await db.insert(llmProviders).values({ name, enabled: true });
    }
  }
}
