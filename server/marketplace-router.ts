import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { marketplaceListings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const marketplaceRouter = router({
  // List marketplace templates
  listTemplates: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        sortBy: z.enum(["popular", "newest", "rating"]).default("popular"),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const listings = await db.select().from(marketplaceListings);

      let filtered = listings.filter((l) => l.isActive);

      if (input.category) {
        filtered = filtered.filter((l) => l.category === input.category);
      }

      // Sort
      if (input.sortBy === "popular") {
        filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
      } else if (input.sortBy === "newest") {
        filtered.sort(
          (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
        );
      } else if (input.sortBy === "rating") {
        filtered.sort(
          (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)
        );
      }

      return filtered.slice(0, input.limit);
    }),

  // Get template details
  getTemplateDetails: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [listing] = await db
        .select()
        .from(marketplaceListings)
        .where(eq(marketplaceListings.id, input.templateId))
        .limit(1);

      return listing;
    }),

  // Purchase template
  purchaseTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [listing] = await db
        .select()
        .from(marketplaceListings)
        .where(eq(marketplaceListings.id, input.templateId))
        .limit(1);

      if (!listing) {
        throw new Error("Template not found");
      }

      // Increment downloads
      await db
        .update(marketplaceListings)
        .set({ downloads: (listing.downloads || 0) + 1 })
        .where(eq(marketplaceListings.id, input.templateId));

      return {
        success: true,
        message: "Template purchased",
        template: listing.title,
      };
    }),

  // List trending templates
  getTrendingTemplates: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const listings = await db
      .select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.isActive, true));

    // Sort by downloads (trending)
    return listings
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, 10);
  }),

  // Get categories
  getCategories: protectedProcedure.query(async () => {
    return {
      categories: [
        "E-commerce",
        "SaaS",
        "Blog",
        "Dashboard",
        "Social",
        "Marketplace",
        "CMS",
        "Analytics",
      ],
    };
  }),

  // Search templates
  searchTemplates: protectedProcedure
    .input(z.object({ query: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const listings = await db.select().from(marketplaceListings);

      const results = listings.filter(
        (l) =>
          l.isActive &&
          (l.title?.toLowerCase().includes(input.query.toLowerCase()) ||
            l.description?.toLowerCase().includes(input.query.toLowerCase()))
      );

      return results.slice(0, input.limit);
    }),

  // Get recommendations
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const listings = await db.select().from(marketplaceListings);

    // Simple recommendation: highest rated
    return listings
      .filter((l) => l.isActive)
      .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
      .slice(0, 5);
  }),

  // List user's published templates
  getMyTemplates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const listings = await db
      .select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.sellerId, ctx.user?.id || 0));

    return listings;
  }),

  // Create marketplace listing
  createListing: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string(),
        description: z.string(),
        price: z.number().min(0),
        category: z.string(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(marketplaceListings).values({
        projectId: input.projectId,
        sellerId: ctx.user?.id || 0,
        title: input.title,
        description: input.description,
        price: String(input.price),
        category: input.category,
        tags: input.tags ? JSON.stringify(input.tags) : undefined,
      });

      return { success: true, message: "Listing created" };
    }),
});
