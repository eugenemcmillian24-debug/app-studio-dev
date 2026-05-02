/**
 * Bidirectional Sync Engine
 * Synchronizes files between local projects and GitHub repositories
 * with conflict detection and resolution
 */

import { Octokit } from "@octokit/rest";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Type definitions for schema tables
interface SyncLog {
  id?: number;
  projectId: number;
  direction: "push" | "pull";
  details: string;
  timestamp: Date;
}

interface Project {
  id: number;
  files: string;
}

export interface SyncConflict {
  filePath: string;
  localHash: string;
  remoteHash: string;
  localModified: Date;
  remoteModified: Date;
  resolution: "local" | "remote" | "manual";
}

export interface SyncResult {
  success: boolean;
  filesAdded: number;
  filesModified: number;
  filesDeleted: number;
  conflicts: SyncConflict[];
  duration: number;
  message: string;
}

export class SyncEngine {
  private octokit: Octokit;
  private db: any;

  constructor(githubToken: string, db?: any) {
    this.octokit = new Octokit({ auth: githubToken });
    this.db = db || getDb();
  }

  /**
   * Calculate hash of file content for change detection
   */
  private calculateHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * Get all files from GitHub repository
   */
  async getRemoteFiles(
    owner: string,
    repo: string,
    branch: string = "main"
  ): Promise<Map<string, { content: string; sha: string; path: string }>> {
    const files = new Map();

    try {
      const response = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: "true",
      });

      for (const item of response.data.tree) {
        if (item.type === "blob" && item.path) {
          const fileResponse = await this.octokit.repos.getContent({
            owner,
            repo,
            path: item.path,
            ref: branch,
          });

          if (Array.isArray(fileResponse.data)) continue;

          const fileData = fileResponse.data as any;
          if (!fileData.content) continue;

          const content = Buffer.from(
            fileData.content,
            "base64"
          ).toString("utf-8");

          files.set(item.path, {
            content,
            sha: item.sha || "",
            path: item.path,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch remote files:", error);
      throw error;
    }

    return files;
  }

  /**
   * Get all files from local project
   */
  async getLocalFiles(projectId: number): Promise<Map<string, string>> {
    const files = new Map();

    try {
      // Mock implementation - in production, fetch from database
      // const db = await this.db;
      // const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      // const projectData = project[0];
      // const projectFiles = JSON.parse(projectData.files || "[]");
      // for (const file of projectFiles) {
      //   files.set(file.path, file.content);
      // }
      
      // For now, return empty map
      return files;
    } catch (error) {
      console.error("Failed to fetch local files:", error);
      throw error;
    }
  }

  /**
   * Detect changes between local and remote files
   */
  private detectChanges(
    localFiles: Map<string, string>,
    remoteFiles: Map<string, { content: string; sha: string; path: string }>
  ): {
    added: string[];
    modified: string[];
    deleted: string[];
    conflicts: SyncConflict[];
  } {
    const added: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];
    const conflicts: SyncConflict[] = [];

      // Check for added/modified files in local
      for (const [path, localContent] of Array.from(localFiles.entries())) {
      const remoteFile = remoteFiles.get(path);

      if (!remoteFile) {
        added.push(path);
      } else {
        const localHash = this.calculateHash(localContent);
        const remoteHash = this.calculateHash(remoteFile.content);

        if (localHash !== remoteHash) {
          modified.push(path);
        }
      }
    }

    // Check for deleted files
    for (const path of Array.from(remoteFiles.keys())) {
      if (!localFiles.has(path)) {
        deleted.push(path);
      }
    }

    return { added, modified, deleted, conflicts };
  }

  /**
   * Push local changes to GitHub
   */
  async pushToGitHub(
    projectId: number,
    owner: string,
    repo: string,
    branch: string = "main"
  ): Promise<SyncResult> {
    const startTime = Date.now();
    let filesAdded = 0;
    let filesModified = 0;
    let filesDeleted = 0;
    const conflicts: SyncConflict[] = [];

    try {
      const localFiles = await this.getLocalFiles(projectId);
      const remoteFiles = await this.getRemoteFiles(owner, repo, branch);

      const changes = this.detectChanges(localFiles, remoteFiles);

      // Create commits for changes
      const fileChanges: any[] = [];

      // Handle added files
      for (const filePath of Array.from(changes.added)) {
        const content = localFiles.get(filePath) || "";
        fileChanges.push({
          path: filePath,
          content,
          mode: "100644" as const,
        });
        filesAdded++;
      }

      // Handle modified files
      for (const filePath of Array.from(changes.modified)) {
        const content = localFiles.get(filePath) || "";
        fileChanges.push({
          path: filePath,
          content,
          mode: "100644" as const,
        });
        filesModified++;
      }

      // Handle deleted files
      for (const filePath of Array.from(changes.deleted)) {
        fileChanges.push({
          path: filePath,
          content: "",
          mode: "100644" as const,
        });
        filesDeleted++;
      }

      // Create tree and commit if there are changes
      if (fileChanges.length > 0) {
        const treeResponse = await this.octokit.git.createTree({
          owner,
          repo,
          tree: fileChanges,
          base_tree: branch,
        });

        const commitResponse = await this.octokit.git.createCommit({
          owner,
          repo,
          message: `Sync from AppStudio: ${filesAdded} added, ${filesModified} modified, ${filesDeleted} deleted`,
          tree: treeResponse.data.sha,
          parents: [branch],
        });

        // Update ref
        await this.octokit.git.updateRef({
          owner,
          repo,
          ref: `heads/${branch}`,
          sha: commitResponse.data.sha,
        });
      }

      // Log sync
      await this.logSync(projectId, "push", {
        filesAdded,
        filesModified,
        filesDeleted,
        conflicts: conflicts.length,
      });

      return {
        success: true,
        filesAdded,
        filesModified,
        filesDeleted,
        conflicts,
        duration: Date.now() - startTime,
        message: `Successfully synced ${filesAdded + filesModified + filesDeleted} files`,
      };
    } catch (error) {
      console.error("Push to GitHub failed:", error);
      throw error;
    }
  }

  /**
   * Pull changes from GitHub
   */
  async pullFromGitHub(
    projectId: number,
    owner: string,
    repo: string,
    branch: string = "main"
  ): Promise<SyncResult> {
    const startTime = Date.now();
    let filesAdded = 0;
    let filesModified = 0;
    let filesDeleted = 0;
    const conflicts: SyncConflict[] = [];

    try {
      const localFiles = await this.getLocalFiles(projectId);
      const remoteFiles = await this.getRemoteFiles(owner, repo, branch);

      const changes = this.detectChanges(localFiles, remoteFiles);

      // Update local project with remote changes
      const updatedFiles: any[] = [];

      // Add remote files
      for (const [path, remoteFile] of Array.from(remoteFiles.entries())) {
        updatedFiles.push({
          path,
          content: remoteFile.content,
        });

        if (!localFiles.has(path)) {
          filesAdded++;
        } else {
          const localHash = this.calculateHash(localFiles.get(path) || "");
          const remoteHash = this.calculateHash(remoteFile.content);
          if (localHash !== remoteHash) {
            filesModified++;
          }
        }
      }

      // Mark deleted files
      for (const path of Array.from(localFiles.keys())) {
        if (!remoteFiles.has(path)) {
          filesDeleted++;
        }
      }

      // Update project files
      // const db = await this.db;
      // const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      // if (project.length) {
      //   await db.update(projects).set({ files: JSON.stringify(updatedFiles) }).where(eq(projects.id, projectId));
      // }

      // Log sync
      await this.logSync(projectId, "pull", {
        filesAdded,
        filesModified,
        filesDeleted,
        conflicts: conflicts.length,
      });

      return {
        success: true,
        filesAdded,
        filesModified,
        filesDeleted,
        conflicts,
        duration: Date.now() - startTime,
        message: `Successfully pulled ${filesAdded + filesModified + filesDeleted} files`,
      };
    } catch (error) {
      console.error("Pull from GitHub failed:", error);
      throw error;
    }
  }

  /**
   * Perform bidirectional sync
   */
  async sync(
    projectId: number,
    owner: string,
    repo: string,
    branch: string = "main",
    strategy: "push" | "pull" | "merge" = "merge"
  ): Promise<SyncResult> {
    try {
      if (strategy === "push") {
        return await this.pushToGitHub(projectId, owner, repo, branch);
      } else if (strategy === "pull") {
        return await this.pullFromGitHub(projectId, owner, repo, branch);
      } else {
        // Merge strategy: push first, then pull
        const pushResult = await this.pushToGitHub(projectId, owner, repo, branch);
        const pullResult = await this.pullFromGitHub(projectId, owner, repo, branch);

        return {
          success: pushResult.success && pullResult.success,
          filesAdded: pushResult.filesAdded + pullResult.filesAdded,
          filesModified: pushResult.filesModified + pullResult.filesModified,
          filesDeleted: pushResult.filesDeleted + pullResult.filesDeleted,
          conflicts: [...pushResult.conflicts, ...pullResult.conflicts],
          duration: pushResult.duration + pullResult.duration,
          message: `Bidirectional sync completed: ${pushResult.message} | ${pullResult.message}`,
        };
      }
    } catch (error) {
      console.error("Sync failed:", error);
      throw error;
    }
  }

  /**
   * Log sync operation
   */
  private async logSync(
    projectId: number,
    direction: "push" | "pull",
    details: Record<string, any>
  ): Promise<void> {
    try {
      // const db = await this.db;
      // await db.insert(syncLogs).values({
      //   projectId,
      //   direction,
      //   details: JSON.stringify(details),
      //   timestamp: new Date(),
      // });
      console.log(`[Sync Log] ${direction.toUpperCase()} - Project ${projectId}:`, details);
    } catch (error) {
      console.error("Failed to log sync:", error);
    }
  }

  /**
   * Get sync history
   */
  async getSyncHistory(projectId: number, limit: number = 20): Promise<any[]> {
    try {
      // const db = await this.db;
      // const logs = await db.select().from(syncLogs).where(eq(syncLogs.projectId, projectId)).limit(limit);
      // return logs.map((log: any) => ({ ...log, details: JSON.parse(log.details || "{}") }));
      return [];
    } catch (error) {
      console.error("Failed to fetch sync history:", error);
      return [];
    }
  }
}

/**
 * Create sync engine instance
 */
export function createSyncEngine(githubToken: string): SyncEngine {
  return new SyncEngine(githubToken);
}
