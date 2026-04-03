import { spawn } from "child_process";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { nanoid } from "nanoid";
import type { ScaffoldProject } from "../shared/scaffold-types";

interface ExecutionResult {
  sessionId: string;
  command: string;
  stdout: string[];
  stderr: string[];
  exitCode: number | null;
  completed: boolean;
}

// Store active sessions
const activeSessions = new Map<string, { process: any; lines: string[] }>();

/**
 * Create a temporary project directory with scaffold files
 */
export function createProjectDirectory(scaffold: ScaffoldProject): string {
  const sessionId = nanoid(8);
  const projectDir = join(tmpdir(), `appstudio-${sessionId}`);

  try {
    mkdirSync(projectDir, { recursive: true });

    // Write all scaffold files
    scaffold.files.forEach(file => {
      const filePath = join(projectDir, file.path);
      const dirPath = filePath.substring(0, filePath.lastIndexOf("/"));
      mkdirSync(dirPath, { recursive: true });
      writeFileSync(filePath, file.content);
    });

    // Write package.json
    writeFileSync(join(projectDir, "package.json"), scaffold.packageJson);

    // Write schema.sql
    writeFileSync(join(projectDir, "schema.sql"), scaffold.sqlSchema);

    // Write .env.example
    writeFileSync(join(projectDir, ".env.example"), scaffold.envExample);

    // Write README.md
    writeFileSync(join(projectDir, "README.md"), scaffold.readmeContent);

    return projectDir;
  } catch (error) {
    console.error("[Terminal] Failed to create project directory:", error);
    throw error;
  }
}

/**
 * Execute a command in the project directory and stream output
 */
export function executeCommand(
  projectDir: string,
  command: string,
  onLine: (type: "stdout" | "stderr", line: string) => void,
  onComplete: (exitCode: number | null) => void
): string {
  const sessionId = nanoid(8);
  const [cmd, ...args] = command.split(" ");

  console.log(`[Terminal] Starting ${cmd} in ${projectDir}`);

  const process = spawn(cmd, args, {
    cwd: projectDir,
    shell: true,
    stdio: ["pipe", "pipe", "pipe"],
  });

  const lines: string[] = [];

  process.stdout?.on("data", (data) => {
    const text = data.toString();
    lines.push(text);
    onLine("stdout", text);
  });

  process.stderr?.on("data", (data) => {
    const text = data.toString();
    lines.push(text);
    onLine("stderr", text);
  });

  process.on("close", (code) => {
    console.log(`[Terminal] Process exited with code ${code}`);
    activeSessions.delete(sessionId);
    onComplete(code);
  });

  process.on("error", (error) => {
    console.error(`[Terminal] Process error:`, error);
    onLine("stderr", `Error: ${error.message}`);
    onComplete(1);
  });

  // Store session for potential cancellation
  activeSessions.set(sessionId, { process, lines });

  return sessionId;
}

/**
 * Cancel an active process
 */
export function cancelProcess(sessionId: string): boolean {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.process.kill("SIGTERM");
    activeSessions.delete(sessionId);
    return true;
  }
  return false;
}

/**
 * Clean up project directory
 */
export function cleanupProjectDirectory(projectDir: string): void {
  try {
    rmSync(projectDir, { recursive: true, force: true });
    console.log(`[Terminal] Cleaned up ${projectDir}`);
  } catch (error) {
    console.error(`[Terminal] Failed to cleanup ${projectDir}:`, error);
  }
}

/**
 * Get session info
 */
export function getSessionInfo(sessionId: string) {
  return activeSessions.get(sessionId);
}
