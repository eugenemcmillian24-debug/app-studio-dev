import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, Play, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { ScaffoldProject } from "../../../shared/scaffold-types";

interface EnhancedTerminalProps {
  scaffold: ScaffoldProject;
  onDownloadZip?: () => void;
}

interface TerminalLine {
  type: "command" | "output" | "error" | "success" | "info";
  text: string;
}

export function EnhancedTerminal({ scaffold, onDownloadZip }: EnhancedTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState<"idle" | "files" | "install" | "dev" | "complete">("idle");
  const terminalRef = useRef<HTMLDivElement>(null);

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
    setIsRunning(true);
    setLines([]);
    setStep("files");

    // Step 1: Show generated files
    addLine("command", "$ ls -la");
    await new Promise(r => setTimeout(r, 300));
    addLine("output", `total ${scaffold.files.length * 2}`);
    scaffold.files.slice(0, 8).forEach(file => {
      addLine("output", `-rw-r--r--  1 user  staff  ${Math.random() * 5000 | 0}  ${file.path}`);
    });
    if (scaffold.files.length > 8) {
      addLine("output", `... and ${scaffold.files.length - 8} more files`);
    }

    await new Promise(r => setTimeout(r, 800));
    setStep("install");

    // Step 2: npm install
    addLine("command", "$ npm install");
    addLine("info", "Installing dependencies...");
    const packages = ["next@14", "react@19", "@supabase/supabase-js", "tailwindcss@4", "typescript"];
    for (const pkg of packages) {
      await new Promise(r => setTimeout(r, 400));
      addLine("output", `  ✓ ${pkg}`);
    }
    addLine("success", "✓ All dependencies installed");

    await new Promise(r => setTimeout(r, 600));
    setStep("dev");

    // Step 3: npm run dev
    addLine("command", "$ npm run dev");
    addLine("info", "Starting development server...");
    await new Promise(r => setTimeout(r, 500));
    addLine("output", `> next dev`);
    await new Promise(r => setTimeout(r, 300));
    addLine("output", "  ▲ Next.js 14.0.0");
    await new Promise(r => setTimeout(r, 300));
    addLine("output", "  - Local:        http://localhost:3000");
    await new Promise(r => setTimeout(r, 300));
    addLine("output", "  - Environments: .env.local");
    await new Promise(r => setTimeout(r, 500));
    addLine("success", "✓ Ready on http://localhost:3000");

    setStep("complete");
    setIsRunning(false);
    toast.success("Development server ready!");
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    toast.success("Copied to clipboard");
  };

  const getStepIcon = (s: string) => {
    if (s === step) return <Loader2 className="size-4 animate-spin text-blue-500" />;
    if (["files", "install", "dev", "complete"].includes(s) && 
        ["files", "install", "dev", "complete"].indexOf(s) < ["files", "install", "dev", "complete"].indexOf(step)) {
      return <CheckCircle2 className="size-4 text-green-500" />;
    }
    return <div className="size-4 rounded-full border border-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Steps Progress */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { id: "files", label: "Files" },
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
                output: "text-green-300",
                error: "text-red-400",
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
        <Button
          onClick={startWorkflow}
          disabled={isRunning}
          className="gap-2"
          size="sm"
        >
          {isRunning ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="size-4" />
              Start Setup
            </>
          )}
        </Button>

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

      {/* Quick Setup Instructions */}
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
    </div>
  );
}
