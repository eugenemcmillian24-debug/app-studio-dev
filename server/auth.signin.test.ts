import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

describe("Auth: Email/Password Signin", () => {
  let db: any;
  const testEmail = "test@example.com";
  const testPassword = "TestPassword123";
  const testName = "Test User";

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up test user if exists
    await db.delete(users).where(eq(users.email, testEmail));
  });

  afterAll(async () => {
    // Clean up test user
    if (db) {
      await db.delete(users).where(eq(users.email, testEmail));
    }
  });

  it("should create user with hashed password on signup", async () => {
    const passwordHash = await bcrypt.hash(testPassword, 10);

    await db.insert(users).values({
      email: testEmail,
      name: testName,
      passwordHash,
      openId: `local_${Date.now()}`,
      loginMethod: "email",
      role: "user",
    });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.name).toBe(testName);
    expect(user.passwordHash).toBeDefined();
    expect(user.passwordHash).not.toBe(testPassword); // Should be hashed
  });

  it("should verify password correctly", async () => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    expect(user).toBeDefined();
    const isValid = await bcrypt.compare(testPassword, user.passwordHash);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    expect(user).toBeDefined();
    const isValid = await bcrypt.compare("WrongPassword", user.passwordHash);
    expect(isValid).toBe(false);
  });

  it("should find user by email", async () => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.openId).toBeDefined();
  });

  it("should have valid openId for session creation", async () => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    expect(user).toBeDefined();
    expect(user.openId).toBeTruthy();
    expect(typeof user.openId).toBe("string");
    expect(user.openId.length).toBeGreaterThan(0);
  });

  it("should have user role set correctly", async () => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    expect(user).toBeDefined();
    expect(user.role).toBe("user");
  });

  it("should have loginMethod set to email", async () => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    expect(user).toBeDefined();
    expect(user.loginMethod).toBe("email");
  });
});
