import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, generatedProjects, generationLogs, InsertGeneratedProject } from "../drizzle/schema";
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
