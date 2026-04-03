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

## Remaining / Future
- [ ] Verify LLM generates real AI output consistently (not just fallback)
- [ ] Mobile-responsive layout improvements
- [ ] Auth: login to save/access personal project history
- [ ] Streaming generation progress (SSE)
