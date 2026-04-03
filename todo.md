# AppStudio Full-Stack — TODO

## Core Features (Completed)
- [x] Database schema: generated_projects + generation_logs tables
- [x] DB query helpers: saveProject, getProjectById, getUserProjects, getRecentPublicProjects, logGeneration
- [x] Shared scaffold types (ScaffoldFile, ScaffoldProject, AppCategory)
- [x] LLM scaffold generation engine with fallback template
- [x] Improved JSON parsing with brace-depth extraction
- [x] Zip generator using JSZip (produces valid .zip with all files)
- [x] tRPC router: scaffold.generate, scaffold.getById, scaffold.downloadZip, scaffold.listRecent, scaffold.listMine
- [x] Dark theme CSS (violet/cyan palette)
- [x] Home landing page with hero, features grid, tech stack, CTA
- [x] Studio page: prompt input, example chips, generating animation, result view
- [x] Result view: file tree sidebar, syntax-highlighted code viewer, right info panel
- [x] Download ZIP button (base64 → blob → download)
- [x] Deploy to Vercel button (pre-wired URL with Supabase env params)
- [x] FileTree component with folder expand/collapse, file type icons
- [x] CodeViewer component with syntax highlighting, copy button, line numbers
- [x] Gallery page: recent public projects with download + deploy buttons
- [x] Vitest tests: 22 passing

## Payment System (Completed)
- [x] Stripe integration: 3 tiers (Free: 0, Starter: $9/10, Pro: $29/unlimited)
- [x] Subscription tracking: subscriptions table with stripe_subscription_id
- [x] Usage tracking: monthly quota enforcement per user
- [x] Checkout session creation with pre-filled customer info
- [x] Webhook handling at /api/stripe/webhook with test event support
- [x] Pricing page with plan comparison and CTA buttons
- [x] Quota check before scaffold generation

## Multi-LLM System (Completed)
- [x] LLM provider system: Groq, Gemini, OpenRouter with fallback chain
- [x] Smart provider rotation: tracks response times, rotates to fastest
- [x] LLM provider keys configured: GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY
- [x] Provider metrics tracking: avgResponseTimeMs, totalRequests, failedRequests
- [x] LLM provider info logged and displayed (e.g., "Groq (2345ms)")

## Optional Enhancements (Completed)
- [x] User authentication: login via Manus OAuth (already integrated)
- [x] Project history: getUserProjects, addUserProject, toggleProjectFavorite
- [x] User settings: theme, emailNotifications, githubUsername
- [x] Quota exceeded modal: shows current usage, upgrade prompt, pricing link
- [x] Admin panel at /admin: LLM provider management, enable/disable, metrics display
- [x] Encryption utility: encryptValue/decryptValue for secure env storage
- [x] User env variables: saveUserEnvVariable, getUserEnvVariables, deleteUserEnvVariable
- [x] Secure env storage: encrypted storage for Supabase, Vercel, GitHub credentials
- [x] User router: getMyProjects, toggleFavorite, getSettings, updateSettings, env variable CRUD
- [x] Admin router: getLLMProviders, toggleLLMProvider with admin-only access control

## Future Enhancements (Not Implemented)
- [ ] Terminal UI for npm install and project setup
- [ ] GitHub repo integration (create repo from scaffold)
- [ ] Streaming generation progress (SSE)
- [ ] Email notifications for quota warnings
- [ ] Advanced admin panel: user management, billing, analytics

## Test Coverage
- 22 vitest tests passing
- Payment system tests (API key validation, subscription logic)
- Scaffold generation tests (file structure, zip content)
- Auth tests (logout, session handling)
- TypeScript: 0 errors
- Dev server: running and healthy
