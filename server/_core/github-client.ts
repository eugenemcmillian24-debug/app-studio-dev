/**
 * GitHub API client wrapper for AppStudio
 * Handles authentication, repository management, PRs, issues, and webhooks
 */

import { Octokit } from "@octokit/rest";

export interface GitHubAuthConfig {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

export interface CreateRepoOptions {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
}

export interface PushOptions {
  branch?: string;
  message?: string;
  content: Record<string, string>; // filepath -> content
}

export interface CreatePROptions {
  title: string;
  body?: string;
  head: string; // source branch
  base: string; // target branch
  draft?: boolean;
}

export interface CreateIssueOptions {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

/**
 * GitHub API Client
 */
export class GitHubClient {
  private octokit: Octokit;
  private owner: string = "";
  private repo: string = "";

  constructor(config: GitHubAuthConfig) {
    this.octokit = new Octokit({
      auth: config.accessToken,
    });
  }

  /**
   * Get authenticated user info
   */
  async getUser() {
    try {
      const response = await this.octokit.users.getAuthenticated();
      return {
        success: true,
        user: {
          id: response.data.id,
          username: response.data.login,
          email: response.data.email,
          name: response.data.name,
          avatar: response.data.avatar_url,
          bio: response.data.bio,
          company: response.data.company,
          location: response.data.location,
          publicRepos: response.data.public_repos,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get user info",
      };
    }
  }

  /**
   * List user's repositories
   */
  async listRepositories(options?: { type?: "all" | "owner" | "public" | "private"; sort?: "created" | "updated" | "pushed" | "full_name"; perPage?: number }) {
    try {
      const response = await this.octokit.repos.listForAuthenticatedUser({
        type: options?.type || "owner",
        sort: options?.sort || "updated",
        per_page: options?.perPage || 30,
      });

      return {
        success: true,
        repositories: response.data.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          description: repo.description,
          private: repo.private,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          defaultBranch: repo.default_branch,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          pushedAt: repo.pushed_at,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list repositories",
      };
    }
  }

  /**
   * Create a new repository
   */
  async createRepository(options: CreateRepoOptions) {
    try {
      const response = await this.octokit.repos.createForAuthenticatedUser({
        name: options.name,
        description: options.description,
        private: options.private ?? true,
        auto_init: options.autoInit ?? true,
      });

      this.owner = response.data.owner.login;
      this.repo = response.data.name;

      return {
        success: true,
        repository: {
          id: response.data.id,
          name: response.data.name,
          fullName: response.data.full_name,
          url: response.data.html_url,
          cloneUrl: response.data.clone_url,
          sshUrl: response.data.ssh_url,
          defaultBranch: response.data.default_branch,
          private: response.data.private,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create repository",
      };
    }
  }

  /**
   * Push files to repository
   */
  async pushFiles(owner: string, repo: string, options: PushOptions) {
    try {
      const branch = options.branch || "main";
      const message = options.message || "Initial commit from AppStudio";

      // Get the latest commit SHA on the branch
      const refResponse = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });

      const latestCommitSha = refResponse.data.object.sha;

      // Get the tree of the latest commit
      const commitResponse = await this.octokit.git.getCommit({
        owner,
        repo,
        commit_sha: latestCommitSha,
      });

      const baseTreeSha = commitResponse.data.tree.sha;

      // Create blob for each file
      const blobs = await Promise.all(
        Object.entries(options.content).map(async ([filepath, content]: [string, string]) => {
          const blobResponse = await this.octokit.git.createBlob({
            owner,
            repo,
            content,
            encoding: "utf-8",
          });
          return {
            path: filepath,
            mode: "100644" as const,
            type: "blob" as const,
            sha: blobResponse.data.sha,
          };
        })
      );

      // Create a new tree
      const treeResponse = await this.octokit.git.createTree({
        owner,
        repo,
        base_tree: baseTreeSha,
        tree: blobs,
      });

      // Create a new commit
      const newCommitResponse = await this.octokit.git.createCommit({
        owner,
        repo,
        message,
        tree: treeResponse.data.sha,
        parents: [latestCommitSha],
      });

      // Update the reference
      await this.octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommitResponse.data.sha,
      });

      return {
        success: true,
        commit: {
          sha: newCommitResponse.data.sha,
          message,
          filesCount: Object.keys(options.content).length,
          url: newCommitResponse.data.html_url,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to push files",
      };
    }
  }

  /**
   * List pull requests for a repository
   */
  async listPullRequests(owner: string, repo: string, options?: { state?: "open" | "closed" | "all"; perPage?: number }) {
    try {
      const response = await this.octokit.pulls.list({
        owner,
        repo,
        state: options?.state || "open",
        per_page: options?.perPage || 30,
      });

      return {
        success: true,
        pullRequests: response.data.map((pr: any) => ({
          id: pr.id,
          number: pr.number,
          title: pr.title,
          description: pr.body,
          author: pr.user?.login,
          state: pr.state,
          sourceBranch: pr.head.ref,
          targetBranch: pr.base.ref,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          mergedAt: pr.merged_at,
          closedAt: pr.closed_at,
          url: pr.html_url,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list pull requests",
      };
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(owner: string, repo: string, options: CreatePROptions) {
    try {
      const response = await this.octokit.pulls.create({
        owner,
        repo,
        title: options.title,
        body: options.body,
        head: options.head,
        base: options.base,
        draft: options.draft,
      });

      return {
        success: true,
        pullRequest: {
          id: response.data.id,
          number: response.data.number,
          title: response.data.title,
          url: response.data.html_url,
          state: response.data.state,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create pull request",
      };
    }
  }

  /**
   * List issues for a repository
   */
  async listIssues(owner: string, repo: string, options?: { state?: "open" | "closed" | "all"; perPage?: number }) {
    try {
      const response = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: options?.state || "open",
        per_page: options?.perPage || 30,
      });

      return {
        success: true,
        issues: response.data.map((issue: any) => ({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          description: issue.body,
          author: issue.user?.login,
          state: issue.state,
          labels: issue.labels.map((l: any) => (typeof l === "string" ? l : l.name)),
          assignees: issue.assignees?.map((a: any) => a.login) || [],
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          closedAt: issue.closed_at,
          url: issue.html_url,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list issues",
      };
    }
  }

  /**
   * Create an issue
   */
  async createIssue(owner: string, repo: string, options: CreateIssueOptions) {
    try {
      const response = await this.octokit.issues.create({
        owner,
        repo,
        title: options.title,
        body: options.body,
        labels: options.labels,
        assignees: options.assignees,
      });

      return {
        success: true,
        issue: {
          id: response.data.id,
          number: response.data.number,
          title: response.data.title,
          url: response.data.html_url,
          state: response.data.state,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create issue",
      };
    }
  }

  /**
   * Update an issue
   */
  async updateIssue(owner: string, repo: string, issueNumber: number, options: { state?: "open" | "closed"; labels?: string[]; assignees?: string[] }) {
    try {
      const response = await this.octokit.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        state: options.state,
        labels: options.labels,
        assignees: options.assignees,
      });

      return {
        success: true,
        issue: {
          id: response.data.id,
          number: response.data.number,
          title: response.data.title,
          state: response.data.state,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update issue",
      };
    }
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string) {
    try {
      const response = await this.octokit.repos.get({
        owner,
        repo,
      });

      return {
        success: true,
        repository: {
          id: response.data.id,
          name: response.data.name,
          fullName: response.data.full_name,
          url: response.data.html_url,
          description: response.data.description,
          private: response.data.private,
          language: response.data.language,
          stars: response.data.stargazers_count,
          forks: response.data.forks_count,
          defaultBranch: response.data.default_branch,
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at,
          pushedAt: response.data.pushed_at,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get repository",
      };
    }
  }

  /**
   * Create a webhook
   */
  async createWebhook(owner: string, repo: string, url: string, events: string[] = ["push", "pull_request"]) {
    try {
      const response = await this.octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url,
          content_type: "json",
          insecure_ssl: "0",
        },
        events: events as any,
        active: true,
      });

      return {
        success: true,
        webhook: {
          id: response.data.id,
          url: response.data.config.url,
          events: response.data.events,
          active: response.data.active,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create webhook",
      };
    }
  }
}
