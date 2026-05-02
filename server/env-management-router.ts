/**
 * Environment Variable Management Router
 * Manage deployment environment variables with encryption and per-environment overrides
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import crypto from "crypto";

interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  encrypted: boolean;
  environment: "development" | "staging" | "production";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface EnvironmentConfig {
  environment: "development" | "staging" | "production";
  variables: EnvironmentVariable[];
  lastUpdated: string;
  updatedBy: string;
}

// In-memory storage (in production, use database)
const envConfigs = new Map<string, EnvironmentConfig>();

const ENCRYPTION_KEY = process.env.ENV_ENCRYPTION_KEY || "default-key-change-in-production";

function encryptValue(value: string): string {
  try {
    // Simple base64 encoding for now (use proper encryption in production)
    return Buffer.from(value).toString("base64");
  } catch {
    return value;
  }
}

export const envManagementRouter = router({
  /**
   * Get environment variables for a specific environment
   */
  getEnvironmentVariables: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        environment: z.enum(["development", "staging", "production"]),
        masked: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      try {
        const config = envConfigs.get(`${input.projectId}-${input.environment}`);

        if (!config) {
          return {
            environment: input.environment,
            variables: [],
          };
        }

        const variables = config.variables.map((v) => ({
          id: v.id,
          key: v.key,
          value: input.masked && v.encrypted ? "***" : v.value,
          encrypted: v.encrypted,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        }));

        return {
          environment: input.environment,
          variables,
          lastUpdated: config.lastUpdated,
        };
      } catch (error) {
        throw new Error(
          `Failed to get environment variables: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Set environment variable
   */
  setEnvironmentVariable: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        environment: z.enum(["development", "staging", "production"]),
        key: z.string().min(1),
        value: z.string(),
        encrypted: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const configKey = `${input.projectId}-${input.environment}`;
        let config = envConfigs.get(configKey);

        if (!config) {
          config = {
            environment: input.environment,
            variables: [],
            lastUpdated: new Date().toISOString(),
            updatedBy: String(ctx.user?.id || "system"),
          };
        }

        // Check if variable already exists
        const existingIndex = config.variables.findIndex((v) => v.key === input.key);
        const encryptedValue = input.encrypted ? encryptValue(input.value) : input.value;

        const variable: EnvironmentVariable = {
          id: existingIndex >= 0 ? config.variables[existingIndex].id : `env_${Date.now()}`,
          key: input.key,
          value: encryptedValue,
          encrypted: input.encrypted,
          environment: input.environment,
          createdAt:
            existingIndex >= 0
              ? config.variables[existingIndex].createdAt
              : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy:
            existingIndex >= 0
              ? config.variables[existingIndex].createdBy
              : String(ctx.user?.id || "system"),
        };

        if (existingIndex >= 0) {
          config.variables[existingIndex] = variable;
        } else {
          config.variables.push(variable);
        }

        config.lastUpdated = new Date().toISOString();
        config.updatedBy = String(ctx.user?.id || "system");

        envConfigs.set(configKey, config);

        return {
          success: true,
          variable: {
            id: variable.id,
            key: variable.key,
            encrypted: variable.encrypted,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to set environment variable: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Delete environment variable
   */
  deleteEnvironmentVariable: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        environment: z.enum(["development", "staging", "production"]),
        variableId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const configKey = `${input.projectId}-${input.environment}`;
        const config = envConfigs.get(configKey);

        if (!config) {
          throw new Error("Environment configuration not found");
        }

        config.variables = config.variables.filter((v) => v.id !== input.variableId);
        config.lastUpdated = new Date().toISOString();

        envConfigs.set(configKey, config);

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to delete environment variable: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get all environments for a project
   */
  getAllEnvironments: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const environments: EnvironmentConfig[] = [];

        for (const env of ["development", "staging", "production"]) {
          const config = envConfigs.get(`${input.projectId}-${env}`);
          if (config) {
            environments.push({
              ...config,
              variables: config.variables.map((v) => ({
                ...v,
                value: "***",
              })),
            });
          }
        }

        return {
          environments,
          total: environments.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get environments: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Export environment variables
   */
  exportEnvironmentVariables: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        environment: z.enum(["development", "staging", "production"]),
        format: z.enum([".env", "json", "yaml"]).default(".env"),
      })
    )
    .query(async ({ input }) => {
      try {
        const configKey = `${input.projectId}-${input.environment}`;
        const config = envConfigs.get(configKey);

        if (!config) {
          throw new Error("Environment configuration not found");
        }

        let content = "";

        if (input.format === ".env") {
          content = config.variables.map((v) => `${v.key}=***`).join("\n");
        } else if (input.format === "json") {
          const obj: Record<string, string> = {};
          for (const v of config.variables) {
            obj[v.key] = "***";
          }
          content = JSON.stringify(obj, null, 2);
        } else if (input.format === "yaml") {
          content = config.variables.map((v) => `${v.key}: ***`).join("\n");
        }

        return {
          success: true,
          content,
          filename: `env-${input.environment}.${input.format === ".env" ? "env" : input.format}`,
        };
      } catch (error) {
        throw new Error(
          `Failed to export environment variables: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
