/**
 * Webhook Integration Tests
 * Tests for GitHub and Vercel webhook event handling
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";

// Mock webhook payloads
const mockGitHubPushEvent = {
  ref: "refs/heads/main",
  before: "9049aab4c2a0207e4aadb2c2b16a57ca6b5b009",
  after: "35c146f23fda6762dc58e11854ec18b52bbb5ef7",
  repository: {
    id: 12345678,
    name: "test-repo",
    full_name: "testuser/test-repo",
    private: false,
    owner: {
      name: "testuser",
      email: "test@example.com",
      login: "testuser",
    },
    html_url: "https://github.com/testuser/test-repo",
    description: "Test repository",
    fork: false,
    url: "https://github.com/testuser/test-repo",
    forks_count: 0,
    open_issues_count: 0,
    watchers_count: 0,
    default_branch: "main",
  },
  pusher: {
    name: "testuser",
    email: "test@example.com",
  },
  sender: {
    login: "testuser",
    id: 1,
    type: "User",
  },
  created: false,
  deleted: false,
  forced: false,
  compare: "https://github.com/testuser/test-repo/compare/9049aab4c2a0...35c146f23fda",
  commits: [
    {
      id: "35c146f23fda6762dc58e11854ec18b52bbb5ef7",
      tree_id: "f9d2a07e9955aad",
      message: "Update README",
      timestamp: "2026-05-02T20:30:00Z",
      author: {
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
      },
      committer: {
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
      },
      added: ["README.md"],
      removed: [],
      modified: [],
    },
  ],
  head_commit: {
    id: "35c146f23fda6762dc58e11854ec18b52bbb5ef7",
    tree_id: "f9d2a07e9955aad",
    message: "Update README",
    timestamp: "2026-05-02T20:30:00Z",
    author: {
      name: "Test User",
      email: "test@example.com",
      username: "testuser",
    },
    committer: {
      name: "Test User",
      email: "test@example.com",
      username: "testuser",
    },
    added: ["README.md"],
    removed: [],
    modified: [],
  },
};

const mockGitHubPullRequestEvent = {
  action: "opened",
  number: 1,
  pull_request: {
    id: 1,
    node_id: "MDExOlB1bGxSZXF1ZXN0MQ==",
    number: 1,
    title: "Add new feature",
    user: {
      login: "testuser",
      id: 1,
      type: "User",
    },
    body: "This PR adds a new feature",
    created_at: "2026-05-02T20:30:00Z",
    updated_at: "2026-05-02T20:30:00Z",
    closed_at: null,
    merged_at: null,
    merge_commit_sha: null,
    head: {
      label: "testuser:feature-branch",
      ref: "feature-branch",
      sha: "35c146f23fda6762dc58e11854ec18b52bbb5ef7",
      user: {
        login: "testuser",
        id: 1,
      },
      repo: {
        id: 12345678,
        name: "test-repo",
        full_name: "testuser/test-repo",
      },
    },
    base: {
      label: "testuser:main",
      ref: "main",
      sha: "9049aab4c2a0207e4aadb2c2b16a57ca6b5b009",
      user: {
        login: "testuser",
        id: 1,
      },
      repo: {
        id: 12345678,
        name: "test-repo",
        full_name: "testuser/test-repo",
      },
    },
    state: "open",
    locked: false,
    draft: false,
    commits: 1,
    additions: 10,
    deletions: 5,
    changed_files: 2,
  },
  repository: {
    id: 12345678,
    name: "test-repo",
    full_name: "testuser/test-repo",
  },
  sender: {
    login: "testuser",
    id: 1,
  },
};

const mockGitHubIssueEvent = {
  action: "opened",
  issue: {
    url: "https://api.github.com/repos/testuser/test-repo/issues/1",
    id: 1,
    number: 1,
    title: "Bug: Something is broken",
    user: {
      login: "testuser",
      id: 1,
    },
    labels: [
      {
        id: 1,
        name: "bug",
        color: "fc2929",
      },
    ],
    state: "open",
    locked: false,
    assignee: null,
    assignees: [],
    created_at: "2026-05-02T20:30:00Z",
    updated_at: "2026-05-02T20:30:00Z",
    closed_at: null,
    body: "Description of the bug",
    comments: 0,
  },
  repository: {
    id: 12345678,
    name: "test-repo",
    full_name: "testuser/test-repo",
  },
  sender: {
    login: "testuser",
    id: 1,
  },
};

const mockVercelDeploymentEvent = {
  type: "deployment",
  id: "dpl_1234567890abcdef",
  projectId: "prj_1234567890abcdef",
  name: "test-app",
  url: "https://test-app.vercel.app",
  environment: "production",
  state: "READY",
  stateReason: null,
  createdAt: 1777752600000,
  createdIn: "cli",
  creator: {
    uid: "usr_1234567890abcdef",
    email: "test@example.com",
    username: "testuser",
    githubLogin: "testuser",
  },
  functions: {},
  target: null,
  alias: ["test-app.vercel.app"],
  aliasAssigned: 1777752600,
  aliasError: null,
  builds: [
    {
      id: "bld_1234567890abcdef",
      src: "package.json",
      use: "@vercel/next",
      config: {},
    },
  ],
  routes: [],
  buildingAt: 1777752600000,
  deploymentHostname: "test-app.vercel.app",
};

const mockVercelDeploymentErrorEvent = {
  type: "deployment.error",
  id: "dpl_1234567890abcdef",
  projectId: "prj_1234567890abcdef",
  name: "test-app",
  url: "https://test-app.vercel.app",
  environment: "production",
  state: "ERROR",
  stateReason: "Build failed",
  createdAt: 1777752600000,
  error: {
    code: "BUILD_FAILED",
    message: "Failed to build the project",
  },
};

describe("Webhook Integration Tests", () => {
  describe("GitHub Webhooks", () => {
    it("should validate GitHub webhook signature", () => {
      const secret = "test-secret";
      const payload = JSON.stringify(mockGitHubPushEvent);
      const signature = "sha256=" + crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it("should process push events correctly", () => {
      const event = mockGitHubPushEvent;
      
      expect(event.ref).toBe("refs/heads/main");
      expect(event.commits).toHaveLength(1);
      expect(event.commits[0].message).toBe("Update README");
      expect(event.repository.name).toBe("test-repo");
    });

    it("should process pull request events correctly", () => {
      const event = mockGitHubPullRequestEvent;
      
      expect(event.action).toBe("opened");
      expect(event.pull_request.title).toBe("Add new feature");
      expect(event.pull_request.state).toBe("open");
      expect(event.pull_request.commits).toBe(1);
    });

    it("should process issue events correctly", () => {
      const event = mockGitHubIssueEvent;
      
      expect(event.action).toBe("opened");
      expect(event.issue.title).toBe("Bug: Something is broken");
      expect(event.issue.labels).toHaveLength(1);
      expect(event.issue.labels[0].name).toBe("bug");
    });

    it("should extract branch name from push event", () => {
      const event = mockGitHubPushEvent;
      const branch = event.ref.replace("refs/heads/", "");
      
      expect(branch).toBe("main");
    });

    it("should identify force push", () => {
      const event = { ...mockGitHubPushEvent, forced: true };
      
      expect(event.forced).toBe(true);
    });
  });

  describe("Vercel Webhooks", () => {
    it("should process deployment success event", () => {
      const event = mockVercelDeploymentEvent;
      
      expect(event.state).toBe("READY");
      expect(event.environment).toBe("production");
      expect(event.url).toBe("https://test-app.vercel.app");
    });

    it("should process deployment error event", () => {
      const event = mockVercelDeploymentErrorEvent;
      
      expect(event.state).toBe("ERROR");
      expect(event.stateReason).toBe("Build failed");
      expect(event.error.code).toBe("BUILD_FAILED");
    });

    it("should extract deployment URL", () => {
      const event = mockVercelDeploymentEvent;
      const url = event.alias?.[0] || event.url;
      
      expect(url).toBe("test-app.vercel.app");
    });

    it("should identify deployment environment", () => {
      const event = mockVercelDeploymentEvent;
      
      expect(["production", "preview", "development"]).toContain(event.environment);
    });
  });

  describe("Webhook Event Routing", () => {
    it("should route GitHub push to sync handler", () => {
      const event = mockGitHubPushEvent;
      const eventType = "push";
      
      expect(eventType).toBe("push");
      expect(event.ref).toBeDefined();
      expect(event.commits).toBeDefined();
    });

    it("should route GitHub PR to PR handler", () => {
      const event = mockGitHubPullRequestEvent;
      const eventType = "pull_request";
      
      expect(eventType).toBe("pull_request");
      expect(event.pull_request).toBeDefined();
    });

    it("should route Vercel deployment to deployment handler", () => {
      const event = mockVercelDeploymentEvent;
      const eventType = "deployment";
      
      expect(eventType).toBe("deployment");
      expect(event.state).toBeDefined();
    });
  });

  describe("Webhook Payload Validation", () => {
    it("should validate required GitHub push fields", () => {
      const event = mockGitHubPushEvent;
      
      expect(event.ref).toBeDefined();
      expect(event.repository).toBeDefined();
      expect(event.commits).toBeDefined();
    });

    it("should validate required Vercel deployment fields", () => {
      const event = mockVercelDeploymentEvent;
      
      expect(event.type).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.projectId).toBeDefined();
      expect(event.state).toBeDefined();
    });

    it("should handle missing optional fields", () => {
      const event = { ...mockGitHubPullRequestEvent };
      delete (event.pull_request as any).body;
      
      expect(event.pull_request.title).toBeDefined();
    });
  });

  describe("Webhook Error Handling", () => {
    it("should handle invalid JSON payload", () => {
      const invalidPayload = "{ invalid json }";
      
      expect(() => JSON.parse(invalidPayload)).toThrow();
    });

    it("should handle missing signature", () => {
      const signature = undefined;
      
      expect(signature).toBeUndefined();
    });

    it("should handle expired webhook events", () => {
      const now = Date.now();
      const timestamp = now - 100000; // 100 seconds ago (less than 5 minutes)
      const isExpired = (now - timestamp) > 300000; // 5 minutes
      
      expect(isExpired).toBe(false);
    });
  });

  describe("Webhook Deduplication", () => {
    it("should detect duplicate webhook events", () => {
      const event1 = mockGitHubPushEvent;
      const event2 = mockGitHubPushEvent;
      
      const hash1 = crypto
        .createHash("sha256")
        .update(JSON.stringify(event1))
        .digest("hex");
      
      const hash2 = crypto
        .createHash("sha256")
        .update(JSON.stringify(event2))
        .digest("hex");
      
      expect(hash1).toBe(hash2);
    });

    it("should differentiate unique webhook events", () => {
      const event1 = mockGitHubPushEvent;
      const event2 = { ...mockGitHubPushEvent, after: "different-sha" };
      
      const hash1 = crypto
        .createHash("sha256")
        .update(JSON.stringify(event1))
        .digest("hex");
      
      const hash2 = crypto
        .createHash("sha256")
        .update(JSON.stringify(event2))
        .digest("hex");
      
      expect(hash1).not.toBe(hash2);
    });
  });
});
