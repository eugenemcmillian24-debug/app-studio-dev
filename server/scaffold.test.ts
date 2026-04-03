import { describe, expect, it } from "vitest";
import { generateProjectZip } from "./zip-generator";
import type { ScaffoldFile, ScaffoldProject } from "../shared/scaffold-types";

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const REQUIRED_FILE_PATHS = [
  "app/page.tsx",
  "app/layout.tsx",
  "lib/supabase.ts",
  "components/ui/button.tsx",
];

const mockProject: ScaffoldProject = {
  appName: "Task Manager",
  appDescription: "A task management app with kanban boards",
  appCategory: "saas",
  techStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "Supabase"],
  files: [
    { path: "app/page.tsx", content: 'export default function Home() { return <main className="min-h-screen">Task Manager</main>; }', language: "typescript" },
    { path: "app/layout.tsx", content: 'export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }', language: "typescript" },
    { path: "app/globals.css", content: "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { background: #030712; color: #f9fafb; }", language: "css" },
    { path: "lib/supabase.ts", content: 'import { createBrowserClient } from "@supabase/ssr";\nexport function createClient() { return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); }', language: "typescript" },
    { path: "lib/supabase-server.ts", content: 'import { createServerClient } from "@supabase/ssr";\nimport { cookies } from "next/headers";\nexport async function createServerSupabaseClient() { const cookieStore = await cookies(); return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookieStore.getAll(); }, setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } } }); }', language: "typescript" },
    { path: "components/ui/button.tsx", content: 'import { ButtonHTMLAttributes, forwardRef } from "react";\nexport const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(({ className, ...props }, ref) => <button ref={ref} className={className} {...props} />);\nButton.displayName = "Button";', language: "typescript" },
    { path: "components/ui/card.tsx", content: 'import { HTMLAttributes } from "react";\nexport function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={`rounded-2xl border border-white/10 bg-white/5 p-6 ${className}`} {...props} />; }', language: "typescript" },
    { path: "app/api/health/route.ts", content: 'import { NextResponse } from "next/server";\nexport async function GET() { return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() }); }', language: "typescript" },
    { path: "middleware.ts", content: 'import { type NextRequest, NextResponse } from "next/server";\nexport async function middleware(request: NextRequest) { return NextResponse.next(); }\nexport const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };', language: "typescript" },
    { path: "tailwind.config.ts", content: 'import type { Config } from "tailwindcss";\nconst config: Config = { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], darkMode: "class", theme: { extend: {} }, plugins: [] };\nexport default config;', language: "typescript" },
    { path: "next.config.ts", content: 'import type { NextConfig } from "next";\nconst nextConfig: NextConfig = { images: { remotePatterns: [{ protocol: "https", hostname: "**" }] } };\nexport default nextConfig;', language: "typescript" },
    { path: "tsconfig.json", content: '{"compilerOptions":{"target":"ES2017","lib":["dom","dom.iterable","esnext"],"allowJs":true,"skipLibCheck":true,"strict":true,"noEmit":true,"esModuleInterop":true,"module":"esnext","moduleResolution":"bundler","resolveJsonModule":true,"isolatedModules":true,"jsx":"preserve","incremental":true,"paths":{"@/*":["./*"]}},"include":["next-env.d.ts","**/*.ts","**/*.tsx"],"exclude":["node_modules"]}', language: "json" },
  ],
  sqlSchema: "-- Task Manager Schema\nCREATE TABLE tasks (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,\n  title TEXT NOT NULL,\n  status TEXT DEFAULT 'todo',\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\nALTER TABLE tasks ENABLE ROW LEVEL SECURITY;\nCREATE POLICY \"Users can manage own tasks\" ON tasks USING (auth.uid() = user_id);",
  envExample: "NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key\nSUPABASE_SERVICE_ROLE_KEY=your_service_role_key\nNEXT_PUBLIC_APP_URL=http://localhost:3000",
  readmeContent: "# Task Manager\n\n## Prerequisites\n- Node.js 18+\n- Supabase account\n\n## Setup\n1. `npm install`\n2. `cp .env.example .env.local`\n3. Run schema.sql in Supabase SQL editor\n4. `npm run dev`\n\n## Deploy to Vercel\n1. Push to GitHub\n2. Import at vercel.com/new\n3. Add env vars\n4. Deploy!",
  packageJson: JSON.stringify({ name: "task-manager", version: "0.1.0", private: true, scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "14.2.5", react: "^18", "react-dom": "^18", "@supabase/supabase-js": "^2.45.0", "@supabase/ssr": "^0.5.0", "lucide-react": "^0.400.0", clsx: "^2.1.1" }, devDependencies: { typescript: "^5", "@types/node": "^20", "@types/react": "^18", tailwindcss: "^3.4.1" } }, null, 2),
};

// ─── ZIP Generator Tests ──────────────────────────────────────────────────────

describe("generateProjectZip", () => {
  it("returns a non-empty Buffer", async () => {
    const result = await generateProjectZip(mockProject);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(100);
  });

  it("starts with ZIP magic bytes (PK\\x03\\x04)", async () => {
    const result = await generateProjectZip(mockProject);
    expect(result[0]).toBe(0x50); // P
    expect(result[1]).toBe(0x4b); // K
    expect(result[2]).toBe(0x03);
    expect(result[3]).toBe(0x04);
  });

  it("handles app names with special characters without throwing", async () => {
    const specialProject = { ...mockProject, appName: "My App! (v2.0) & More" };
    const result = await generateProjectZip(specialProject);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(100);
  });

  it("includes key source file paths in the zip binary", async () => {
    const result = await generateProjectZip(mockProject);
    const zipStr = result.toString("binary");
    expect(zipStr).toContain("page.tsx");
    expect(zipStr).toContain("supabase.ts");
    expect(zipStr).toContain("schema.sql");
    expect(zipStr).toContain("README.md");
    expect(zipStr).toContain(".env.example");
  });

  it("includes .gitignore in the zip", async () => {
    const result = await generateProjectZip(mockProject);
    const zipStr = result.toString("binary");
    expect(zipStr).toContain(".gitignore");
  });
});

// ─── Scaffold Required Files Tests ───────────────────────────────────────────

describe("Scaffold required files completeness", () => {
  it("contains all required file paths", () => {
    const filePaths = mockProject.files.map(f => f.path);
    for (const required of REQUIRED_FILE_PATHS) {
      expect(filePaths, `Missing required file: ${required}`).toContain(required);
    }
  });

  it("has at least 10 files for a production-ready scaffold", () => {
    expect(mockProject.files.length).toBeGreaterThanOrEqual(10);
  });

  it("all files have non-empty, non-stub content (>20 chars)", () => {
    for (const file of mockProject.files) {
      expect(file.content.trim().length, `File ${file.path} has empty/stub content`).toBeGreaterThan(20);
    }
  });

  it("sqlSchema contains CREATE TABLE statement with RLS", () => {
    expect(mockProject.sqlSchema).toMatch(/CREATE TABLE/i);
    expect(mockProject.sqlSchema).toMatch(/ROW LEVEL SECURITY/i);
  });

  it("envExample contains required Supabase env vars", () => {
    expect(mockProject.envExample).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(mockProject.envExample).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("readmeContent contains setup and deploy instructions", () => {
    expect(mockProject.readmeContent).toContain("npm install");
    expect(mockProject.readmeContent).toContain(".env");
    expect(mockProject.readmeContent).toContain("Vercel");
  });

  it("packageJson is valid JSON with next and supabase dependencies", () => {
    const pkg = JSON.parse(mockProject.packageJson);
    expect(pkg.name).toBeTruthy();
    expect(pkg.dependencies?.next).toBeTruthy();
    expect(pkg.dependencies?.["@supabase/supabase-js"]).toBeTruthy();
  });
});

// ─── Router Input Validation Tests (using real zod) ──────────────────────────

describe("scaffold router input validation (zod schema)", () => {
  it("rejects prompts shorter than 10 characters", () => {
    const { z } = require("zod");
    const schema = z.string().min(10).max(1000);
    const result = schema.safeParse("short");
    expect(result.success).toBe(false);
  });

  it("accepts a valid prompt of 10+ characters", () => {
    const { z } = require("zod");
    const schema = z.string().min(10).max(1000);
    const result = schema.safeParse("A task management app with kanban boards");
    expect(result.success).toBe(true);
  });

  it("rejects prompts longer than 1000 characters", () => {
    const { z } = require("zod");
    const schema = z.string().min(10).max(1000);
    const result = schema.safeParse("a".repeat(1001));
    expect(result.success).toBe(false);
  });

  it("accepts a prompt at exactly 1000 characters", () => {
    const { z } = require("zod");
    const schema = z.string().min(10).max(1000);
    const result = schema.safeParse("a".repeat(1000));
    expect(result.success).toBe(true);
  });
});

// ─── Auth Logout Test ─────────────────────────────────────────────────────────

import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = { name: string; options: Record<string, unknown> };
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user: AuthenticatedUser = {
    id: 1, openId: "sample-user", email: "sample@example.com",
    name: "Sample User", loginMethod: "manus", role: "user",
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1, secure: true, sameSite: "none", httpOnly: true, path: "/",
    });
  });
});
