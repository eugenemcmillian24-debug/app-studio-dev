#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates all required environment variables at startup
 * Run: node scripts/validate-env.ts
 */

const requiredEnvVars = {
  // Database & Auth
  DATABASE_URL: { required: true, scope: "server", description: "Database connection string" },
  JWT_SECRET: { required: true, scope: "server", description: "Session cookie signing secret" },
  VITE_APP_ID: { required: true, scope: "both", description: "OAuth application ID" },
  OAUTH_SERVER_URL: { required: true, scope: "server", description: "OAuth server URL" },
  VITE_OAUTH_PORTAL_URL: { required: true, scope: "client", description: "OAuth portal URL" },

  // LLM Providers
  GEMINI_API_KEY: { required: true, scope: "server", description: "Google Gemini API key" },
  GROQ_API_KEY: { required: true, scope: "server", description: "Groq API key" },
  OPENROUTER_API_KEY: { required: true, scope: "server", description: "OpenRouter API key" },

  // Stripe
  STRIPE_SECRET_KEY: { required: true, scope: "server", description: "Stripe secret key" },
  VITE_STRIPE_PUBLISHABLE_KEY: { required: true, scope: "client", description: "Stripe public key" },
  STRIPE_WEBHOOK_SECRET: { required: true, scope: "server", description: "Stripe webhook secret" },
  VITE_STRIPE_STARTER_PRICE_ID: { required: true, scope: "client", description: "Starter plan price ID" },
  VITE_STRIPE_PRO_PRICE_ID: { required: true, scope: "client", description: "Pro plan price ID" },

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: { required: true, scope: "client", description: "Supabase project URL" },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: { required: true, scope: "client", description: "Supabase anon key" },
  SUPABASE_SERVICE_ROLE_KEY: { required: true, scope: "server", description: "Supabase service role key" },

  // Manus APIs
  BUILT_IN_FORGE_API_URL: { required: true, scope: "server", description: "Forge API URL" },
  BUILT_IN_FORGE_API_KEY: { required: true, scope: "server", description: "Forge API key" },
  VITE_FRONTEND_FORGE_API_URL: { required: true, scope: "client", description: "Frontend Forge API URL" },
  VITE_FRONTEND_FORGE_API_KEY: { required: true, scope: "client", description: "Frontend Forge API key" },

  // Admin
  OWNER_OPEN_ID: { required: true, scope: "server", description: "Owner OpenID" },
  OWNER_NAME: { required: true, scope: "both", description: "Owner name" },
  OWNER_EMAIL: { required: false, scope: "server", description: "Owner email" },

  // Optional
  VITE_ANALYTICS_ENDPOINT: { required: false, scope: "client", description: "Analytics endpoint" },
  VITE_ANALYTICS_WEBSITE_ID: { required: false, scope: "client", description: "Analytics website ID" },
};

interface EnvVar {
  required: boolean;
  scope: "server" | "client" | "both";
  description: string;
}

function validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let configuredCount = 0;
  let missingCount = 0;

  console.log("\n📋 Environment Variable Validation\n");
  console.log("═".repeat(70));

  // Check each variable
  Object.entries(requiredEnvVars).forEach(([key, config]: [string, EnvVar]) => {
    const value = process.env[key];
    const isSet = !!value && value.trim().length > 0;

    if (isSet) {
      configuredCount++;
      const displayValue = value.length > 40 ? value.substring(0, 40) + "..." : value;
      console.log(`✅ ${key.padEnd(35)} [${config.scope}] ${displayValue}`);
    } else if (config.required) {
      missingCount++;
      errors.push(`Missing required variable: ${key} (${config.description})`);
      console.log(`❌ ${key.padEnd(35)} [${config.scope}] MISSING`);
    } else {
      warnings.push(`Optional variable not set: ${key}`);
      console.log(`⚠️  ${key.padEnd(35)} [${config.scope}] OPTIONAL`);
    }
  });

  console.log("\n" + "═".repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Configured: ${configuredCount}/${Object.keys(requiredEnvVars).length}`);
  console.log(`  ❌ Missing: ${missingCount}`);
  console.log(`  ⚠️  Optional: ${warnings.length}`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    errors.forEach((error) => console.log(`   - ${error}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.forEach((warning) => console.log(`   - ${warning}`));
  }

  const valid = errors.length === 0;
  if (valid) {
    console.log(`\n✅ All required environment variables are configured!\n`);
  } else {
    console.log(`\n❌ Please configure missing environment variables before starting the application.\n`);
  }

  return { valid, errors, warnings };
}

// Run validation
const result = validateEnvironment();
process.exit(result.valid ? 0 : 1);
