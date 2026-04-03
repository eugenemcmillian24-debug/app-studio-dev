import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, Play, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { ScaffoldProject } from "../../../shared/scaffold-types";

interface RealTerminalProps {
  scaffold: ScaffoldProject;
  projectId: number;
  onDownloadZip?: () => void;
}

interface TerminalLine {
  type: "command" | "stdout" | "stderr" | "success" | "info";
  text: string;
}

export function RealTerminal({ scaffold, projectId, onDownloadZip }: RealTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState<"idle" | "creating" | "install" | "dev" | "complete" | "error">("idle");
  const [projectDir, setProjectDir] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const startSessionMutation = trpc.terminal.startSession.useMutation();
  const runInstallMutation = trpc.terminal.runInstall.useMutation();
  const runDevMutation = trpc.terminal.runDev.useMutation();
  const cleanupMutation = trpc.terminal.cleanup.useMutation();

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = (type: TerminalLine["type"], text: string) => {
    setLines(prev => [...prev, { type, text }]);
  };

  const startWorkflow = async () => {
    try {
      setIsRunning(true);
      setLines([]);
      setStep("creating");

      // Step 1: Create project directory
      addLine("command", "$ Creating project directory...");
      const sessionResult = await startSessionMutation.mutateAsync({ projectId });

      if (!sessionResult.success) {
        throw new Error("Failed to create project directory");
      }

      setProjectDir(sessionResult.projectDir);
      addLine("success", `✓ ${sessionResult.message}`);
      addLine("info", `Project directory: ${sessionResult.projectDir}`);

      await new Promise(r => setTimeout(r, 500));
      setStep("install");

      // Step 2: npm install
      addLine("command", "$ npm install");
      addLine("info", "Installing dependencies...");

      const installResult = await runInstallMutation.mutateAsync({
        projectDir: sessionResult.projectDir,
      });

      if (installResult.success) {
        addLine("success", "✓ Dependencies installed");
      }

      await new Promise(r => setTimeout(r, 500));
      setStep("dev");

      // Step 3: npm run dev
      addLine("command", "$ npm run dev");
      addLine("info", "Starting development server...");

      const devResult = await runDevMutation.mutateAsync({
        projectDir: sessionResult.projectDir,
      });

      if (devResult.success) {
        addLine("success", `✓ Development server ready at ${devResult.devUrl}`);
      }

      setStep("complete");
      setIsRunning(false);
      toast.success("Development server ready!");
    } catch (error) {
      setStep("error");
      setIsRunning(false);
      const message = error instanceof Error ? error.message : "Unknown error";
      addLine("stderr", `Error: ${message}`);
      toast.error(message);
    }
  };

  const stopWorkflow = async () => {
    if (projectDir) {
      try {
        await cleanupMutation.mutateAsync({ projectDir });
        addLine("info", "Session terminated");
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    }
    setIsRunning(false);
    setStep("idle");
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    toast.success("Copied to clipboard");
  };

  const getStepIcon = (s: string) => {
    if (s === step && isRunning) return <Loader2 className="size-4 animate-spin text-blue-500" />;
    if (["creating", "install", "dev", "complete"].includes(s) && 
        ["creating", "install", "dev", "complete"].indexOf(s) < ["creating", "install", "dev", "complete"].indexOf(step)) {
      return <CheckCircle2 className="size-4 text-green-500" />;
    }
    if (step === "error") return <AlertCircle className="size-4 text-red-500" />;
    return <div className="size-4 rounded-full border border-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Steps Progress */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { id: "creating", label: "Create" },
          { id: "install", label: "Install" },
          { id: "dev", label: "Dev Server" },
          { id: "complete", label: "Ready" },
        ].map(s => (
          <div key={s.id} className="flex items-center gap-2 text-xs">
            {getStepIcon(s.id)}
            <span className={step === s.id ? "text-foreground font-semibold" : "text-muted-foreground"}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Terminal Output */}
      <Card className="bg-black border-zinc-800 p-4 font-mono text-sm max-h-96 overflow-y-auto" ref={terminalRef}>
        {lines.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            Click "Start Setup" to begin the installation workflow
          </div>
        ) : (
          <div className="space-y-1">
            {lines.map((line, idx) => {
              const colorMap = {
                command: "text-cyan-400",
                stdout: "text-green-300",
                stderr: "text-red-400",
                success: "text-emerald-400",
                info: "text-blue-300",
              };
              return (
                <div key={idx} className={colorMap[line.type]}>
                  {line.text}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {!isRunning ? (
          <Button
            onClick={startWorkflow}
            className="gap-2"
            size="sm"
            disabled={startSessionMutation.isPending}
          >
            {startSessionMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="size-4" />
                Start Setup
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={stopWorkflow}
            variant="destructive"
            size="sm"
            className="gap-2"
          >
            <X className="size-4" />
            Stop
          </Button>
        )}

        <Button
          onClick={() => copyCommand("npm install")}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Copy className="size-4" />
          Copy Install
        </Button>

        <Button
          onClick={() => copyCommand("npm run dev")}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Copy className="size-4" />
          Copy Dev
        </Button>

        {onDownloadZip && (
          <Button
            onClick={onDownloadZip}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="size-4" />
            Download ZIP
          </Button>
        )}
      </div>

      {/* Setup Complete Message */}
      {step === "complete" && (
        <Card className="bg-emerald-500/10 border-emerald-500/20 p-3 text-sm">
          <div className="flex gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-600">Setup Complete!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your app is ready at http://localhost:3000. Add your Supabase credentials to .env.local to get started.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {step === "error" && (
        <Card className="bg-red-500/10 border-red-500/20 p-3 text-sm">
          <div className="flex gap-2">
            <AlertCircle className="size-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-600">Setup Failed</p>
              <p className="text-xs text-muted-foreground mt-1">
                Check the terminal output above for details. You can try again or download the ZIP to set up manually.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
