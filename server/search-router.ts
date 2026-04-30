import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { generatedProjects } from "../drizzle/schema";
import { eq, and, like, gte, lte } from "drizzle-orm";

export const searchRouter = router({
  // Search user's projects
  searchMyProjects: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      category: z.string().optional(),
      techStack: z.array(z.string()).optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(generatedProjects.userId, ctx.user.id)];

      if (input.query) {
        conditions.push(
          like(generatedProjects.appName, `%${input.query}%`)
        );
      }

      if (input.category) {
        conditions.push(eq(generatedProjects.appCategory, input.category));
      }

      if (input.dateFrom) {
        conditions.push(gte(generatedProjects.createdAt, input.dateFrom));
      }

      if (input.dateTo) {
        conditions.push(lte(generatedProjects.createdAt, input.dateTo));
      }

      let query = db
        .select()
        .from(generatedProjects)
        .where(and(...conditions));

      const projects = await query.limit(input.limit).offset(input.offset);

      // Filter by techStack if provided
      let filtered = projects;
      if (input.techStack && input.techStack.length > 0) {
        filtered = projects.filter(p => {
          const projectTech = JSON.parse(p.techStack);
          return input.techStack!.some(tech => projectTech.includes(tech));
        });
      }

      return filtered;
    }),

  // Search public projects
  searchPublic: publicProcedure
    .input(z.object({
      query: z.string().optional(),
      category: z.string().optional(),
      techStack: z.array(z.string()).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(generatedProjects.isPublic, true)];

      if (input.query) {
        conditions.push(
          like(generatedProjects.appName, `%${input.query}%`)
        );
      }

      if (input.category) {
        conditions.push(eq(generatedProjects.appCategory, input.category));
      }

      let query = db
        .select()
        .from(generatedProjects)
        .where(and(...conditions));

      const projects = await query.limit(input.limit).offset(input.offset);

      // Filter by techStack if provided
      let filtered = projects;
      if (input.techStack && input.techStack.length > 0) {
        filtered = projects.filter(p => {
          const projectTech = JSON.parse(p.techStack);
          return input.techStack!.some(tech => projectTech.includes(tech));
        });
      }

      return filtered.map(p => ({
        id: p.id,
        appName: p.appName,
        appDescription: p.appDescription,
        appCategory: p.appCategory,
        techStack: JSON.parse(p.techStack),
        createdAt: p.createdAt,
      }));
    }),

  // Get filter options (categories, tech stacks)
  getFilterOptions: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const projects = await db.select().from(generatedProjects).where(eq(generatedProjects.isPublic, true));

    const categories = new Set<string>();
    const techStacks = new Set<string>();

    projects.forEach(p => {
      categories.add(p.appCategory);
      const tech = JSON.parse(p.techStack);
      tech.forEach((t: string) => techStacks.add(t));
    });

    return {
      categories: Array.from(categories).sort(),
      techStacks: Array.from(techStacks).sort(),
    };
  }),

  // Get trending projects
  getTrending: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const projects = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.isPublic, true))
        .limit(input.limit);

      return projects.map(p => ({
        id: p.id,
        appName: p.appName,
        appDescription: p.appDescription,
        appCategory: p.appCategory,
        techStack: JSON.parse(p.techStack),
        createdAt: p.createdAt,
      }));
    }),

  // Get recently updated projects
  getRecent: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const projects = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.isPublic, true))
        .limit(input.limit);

      return projects.map(p => ({
        id: p.id,
        appName: p.appName,
        appDescription: p.appDescription,
        appCategory: p.appCategory,
        techStack: JSON.parse(p.techStack),
        createdAt: p.createdAt,
      }));
    }),
});
