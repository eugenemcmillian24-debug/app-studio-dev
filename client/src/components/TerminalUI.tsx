import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TerminalUIProps {
  appName: string;
  supabaseUrl?: string;
  vercelUrl?: string;
}

export function TerminalUI({ appName, supabaseUrl, vercelUrl }: TerminalUIProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal
    const term = new Terminal({
      theme: {
        background: "#0f0f1e",
        foreground: "#e0e0ff",
        cursor: "#00ffff",
      },
      fontFamily: "Fira Code, monospace",
      fontSize: 13,
      lineHeight: 1.5,
    });

    fitAddon.current = new FitAddon();
    term.loadAddon(fitAddon.current);
    term.open(terminalRef.current);
    fitAddon.current.fit();

    terminalInstance.current = term;

    // Write setup instructions
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    (async () => {
      term.writeln("\x1b[36m🚀 AppStudio Setup Instructions\x1b[0m\n");

      term.writeln("\x1b[33m1. Extract the downloaded ZIP file\x1b[0m");
      await delay(500);
      term.writeln("   \x1b[90m$ unzip " + appName + ".zip\x1b[0m");
      term.writeln("   \x1b[90m$ cd " + appName + "\x1b[0m\n");

      term.writeln("\x1b[33m2. Install dependencies\x1b[0m");
      await delay(500);
      term.writeln("   \x1b[90m$ npm install\x1b[0m\n");

      term.writeln("\x1b[33m3. Configure environment variables\x1b[0m");
      await delay(500);
      term.writeln("   \x1b[90m$ cp .env.example .env.local\x1b[0m");
      term.writeln("   \x1b[90m$ nano .env.local  # Edit with your Supabase keys\x1b[0m\n");

      term.writeln("\x1b[33m4. Run development server\x1b[0m");
      await delay(500);
      term.writeln("   \x1b[90m$ npm run dev\x1b[0m");
      term.writeln("   \x1b[36m→ Open http://localhost:3000\x1b[0m\n");

      if (supabaseUrl) {
        term.writeln("\x1b[33m5. Set up Supabase database\x1b[0m");
        await delay(500);
        term.writeln("   \x1b[90m→ Go to: " + supabaseUrl + "\x1b[0m");
        term.writeln("   \x1b[90m→ Run the SQL migration in schema.sql\x1b[0m\n");
      }

      if (vercelUrl) {
        term.writeln("\x1b[33m6. Deploy to Vercel\x1b[0m");
        await delay(500);
        term.writeln("   \x1b[90m$ vercel\x1b[0m");
        term.writeln("   \x1b[90m→ Add environment variables in Vercel dashboard\x1b[0m\n");
      }

      term.writeln("\x1b[32m✓ Setup complete!\x1b[0m");
    })();

    // Handle window resize
    const handleResize = () => {
      fitAddon.current?.fit();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
  }, [appName, supabaseUrl, vercelUrl]);

  const commands = [
    { label: "npm install", cmd: "npm install" },
    { label: "npm run dev", cmd: "npm run dev" },
    { label: "npm run build", cmd: "npm run build" },
  ];

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Terminal */}
      <div
        ref={terminalRef}
        className="rounded-lg border border-border/50 bg-[#0f0f1e] overflow-hidden shadow-lg"
        style={{ height: "400px" }}
      />

      {/* Quick Commands */}
      <div className="grid grid-cols-3 gap-2">
        {commands.map(({ label, cmd }) => (
          <button
            key={cmd}
            onClick={() => handleCopy(cmd)}
            className="p-3 rounded-lg border border-border/50 bg-card hover:bg-muted transition-colors flex items-center justify-between group"
          >
            <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors truncate">
              {label}
            </span>
            {copiedCommand === cmd ? (
              <Check className="size-4 text-green-500 flex-shrink-0" />
            ) : (
              <Copy className="size-4 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> Copy commands above and paste them into your terminal. Make sure to configure .env.local with your Supabase credentials before running npm run dev.
        </p>
      </div>
    </div>
  );
}
