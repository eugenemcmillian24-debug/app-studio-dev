import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { apiDocumentation, generatedProjects } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const apiDocsRouter = router({
  // Generate OpenAPI spec for a project
  generateSpec: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify project ownership
      const [project] = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.id, input.projectId))
        .limit(1);

      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or unauthorized");
      }

      // Parse project data
      const files = JSON.parse(project.files);
      const appName = project.appName;
      const appDescription = project.appDescription;

      // Generate basic OpenAPI spec
      const openApiSpec = {
        openapi: "3.0.0",
        info: {
          title: appName,
          description: appDescription,
          version: "1.0.0",
        },
        servers: [
          {
            url: "https://api.example.com",
            description: "Production server",
          },
        ],
        paths: {
          "/api/health": {
            get: {
              summary: "Health check",
              responses: {
                "200": {
                  description: "Server is healthy",
                },
              },
            },
          },
        },
        components: {
          schemas: {
            Error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      };

      // Check if spec already exists
      const [existing] = await db
        .select()
        .from(apiDocumentation)
        .where(eq(apiDocumentation.projectId, input.projectId))
        .limit(1);

      if (existing) {
        await db
          .update(apiDocumentation)
          .set({
            openApiSpec: JSON.stringify(openApiSpec),
            updatedAt: new Date(),
          })
          .where(eq(apiDocumentation.projectId, input.projectId));
      } else {
        await db.insert(apiDocumentation).values({
          projectId: input.projectId,
          openApiSpec: JSON.stringify(openApiSpec),
        });
      }

      return { success: true, spec: openApiSpec };
    }),

  // Get API documentation
  getSpec: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [doc] = await db
        .select()
        .from(apiDocumentation)
        .where(eq(apiDocumentation.projectId, input.projectId))
        .limit(1);

      if (!doc) return null;

      return {
        ...doc,
        openApiSpec: JSON.parse(doc.openApiSpec),
      };
    }),

  // Get Swagger UI URL
  getSwaggerUrl: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [doc] = await db
        .select()
        .from(apiDocumentation)
        .where(eq(apiDocumentation.projectId, input.projectId))
        .limit(1);

      if (!doc || !doc.swaggerUrl) return null;

      return { swaggerUrl: doc.swaggerUrl };
    }),

  // Update Swagger URL
  updateSwaggerUrl: protectedProcedure
    .input(z.object({ projectId: z.number(), swaggerUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify project ownership
      const [project] = await db
        .select()
        .from(generatedProjects)
        .where(eq(generatedProjects.id, input.projectId))
        .limit(1);

      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or unauthorized");
      }

      const [doc] = await db
        .select()
        .from(apiDocumentation)
        .where(eq(apiDocumentation.projectId, input.projectId))
        .limit(1);

      if (!doc) throw new Error("API documentation not found");

      await db
        .update(apiDocumentation)
        .set({ swaggerUrl: input.swaggerUrl })
        .where(eq(apiDocumentation.projectId, input.projectId));

      return { success: true };
    }),
});
