# AppStudio Full-Stack — TODO

## Database & Backend
- [x] Add `generated_projects` table to drizzle schema (id, userId, prompt, appName, appCategory, files JSON, createdAt)
- [x] Add `generation_logs` table for analytics
- [x] Create db helpers: saveProject, getProjectById, getUserProjects, getRecentProjects, logGeneration
- [x] Create tRPC router: generate (mutation), getProject, listProjects, downloadZip, listMine

## LLM Scaffold Engine
- [x] Build system prompt for multi-file Next.js + Supabase scaffold generation
- [x] Parse LLM JSON response into structured ScaffoldProject type (brace-depth extraction)
- [x] Generate: app/page.tsx, app/layout.tsx, app/api/*.ts, components/, lib/supabase.ts
- [x] Generate: SQL migration (supabase schema), .env.example, package.json, README.md
- [x] Fallback template if LLM fails (produces 10 complete files)

## ZIP Generation
- [x] Install JSZip on server side
- [x] tRPC endpoint: downloadZip(projectId) → base64 zip
- [x] Client: trigger download from base64 (blob URL download)

## Frontend UI
- [x] Dark theme with violet/cyan gradient (matching AppStudio aesthetic)
- [x] Landing hero: prompt textarea + Generate button + example chips
- [x] Generating animation/progress screen with step indicators
- [x] File tree sidebar (collapsible folders, file icons by type)
- [x] Code viewer panel with syntax highlighting (react-syntax-highlighter)
- [x] Special file tabs: SQL Schema | README | .env.example | package.json
- [x] Download ZIP button (prominent CTA)
- [x] Deploy to Vercel button (pre-wired URL with Supabase env params)
- [x] Project gallery: recent public scaffolds with download + deploy
- [x] Copy-to-clipboard on code blocks with toast feedback
- [x] Toast notifications for errors/success

## Tests
- [x] Vitest: zip generator (4 tests)
- [x] Vitest: scaffold types (2 tests)
- [x] Vitest: input validation (3 tests)
- [x] Vitest: auth logout (1 test)
- [x] All 10 tests passing

## Payment System
- [x] Add Stripe integration via webdev_add_feature
- [x] Create subscriptions table: userId, stripeCustomerId, plan, createdAt, updatedAt
- [x] Create usage_tracking table: userId, scaffoldsGenerated, month, year
- [x] Create payment router with getSubscription, createCheckout, getPricing
- [x] Create Stripe webhook handler for checkout.session.completed
- [x] Pricing page with plan comparison and upgrade buttons
- [x] Display current plan + usage in pricing page
- [x] Protect scaffold.generate with quota checks (free=0, starter=10, pro=999)
- [x] Add Pricing route to App.tsx
- [x] Update Home page with pricing CTA and link

## Multi-LLM System
- [x] Create llm_providers table: name, enabled, avgResponseTime, lastUsed, totalRequests, failedRequests
- [x] Create LLM provider abstraction (Groq, Gemini, OpenRouter)
- [x] Build fallback chain: try Groq → Gemini → OpenRouter (skip disabled)
- [x] Implement smart rotation: track response times, prioritize fastest
- [x] Add environment variables: GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY
- [x] Create llm-providers.ts with callLLMWithFallback function
- [x] Create db helpers: getLLMProviders, updateLLMProviderMetrics, initializeLLMProviders
- [ ] Update scaffold engine to use callLLMWithFallback instead of direct invokeLLM
- [ ] Log which provider was used for each generation
- [ ] Show provider info in result view (e.g., "Generated with Groq in 2.3s")

## Frontend Updates
- [x] Pricing page with plan comparison
- [x] Checkout button that redirects to Stripe
- [x] Pricing route in App.tsx
- [x] Home page with pricing CTA
- [ ] Show "Upgrade to Pro" modal if user exceeds quota
- [ ] Display LLM provider + response time in result view
- [ ] Add admin panel to manage LLM provider keys and status

## Remaining / Future
- [ ] Update scaffold engine to use multi-LLM fallback chain
- [ ] Integrate LLM provider metrics into generation logging
- [ ] Show LLM provider info in Studio result view
- [ ] Add quota exceeded error handling in Studio UI
- [ ] Admin dashboard for LLM provider management
