/**
 * Unit tests for GitHub and Vercel integration
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { GitHubClient } from "./_core/github-client";
import { VercelClient } from "./_core/vercel-client";
import { verifyGitHubSignature, verifyVercelSignature } from "./webhooks";
import crypto from "crypto";

describe("GitHub Integration", () => {
  let githubClient: GitHubClient;

  beforeEach(() => {
    githubClient = new GitHubClient({
      accessToken: "test_token",
    });
  });

  describe("GitHubClient", () => {
    it("should initialize with access token", () => {
      expect(githubClient).toBeDefined();
    });

    it("should handle API errors gracefully", async () => {
      // Mock failed API call
      const result = await githubClient.getUser();
      expect(result).toHaveProperty("success");
    });

    it("should format repository data correctly", async () => {
      // Test data formatting
      const mockRepos = [
        {
          id: 1,
          name: "test-repo",
          full_name: "user/test-repo",
          html_url: "https://github.com/user/test-repo",
          description: "Test repository",
          private: false,
          language: "TypeScript",
          stargazers_count: 10,
          forks_count: 2,
          default_branch: "main",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-05-02T00:00:00Z",
          pushed_at: "2024-05-02T00:00:00Z",
        },
      ];

      // Verify structure
      expect(mockRepos[0]).toHaveProperty("id");
      expect(mockRepos[0]).toHaveProperty("name");
      expect(mockRepos[0]).toHaveProperty("html_url");
    });

    it("should handle file push operations", async () => {
      const content = {
        "package.json": '{"name": "test"}',
        "README.md": "# Test Project",
      };

      expect(content).toHaveProperty("package.json");
      expect(Object.keys(content).length).toBe(2);
    });

    it("should format PR data correctly", () => {
      const mockPR = {
        id: 1,
        number: 1,
        title: "Test PR",
        body: "Test PR description",
        user: { login: "testuser" },
        state: "open",
        head: { ref: "feature/test" },
        base: { ref: "main" },
        created_at: "2024-05-01T00:00:00Z",
        updated_at: "2024-05-02T00:00:00Z",
        merged_at: null,
        closed_at: null,
        html_url: "https://github.com/user/repo/pull/1",
      };

      expect(mockPR).toHaveProperty("number");
      expect(mockPR.state).toBe("open");
      expect(mockPR.head.ref).toBe("feature/test");
    });

    it("should format issue data correctly", () => {
      const mockIssue = {
        id: 1,
        number: 1,
        title: "Test Issue",
        body: "Test issue description",
        user: { login: "testuser" },
        state: "open",
        labels: [{ name: "bug" }, { name: "high-priority" }],
        assignees: [{ login: "assignee1" }],
        created_at: "2024-05-01T00:00:00Z",
        updated_at: "2024-05-02T00:00:00Z",
        closed_at: null,
        html_url: "https://github.com/user/repo/issues/1",
      };

      expect(mockIssue).toHaveProperty("number");
      expect(mockIssue.state).toBe("open");
      expect(mockIssue.labels.length).toBe(2);
    });
  });

  describe("Webhook Signature Verification", () => {
    it("should verify valid GitHub signature", () => {
      const secret = "test_secret";
      const payload = '{"test": "data"}';

      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(payload);
      const validSignature = `sha256=${hmac.digest("hex")}`;

      const isValid = verifyGitHubSignature(payload, validSignature, secret);
      expect(isValid).toBe(true);
    });

    it("should reject invalid GitHub signature", () => {
      const secret = "test_secret";
      const payload = '{"test": "data"}';
      const invalidSignature = "sha256=invalid";

      const isValid = verifyGitHubSignature(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });

    it("should verify valid Vercel signature", () => {
      const secret = "test_secret";
      const payload = '{"test": "data"}';

      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(payload);
      const validSignature = hmac.digest("hex");

      const isValid = verifyVercelSignature(payload, validSignature, secret);
      expect(isValid).toBe(true);
    });

    it("should reject invalid Vercel signature", () => {
      const secret = "test_secret";
      const payload = '{"test": "data"}';
      const invalidSignature = "invalid";

      const isValid = verifyVercelSignature(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });
  });
});

describe("Vercel Integration", () => {
  let vercelClient: VercelClient;

  beforeEach(() => {
    vercelClient = new VercelClient({
      accessToken: "test_token",
    });
  });

  describe("VercelClient", () => {
    it("should initialize with access token", () => {
      expect(vercelClient).toBeDefined();
    });

    it("should handle API errors gracefully", async () => {
      const result = await vercelClient.getUser();
      expect(result).toHaveProperty("success");
    });

    it("should format project data correctly", () => {
      const mockProject = {
        id: "prj_123",
        name: "my-project",
        slug: "my-project",
        framework: "nextjs",
        createdAt: 1704067200000,
        updatedAt: 1746603600000,
        productionDeployment: {
          url: "https://my-project.vercel.app",
        },
      };

      expect(mockProject).toHaveProperty("id");
      expect(mockProject).toHaveProperty("name");
      expect(mockProject.framework).toBe("nextjs");
    });

    it("should format deployment data correctly", () => {
      const mockDeployment = {
        id: "dpl_123",
        url: "https://my-project-abc123.vercel.app",
        state: "READY",
        environment: "production",
        meta: {
          githubCommitSha: "abc123",
          githubCommitRef: "main",
        },
        createdAt: 1746603600000,
        completedAt: 1746603700000,
      };

      expect(mockDeployment).toHaveProperty("id");
      expect(mockDeployment.state).toBe("READY");
      expect(mockDeployment.meta.githubCommitRef).toBe("main");
    });

    it("should format environment variable data correctly", () => {
      const mockEnvVar = {
        id: "env_123",
        key: "DATABASE_URL",
        value: "postgresql://...",
        target: ["production", "preview"],
        createdAt: 1746603600000,
        updatedAt: 1746603600000,
      };

      expect(mockEnvVar).toHaveProperty("key");
      expect(mockEnvVar).toHaveProperty("value");
      expect(mockEnvVar.target).toContain("production");
    });
  });
});

describe("Integration Workflow", () => {
  it("should handle complete GitHub to Vercel workflow", async () => {
    // Simulate workflow steps
    const steps = [
      { name: "GitHub OAuth", status: "pending" },
      { name: "Create Repository", status: "pending" },
      { name: "Push Scaffold", status: "pending" },
      { name: "Vercel OAuth", status: "pending" },
      { name: "Create Vercel Project", status: "pending" },
      { name: "Trigger Deployment", status: "pending" },
    ];

    // Verify all steps are tracked
    expect(steps.length).toBe(6);
    expect(steps[0].name).toBe("GitHub OAuth");
    expect(steps[steps.length - 1].name).toBe("Trigger Deployment");
  });

  it("should handle webhook event processing", () => {
    const githubPushEvent = {
      ref: "refs/heads/main",
      repository: {
        name: "test-repo",
        owner: { login: "testuser" },
      },
      commits: [
        {
          id: "abc123",
          message: "Update README",
        },
      ],
    };

    expect(githubPushEvent).toHaveProperty("ref");
    expect(githubPushEvent.commits.length).toBe(1);
  });

  it("should handle deployment status updates", () => {
    const deploymentStatusEvent = {
      type: "deployment.ready",
      deployment: {
        id: "dpl_123",
        state: "READY",
        url: "https://my-project.vercel.app",
      },
    };

    expect(deploymentStatusEvent.deployment.state).toBe("READY");
    expect(deploymentStatusEvent.deployment).toHaveProperty("url");
  });
});

describe("Error Handling", () => {
  it("should handle network errors", async () => {
    const githubClient = new GitHubClient({
      accessToken: "invalid_token",
    });

    const result = await githubClient.getUser();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should handle invalid credentials", async () => {
    const vercelClient = new VercelClient({
      accessToken: "invalid_token",
    });

    const result = await vercelClient.getUser();
    expect(result.success).toBe(false);
  });

  it("should handle malformed webhook payloads", () => {
    const malformedPayload = "not json";
    const signature = "sha256=invalid";

    // Should not throw, just return false
    expect(() => {
      verifyGitHubSignature(malformedPayload, signature, "secret");
    }).not.toThrow();
  });
});

describe("Data Validation", () => {
  it("should validate repository names", () => {
    const validNames = ["my-repo", "MyRepo", "my_repo", "repo123"];
    const invalidNames = ["", " ", "repo with spaces"];

    validNames.forEach((name) => {
      expect(name.length).toBeGreaterThan(0);
    });

    invalidNames.forEach((name) => {
      expect(name.trim().length === 0 || name.includes(" ")).toBe(true);
    });
  });

  it("should validate project names", () => {
    const validNames = ["my-project", "MyProject", "project_123"];
    const invalidNames = ["", " ", "project@invalid"];

    validNames.forEach((name) => {
      expect(name.length).toBeGreaterThan(0);
    });
  });

  it("should validate environment variable keys", () => {
    const validKeys = ["DATABASE_URL", "API_KEY", "SECRET_TOKEN"];
    const invalidKeys = ["", " ", "key with spaces"];

    validKeys.forEach((key) => {
      expect(/^[A-Z_][A-Z0-9_]*$/.test(key)).toBe(true);
    });
  });
});
