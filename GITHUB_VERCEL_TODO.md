# GitHub-Vercel Integration TODO

## Phase 1: Database & Schema
- [ ] Create `github_integrations` table for storing GitHub OAuth tokens and user info
- [ ] Create `vercel_deployments` table for tracking deployments
- [ ] Create `github_pull_requests` table for PR tracking
- [ ] Create `github_issues` table for issue tracking
- [ ] Create `github_sync_logs` table for 2-way sync history
- [ ] Create `vercel_projects` table for Vercel project mapping
- [ ] Add migration SQL for all new tables

## Phase 2: GitHub Integration Router
- [ ] Implement GitHub OAuth flow (authorize, callback, token storage)
- [ ] Create GitHub API client wrapper
- [ ] Implement `github.checkConnection` - verify token validity
- [ ] Implement `github.getUser` - fetch authenticated user info
- [ ] Implement `github.listRepositories` - list user's repos
- [ ] Implement `github.createRepository` - create new repo
- [ ] Implement `github.pushScaffold` - push generated project to repo
- [ ] Implement `github.listPullRequests` - list PRs for a repo
- [ ] Implement `github.getPullRequest` - get PR details
- [ ] Implement `github.createPullRequest` - create PR from branch
- [ ] Implement `github.listIssues` - list issues for a repo
- [ ] Implement `github.createIssue` - create new issue
- [ ] Implement `github.updateIssue` - update issue status/labels

## Phase 3: Vercel Integration Router
- [ ] Create Vercel API client wrapper
- [ ] Implement `vercel.checkConnection` - verify token validity
- [ ] Implement `vercel.listProjects` - list user's Vercel projects
- [ ] Implement `vercel.createProject` - create new Vercel project
- [ ] Implement `vercel.deployProject` - trigger deployment
- [ ] Implement `vercel.getDeploymentStatus` - check deployment status
- [ ] Implement `vercel.listDeployments` - list project deployments
- [ ] Implement `vercel.getEnvironmentVariables` - fetch env vars
- [ ] Implement `vercel.setEnvironmentVariables` - set env vars

## Phase 4: Auto Repo Creation Workflow
- [ ] Create workflow to auto-create GitHub repo on project generation
- [ ] Auto-initialize repo with generated files
- [ ] Create initial commit with project metadata
- [ ] Set up branch protection rules
- [ ] Configure GitHub Actions workflows (optional)
- [ ] Link GitHub repo to Vercel project

## Phase 5: 2-Way Sync System
- [ ] Implement local-to-GitHub sync (push changes)
- [ ] Implement GitHub-to-local sync (pull changes)
- [ ] Create conflict resolution strategy
- [ ] Implement sync history logging
- [ ] Create sync status tracking
- [ ] Implement selective file sync (exclude node_modules, .env, etc.)
- [ ] Add sync scheduling (manual + optional auto-sync)

## Phase 6: PR Management
- [ ] Create PR creation workflow from local changes
- [ ] Implement PR review tracking
- [ ] Create PR merge workflow
- [ ] Implement PR conflict detection
- [ ] Add PR status notifications
- [ ] Create PR analytics dashboard

## Phase 7: Issue Management
- [ ] Create issue creation from app UI
- [ ] Implement issue linking to commits
- [ ] Create issue status tracking
- [ ] Implement issue assignment
- [ ] Add issue labeling system
- [ ] Create issue analytics

## Phase 8: Auto Deployment
- [ ] Create webhook handler for GitHub push events
- [ ] Implement auto-deploy on main branch push
- [ ] Create deployment status tracking
- [ ] Implement rollback capability
- [ ] Add deployment notifications
- [ ] Create deployment history UI

## Phase 9: Webhook Handlers
- [ ] Create GitHub webhook handler for push events
- [ ] Create GitHub webhook handler for PR events
- [ ] Create GitHub webhook handler for issue events
- [ ] Create Vercel webhook handler for deployment events
- [ ] Implement webhook signature verification
- [ ] Create webhook retry logic
- [ ] Add webhook logging and monitoring

## Phase 10: Frontend Integration
- [ ] Create GitHub connection settings UI
- [ ] Create Vercel connection settings UI
- [ ] Create repo creation UI
- [ ] Create sync status dashboard
- [ ] Create PR management UI
- [ ] Create issue management UI
- [ ] Create deployment history UI
- [ ] Add real-time sync status notifications

## Phase 11: Testing
- [ ] Write unit tests for GitHub API client
- [ ] Write unit tests for Vercel API client
- [ ] Write integration tests for repo creation
- [ ] Write integration tests for 2-way sync
- [ ] Write integration tests for PR management
- [ ] Write integration tests for auto deployment
- [ ] Write end-to-end tests for full workflow

## Phase 12: Documentation
- [ ] Document GitHub OAuth setup
- [ ] Document Vercel integration setup
- [ ] Document 2-way sync workflow
- [ ] Document PR management workflow
- [ ] Document auto deployment process
- [ ] Create troubleshooting guide
- [ ] Create API reference documentation
