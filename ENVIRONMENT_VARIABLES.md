# AppStudio Environment Variables Reference

This document lists all environment variables used in the AppStudio application. These variables are automatically injected by the Manus platform and are available in both server and client contexts.

## Database Configuration

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `DATABASE_URL` | String | Yes | MySQL/TiDB connection string for the application database |

**Example:** `mysql://user:password@host:3306/appstudio`

## Authentication & Security

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `JWT_SECRET` | String | Yes | Secret key for signing session cookies (32+ characters recommended) |
| `VITE_APP_ID` | String | Yes | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | String | Yes | Manus OAuth server base URL |
| `VITE_OAUTH_PORTAL_URL` | String | Yes | Manus OAuth login portal URL for frontend redirects |
| `OWNER_OPEN_ID` | String | Yes | Owner's Manus OpenID for admin access |
| `OWNER_NAME` | String | Yes | Owner's display name |

**Notes:**
- `JWT_SECRET` should be generated with: `openssl rand -hex 32`
- OAuth URLs are provided by Manus platform
- Owner credentials identify the project owner for admin operations

## LLM Providers (All Free Tier)

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `GEMINI_API_KEY` | String | Yes | Google Gemini API key (free tier available) |
| `GROQ_API_KEY` | String | Yes | Groq API key for fast inference (free tier with rate limits) |
| `OPENROUTER_API_KEY` | String | Yes | OpenRouter API key for multiple model access (free tier available) |

**Notes:**
- All three providers offer free tiers
- The system uses smart fallback: tries fastest provider first
- Get keys from:
  - Gemini: https://makersuite.google.com/app/apikey
  - Groq: https://console.groq.com
  - OpenRouter: https://openrouter.ai

## Manus Built-in APIs

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `BUILT_IN_FORGE_API_URL` | String | Yes | Manus Forge API endpoint (LLM, storage, notifications) |
| `BUILT_IN_FORGE_API_KEY` | String | Yes | Bearer token for server-side Forge API access |
| `VITE_FRONTEND_FORGE_API_URL` | String | Yes | Forge API URL exposed to frontend |
| `VITE_FRONTEND_FORGE_API_KEY` | String | Yes | Bearer token for frontend Forge API access |

**Notes:**
- These are provided by Manus platform
- `BUILT_IN_FORGE_API_KEY` is server-only (never exposed to client)
- `VITE_FRONTEND_FORGE_API_KEY` is safe for client-side use
- Forge API provides: LLM inference, file storage, notifications, data APIs

## Payment Processing (Stripe)

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `STRIPE_SECRET_KEY` | String | Yes | Stripe secret API key (server-side only) |
| `STRIPE_PUBLISHABLE_KEY` | String | Yes | Stripe publishable key (safe for client) |
| `STRIPE_WEBHOOK_SECRET` | String | Yes | Webhook signing secret for Stripe events |
| `VITE_STRIPE_STARTER_PRICE_ID` | String | Yes | Stripe price ID for Starter plan |
| `VITE_STRIPE_PRO_PRICE_ID` | String | Yes | Stripe price ID for Pro plan |

**Notes:**
- Get from https://dashboard.stripe.com
- `STRIPE_SECRET_KEY` never exposed to frontend
- `STRIPE_WEBHOOK_SECRET` used to verify webhook signatures
- Price IDs are product-specific (test vs live mode)
- Test keys start with `sk_test_` / `pk_test_`
- Live keys start with `sk_live_` / `pk_live_`

## Analytics & Monitoring

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `VITE_ANALYTICS_ENDPOINT` | String | No | Analytics service endpoint for tracking |
| `VITE_ANALYTICS_WEBSITE_ID` | String | No | Website ID for analytics platform |

**Notes:**
- Optional for basic functionality
- Used for tracking user activity, generation metrics
- Can integrate with services like Plausible, Mixpanel, etc.

## Application Settings

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `VITE_APP_TITLE` | String | Yes | Application title displayed in UI and page title |
| `VITE_APP_LOGO` | String | No | URL to application logo image |

**Notes:**
- `VITE_APP_TITLE` used in browser tab and navigation
- `VITE_APP_LOGO` should be a public URL to an image file
- These are customizable per deployment

## Server Configuration

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `PORT` | Number | No | Server port (default: 3000) |
| `NODE_ENV` | String | No | Environment mode: `development`, `production`, `test` |

**Notes:**
- `PORT` is auto-assigned in production (ignore this variable)
- `NODE_ENV` affects logging, error handling, and optimization

## Optional: Supabase Integration

If using Supabase instead of custom database:

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | String | No | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | String | No | Supabase anonymous key (safe for client) |

**Notes:**
- Currently using MySQL/TiDB (see `DATABASE_URL`)
- These are included for future Supabase migration support

## Environment Variable Groups

### Server-Only (Never Exposed to Client)
- `BUILT_IN_FORGE_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `JWT_SECRET`
- `DATABASE_URL`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`

### Client-Safe (Prefixed with `VITE_`)
- `VITE_APP_ID`
- `VITE_APP_TITLE`
- `VITE_APP_LOGO`
- `VITE_OAUTH_PORTAL_URL`
- `VITE_FRONTEND_FORGE_API_URL`
- `VITE_FRONTEND_FORGE_API_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_STARTER_PRICE_ID`
- `VITE_STRIPE_PRO_PRICE_ID`
- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`

## How to Update Environment Variables

1. **Via Manus Management UI:**
   - Go to Settings → Secrets
   - Edit or add environment variables
   - Changes apply on next deployment

2. **Via `webdev_request_secrets` Tool:**
   - Used by developers to request new secrets
   - Prompts user for values
   - Validates and stores securely

3. **Local Development:**
   - Create `.env.local` file in project root
   - Add variables in `KEY=VALUE` format
   - Never commit `.env.local` to git

## Validation Checklist

Before deploying to production, ensure:

- [ ] All required variables are set (see "Required" column above)
- [ ] `JWT_SECRET` is a strong 32+ character random string
- [ ] `STRIPE_SECRET_KEY` uses live keys (not test keys)
- [ ] `BUILT_IN_FORGE_API_KEY` is valid and has required permissions
- [ ] `DATABASE_URL` points to production database
- [ ] `NODE_ENV` is set to `production`
- [ ] No secrets are committed to version control
- [ ] All API keys have appropriate rate limits configured

## Troubleshooting

**"Missing environment variable X"**
- Check that all required variables are set
- Verify variable names are spelled correctly
- Ensure `VITE_` prefixed variables are in client code only

**"Invalid API key"**
- Verify the key is for the correct environment (test vs live)
- Check that the key hasn't expired or been revoked
- Ensure the key has necessary permissions/scopes

**"Database connection failed"**
- Verify `DATABASE_URL` format: `mysql://user:pass@host:port/database`
- Check database is accessible from server
- Verify credentials are correct

**"OAuth redirect failed"**
- Ensure `VITE_OAUTH_PORTAL_URL` is correct
- Check that redirect URLs are registered in Manus OAuth settings
- Verify `VITE_APP_ID` matches OAuth application ID
