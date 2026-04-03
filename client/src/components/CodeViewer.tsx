import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CodeViewerProps {
  code: string;
  language?: string;
  filename?: string;
}

const LANG_MAP: Record<string, string> = {
  typescript: "typescript",
  tsx: "typescript",
  ts: "typescript",
  javascript: "javascript",
  jsx: "javascript",
  js: "javascript",
  css: "css",
  sql: "sql",
  json: "json",
  markdown: "markdown",
  md: "markdown",
  env: "bash",
  sh: "bash",
  bash: "bash",
  yaml: "yaml",
  yml: "yaml",
};

function detectLanguage(filename?: string, language?: string): string {
  if (language && LANG_MAP[language]) return LANG_MAP[language];
  if (!filename) return "typescript";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return LANG_MAP[ext] ?? "typescript";
}

export function CodeViewer({ code, language, filename }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const lang = detectLanguage(filename, language);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative h-full flex flex-col overflow-hidden rounded-lg border border-border/50 bg-[#0d1117]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-[#161b22] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-500/60" />
            <div className="size-3 rounded-full bg-yellow-500/60" />
            <div className="size-3 rounded-full bg-green-500/60" />
          </div>
          {filename && (
            <span className="text-xs text-muted-foreground font-mono">{filename}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={lang}
          style={atomOneDark}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "0.8rem",
            lineHeight: "1.6",
            minHeight: "100%",
          }}
          showLineNumbers
          lineNumberStyle={{
            color: "rgba(255,255,255,0.15)",
            paddingRight: "1.5rem",
            userSelect: "none",
            minWidth: "2.5rem",
          }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
