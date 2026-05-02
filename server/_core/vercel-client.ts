/**
 * Vercel API client wrapper for AppStudio
 * Handles project management, deployments, and environment variables
 */

export interface VercelAuthConfig {
  accessToken: string;
  teamId?: string;
}

export interface CreateProjectOptions {
  name: string;
  framework?: string;
  gitRepository?: {
    repo: string;
    type: "github" | "gitlab" | "bitbucket";
  };
  rootDirectory?: string;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
}

export interface DeploymentOptions {
  projectId: string;
  gitCommitSha?: string;
  gitBranch?: string;
  production?: boolean;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  target?: ("production" | "preview" | "development")[];
}

/**
 * Vercel API Client
 */
export class VercelClient {
  private accessToken: string;
  private teamId?: string;
  private baseUrl = "https://api.vercel.com";

  constructor(config: VercelAuthConfig) {
    this.accessToken = config.accessToken;
    this.teamId = config.teamId;
  }

  /**
   * Make API request to Vercel
   */
  private async request(method: string, path: string, body?: any) {
    const url = `${this.baseUrl}${path}${this.teamId ? `?teamId=${this.teamId}` : ""}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Vercel API error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get authenticated user info
   */
  async getUser() {
    try {
      const data = await this.request("GET", "/v2/user");
      return {
        success: true,
        user: {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          name: data.user.name,
          avatar: data.user.avatar,
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
   * List user's projects
   */
  async listProjects(options?: { limit?: number }) {
    try {
      const limit = options?.limit || 20;
      const data = await this.request("GET", `/v9/projects?limit=${limit}`);

      return {
        success: true,
        projects: data.projects.map((project: any) => ({
          id: project.id,
          name: project.name,
          slug: project.slug,
          framework: project.framework,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          productionDeployment: project.productionDeployment,
          latestDeployments: project.latestDeployments,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list projects",
      };
    }
  }

  /**
   * Get project details
   */
  async getProject(projectId: string) {
    try {
      const data = await this.request("GET", `/v9/projects/${projectId}`);

      return {
        success: true,
        project: {
          id: data.project.id,
          name: data.project.name,
          slug: data.project.slug,
          framework: data.project.framework,
          createdAt: data.project.createdAt,
          updatedAt: data.project.updatedAt,
          productionUrl: data.project.productionDeployment?.url,
          previewUrl: data.project.previewDeployment?.url,
          gitRepository: data.project.link,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get project",
      };
    }
  }

  /**
   * Create a new project
   */
  async createProject(options: CreateProjectOptions) {
    try {
      const payload: any = {
        name: options.name,
        framework: options.framework || "nextjs",
      };

      if (options.gitRepository) {
        payload.gitRepository = options.gitRepository;
      }

      if (options.rootDirectory) {
        payload.rootDirectory = options.rootDirectory;
      }

      if (options.buildCommand) {
        payload.buildCommand = options.buildCommand;
      }

      if (options.outputDirectory) {
        payload.outputDirectory = options.outputDirectory;
      }

      if (options.installCommand) {
        payload.installCommand = options.installCommand;
      }

      const data = await this.request("POST", "/v10/projects", payload);

      return {
        success: true,
        project: {
          id: data.project.id,
          name: data.project.name,
          slug: data.project.slug,
          createdAt: data.project.createdAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create project",
      };
    }
  }

  /**
   * List deployments for a project
   */
  async listDeployments(projectId: string, options?: { limit?: number; state?: string }) {
    try {
      const limit = options?.limit || 20;
      const state = options?.state || "READY";
      const data = await this.request("GET", `/v6/deployments?projectId=${projectId}&limit=${limit}&state=${state}`);

      return {
        success: true,
        deployments: data.deployments.map((deployment: any) => ({
          id: deployment.id,
          url: deployment.url,
          state: deployment.state,
          environment: deployment.environment,
          gitCommitSha: deployment.meta?.githubCommitSha,
          gitBranch: deployment.meta?.githubCommitRef,
          createdAt: deployment.createdAt,
          completedAt: deployment.completedAt,
          errorMessage: deployment.errorMessage,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list deployments",
      };
    }
  }

  /**
   * Get deployment details
   */
  async getDeployment(deploymentId: string) {
    try {
      const data = await this.request("GET", `/v13/deployments/${deploymentId}`);

      return {
        success: true,
        deployment: {
          id: data.deployment.id,
          url: data.deployment.url,
          state: data.deployment.state,
          environment: data.deployment.environment,
          gitCommitSha: data.deployment.meta?.githubCommitSha,
          gitBranch: data.deployment.meta?.githubCommitRef,
          createdAt: data.deployment.createdAt,
          completedAt: data.deployment.completedAt,
          errorMessage: data.deployment.errorMessage,
          buildDurationMs: data.deployment.buildingAt ? Date.now() - new Date(data.deployment.buildingAt).getTime() : undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get deployment",
      };
    }
  }

  /**
   * Trigger a deployment
   */
  async triggerDeployment(projectId: string, options?: DeploymentOptions) {
    try {
      const payload: any = {
        gitCommitSha: options?.gitCommitSha,
        gitBranch: options?.gitBranch,
        production: options?.production ?? false,
      };

      const data = await this.request("POST", `/v13/projects/${projectId}/deployments`, payload);

      return {
        success: true,
        deployment: {
          id: data.deployment.id,
          url: data.deployment.url,
          state: data.deployment.state,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to trigger deployment",
      };
    }
  }

  /**
   * Get environment variables for a project
   */
  async getEnvironmentVariables(projectId: string) {
    try {
      const data = await this.request("GET", `/v9/projects/${projectId}/env`);

      return {
        success: true,
        variables: data.envs.map((env: any) => ({
          id: env.id,
          key: env.key,
          value: env.value,
          target: env.target,
          createdAt: env.createdAt,
          updatedAt: env.updatedAt,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get environment variables",
      };
    }
  }

  /**
   * Set environment variables for a project
   */
  async setEnvironmentVariables(projectId: string, variables: EnvironmentVariable[]) {
    try {
      const payload = {
        envs: variables.map((v) => ({
          key: v.key,
          value: v.value,
          target: v.target || ["production", "preview", "development"],
          type: "plain",
        })),
      };

      const data = await this.request("POST", `/v9/projects/${projectId}/env`, payload);

      return {
        success: true,
        variables: data.envs.map((env: any) => ({
          id: env.id,
          key: env.key,
          target: env.target,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to set environment variables",
      };
    }
  }

  /**
   * Delete an environment variable
   */
  async deleteEnvironmentVariable(projectId: string, envId: string) {
    try {
      await this.request("DELETE", `/v9/projects/${projectId}/env/${envId}`);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete environment variable",
      };
    }
  }

  /**
   * Get project domains
   */
  async getProjectDomains(projectId: string) {
    try {
      const data = await this.request("GET", `/v9/projects/${projectId}/domains`);

      return {
        success: true,
        domains: data.domains.map((domain: any) => ({
          name: domain.name,
          apexName: domain.apexName,
          verified: domain.verified,
          createdAt: domain.createdAt,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get project domains",
      };
    }
  }

  /**
   * Add a custom domain to a project
   */
  async addDomain(projectId: string, domain: string) {
    try {
      const data = await this.request("POST", `/v10/projects/${projectId}/domains`, {
        name: domain,
      });

      return {
        success: true,
        domain: {
          name: data.name,
          verified: data.verified,
          createdAt: data.createdAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add domain",
      };
    }
  }

  /**
   * Remove a custom domain from a project
   */
  async removeDomain(projectId: string, domain: string) {
    try {
      await this.request("DELETE", `/v9/projects/${projectId}/domains/${domain}`);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove domain",
      };
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId: string) {
    try {
      const data = await this.request("GET", `/v11/deployments/${deploymentId}/logs`);

      return {
        success: true,
        logs: data.logs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get deployment logs",
      };
    }
  }
}
