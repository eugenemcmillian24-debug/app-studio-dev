import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Sparkles, Download, Globe, ArrowLeft, FileCode2,
  Database, FileText, Settings, Loader2, ChevronRight,
  Copy, Check, Zap, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CodeViewer } from "@/components/CodeViewer";
import { FileTree } from "@/components/FileTree";
import { TerminalUI } from "@/components/TerminalUI";
import { StreamingStudio } from "@/components/StreamingStudio";
import { RealTerminal } from "@/components/RealTerminal";
import type { ScaffoldFile, ScaffoldProject } from "../../../shared/scaffold-types";

const EXAMPLE_CHIPS = [
  { emoji: "🛒", label: "E-commerce store", prompt: "An e-commerce store for handmade crafts with product listings, cart, and Stripe checkout" },
  { emoji: "📊", label: "SaaS dashboard", prompt: "A SaaS analytics dashboard with user authentication, charts, and subscription management" },
  { emoji: "💬", label: "Chat app", prompt: "A real-time chat application with channels, direct messages, and user presence" },
  { emoji: "📝", label: "Blog platform", prompt: "A blog platform with markdown editor, categories, comments, and SEO optimization" },
  { emoji: "💰", label: "Finance tracker", prompt: "A personal finance tracker with expense categories, budgets, and monthly reports" },
  { emoji: "🎮", label: "Game leaderboard", prompt: "A game leaderboard platform with user profiles, score tracking, and weekly rankings" },
  { emoji: "📚", label: "Learning platform", prompt: "An online learning platform with courses, progress tracking, and quizzes" },
  { emoji: "🏠", label: "Property listings", prompt: "A real estate listing platform with search filters, map view, and contact forms" },
];

const EXTRA_FILES = [
  { path: "__sql__", label: "schema.sql", icon: <Database className="size-3.5 text-cyan-400 flex-shrink-0" /> },
  { path: "__env__", label: ".env.example", icon: <Settings className="size-3.5 text-emerald-400 flex-shrink-0" /> },
  { path: "__readme__", label: "README.md", icon: <FileText className="size-3.5 text-blue-400 flex-shrink-0" /> },
  { path: "__pkg__", label: "package.json", icon: <Package className="size-3.5 text-orange-400 flex-shrink-0" /> },
];

type ViewState = "prompt" | "generating" | "result";

interface GeneratedState {
  projectId: number;
  scaffold: ScaffoldProject;
}

export default function Studio() {
  const [, navigate] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [view, setView] = useState<ViewState>("prompt");
  const [generated, setGenerated] = useState<GeneratedState | null>(null);
  const [selectedFile, setSelectedFile] = useState<ScaffoldFile | null>(null);
  const [selectedExtra, setSelectedExtra] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<"files" | "terminal">("files");
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatingDots, setGeneratingDots] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generateMutation = trpc.scaffold.generate.useMutation({
    onSuccess: (data) => {
      if (data.success && data.projectId && data.scaffold) {
        setGenerated({ projectId: data.projectId, scaffold: data.scaffold });
        // Auto-select first file
        if (data.scaffold.files.length > 0) {
          setSelectedFile(data.scaffold.files[0]!);
          setSelectedExtra(null);
        }
        setView("result");
      } else {
        toast.error("Generation failed. Please try again.");
        setView("prompt");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong");
      setView("prompt");
    },
  });

  const downloadMutation = trpc.scaffold.downloadZip.useMutation({
    onSuccess: (data) => {
      const bytes = Uint8Array.from(atob(data.base64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Project downloaded!");
      setIsDownloading(false);
    },
    onError: () => {
      toast.error("Download failed");
      setIsDownloading(false);
    },
  });

  // Animated dots during generation
  useEffect(() => {
    if (view !== "generating") return;
    const interval = setInterval(() => setGeneratingDots(d => (d + 1) % 4), 500);
    return () => clearInterval(interval);
  }, [view]);

  const handleGenerate = () => {
    if (prompt.trim().length < 10) {
      toast.error("Please describe your app in at least 10 characters");
      return;
    }
    setView("generating");
    generateMutation.mutate({ prompt: prompt.trim() });
  };

  const handleDownload = () => {
    if (!generated) return;
    setIsDownloading(true);
    downloadMutation.mutate({ id: generated.projectId });
  };

  const handleDeployVercel = () => {
    if (!generated) return;
    // Vercel deploy URL with GitHub template approach
    const repoUrl = encodeURIComponent("https://github.com/vercel/next.js/tree/canary/examples/with-supabase");
    const projectName = encodeURIComponent(generated.scaffold.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    const vercelUrl = `https://vercel.com/new/clone?repository-url=${repoUrl}&project-name=${projectName}&repository-name=${projectName}&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Supabase%20project%20credentials&envLink=https://supabase.com/dashboard`;
    window.open(vercelUrl, "_blank");
    toast.info("Opening Vercel — paste your Supabase credentials when prompted");
  };

  const getCodeContent = (): { code: string; language: string; filename: string } => {
    if (selectedExtra === "__sql__" && generated) {
      return { code: generated.scaffold.sqlSchema, language: "sql", filename: "schema.sql" };
    }
    if (selectedExtra === "__env__" && generated) {
      return { code: generated.scaffold.envExample, language: "bash", filename: ".env.example" };
    }
    if (selectedExtra === "__readme__" && generated) {
      return { code: generated.scaffold.readmeContent, language: "markdown", filename: "README.md" };
    }
    if (selectedExtra === "__pkg__" && generated) {
      return { code: generated.scaffold.packageJson, language: "json", filename: "package.json" };
    }
    if (selectedFile) {
      return { code: selectedFile.content, language: selectedFile.language, filename: selectedFile.path };
    }
    return { code: "// Select a file to view its contents", language: "typescript", filename: "" };
  };

  // ── Prompt view ──────────────────────────────────────────────────────────────
  if (view === "prompt") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">AppStudio</span>
          </div>
          <div className="w-16" />
        </nav>

        {/* Main */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-4">
                <Zap className="size-3" />
                Full-stack scaffold generator
              </div>
              <h1 className="text-3xl md:text-4xl font-black mb-3">
                What are you{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  building?
                </span>
              </h1>
              <p className="text-muted-foreground">
                Describe your app and get a complete Next.js + Supabase project in seconds.
              </p>
            </div>

            {/* Prompt input */}
            <div className="relative rounded-2xl border border-border/50 bg-card focus-within:border-violet-500/50 transition-all shadow-2xl shadow-black/40 mb-4">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                placeholder="e.g. A task management SaaS with team workspaces, kanban boards, and real-time collaboration..."
                rows={5}
                className="w-full bg-transparent text-foreground placeholder-muted-foreground/50 text-sm p-4 pb-14 resize-none outline-none leading-relaxed"
              />
              <div className="absolute bottom-3 left-4 right-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground/50">⌘↵ to generate</span>
                <Button
                  onClick={handleGenerate}
                  disabled={prompt.trim().length < 10}
                  className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold disabled:opacity-40"
                >
                  <Sparkles className="size-4 mr-2" />
                  Generate Project
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Example chips */}
            <div>
              <p className="text-xs text-muted-foreground/50 uppercase tracking-widest text-center mb-3">
                Try an example
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EXAMPLE_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(chip.prompt)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-card/50 text-xs text-muted-foreground hover:border-violet-500/40 hover:text-foreground hover:bg-card transition-all text-left"
                  >
                    <span>{chip.emoji}</span>
                    <span className="truncate">{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Generating view ──────────────────────────────────────────────────────────
  if (view === "generating") {
    const dots = ".".repeat(generatingDots);
    const steps = [
      { label: "Analyzing your app idea", done: true },
      { label: "Designing project architecture", done: generatingDots > 1 },
      { label: "Generating source files", done: false },
      { label: "Creating SQL schema & migrations", done: false },
      { label: "Writing README & env config", done: false },
    ];

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          {/* Animated orb */}
          <div className="relative size-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 animate-pulse opacity-30 blur-xl" />
            <div className="relative size-24 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center animate-spin" style={{ animationDuration: "3s" }}>
              <Sparkles className="size-10 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">
            Building your project{dots}
          </h2>
          <p className="text-muted-foreground text-sm mb-8 line-clamp-2 italic">
            "{prompt.slice(0, 80)}{prompt.length > 80 ? "..." : ""}"
          </p>

          {/* Steps */}
          <div className="space-y-3 text-left">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`size-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-border/50 border border-border"
                }`}>
                  {step.done
                    ? <Check className="size-3 text-emerald-400" />
                    : <Loader2 className="size-3 text-muted-foreground animate-spin" />}
                </div>
                <span className={`text-sm ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/50 mt-8">
            This usually takes 15–30 seconds
          </p>
        </div>
      </div>
    );
  }

  // ── Result view ──────────────────────────────────────────────────────────────
  if (view === "result" && generated) {
    const { scaffold } = generated;
    const { code, language, filename } = getCodeContent();
    const fileCount = scaffold.files.length + 4; // +4 for sql, env, readme, pkg

    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 flex-shrink-0 bg-card/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView("prompt"); setGenerated(null); }}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="size-4" />
              New
            </button>
            <div className="w-px h-4 bg-border" />
            <div>
              <h1 className="font-bold text-sm text-foreground">{scaffold.appName}</h1>
              <p className="text-xs text-muted-foreground">{fileCount} files generated</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Tech stack badges */}
            <div className="hidden md:flex items-center gap-1.5 mr-2">
              {scaffold.techStack.slice(0, 3).map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground font-mono">
                  {t}
                </span>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="border-border/50 hover:border-emerald-500/50 hover:text-emerald-400 gap-2"
            >
              {isDownloading
                ? <Loader2 className="size-3.5 animate-spin" />
                : <Download className="size-3.5" />}
              Download ZIP
            </Button>

            <Button
              size="sm"
              onClick={handleDeployVercel}
              className="bg-black hover:bg-zinc-900 text-white border border-white/10 gap-2 font-semibold"
            >
              <Globe className="size-3.5" />
              Deploy to Vercel
            </Button>
          </div>
        </div>

        {/* Main layout: sidebar + code viewer */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar with tabs */}
          <div className="w-56 flex-shrink-0 border-r border-border/50 bg-sidebar overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-border/50 sticky top-0 bg-sidebar/95 backdrop-blur">
              <button
                onClick={() => setResultTab("files")}
                className={`flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  resultTab === "files"
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Files
              </button>
              <button
                onClick={() => setResultTab("terminal")}
                className={`flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  resultTab === "terminal"
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Terminal
              </button>
            </div>

            {/* Files tab */}
            {resultTab === "files" && (
              <FileTree
                files={scaffold.files}
                selectedPath={selectedFile?.path ?? null}
                onSelect={(f) => { setSelectedFile(f); setSelectedExtra(null); }}
                extraFiles={EXTRA_FILES}
                onSelectExtra={(p) => { setSelectedExtra(p); setSelectedFile(null); }}
                selectedExtra={selectedExtra}
              />
            )}

            {/* Terminal tab */}
            {resultTab === "terminal" && (
              <div className="flex-1 overflow-hidden p-3">
                <RealTerminal scaffold={scaffold} projectId={generated.projectId} onDownloadZip={handleDownload} />
              </div>
            )}
          </div>

          {/* Code viewer */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <CodeViewer
              code={code}
              language={language}
              filename={filename}
            />
          </div>

          {/* Right panel: project info */}
          <div className="w-64 flex-shrink-0 border-l border-border/50 bg-sidebar overflow-y-auto p-4 space-y-5 hidden lg:block">
            {/* App info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="size-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm">
                  ✨
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{scaffold.appName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{scaffold.appCategory}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{scaffold.appDescription}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Files", value: scaffold.files.length },
                { label: "Category", value: scaffold.appCategory },
                { label: "LLM Provider", value: scaffold.aiModel ?? "Fallback" },
                { label: "Stack", value: `${scaffold.techStack.length} deps` },
              ].map(s => (
                <div key={s.label} className="p-2.5 rounded-xl bg-card border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5 truncate capitalize">
                    {s.label === "LLM Provider" ? (
                      <span className="flex items-center gap-1">
                        <Zap className="size-3" />
                        {s.value}
                      </span>
                    ) : (
                      s.value
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Tech stack */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {scaffold.techStack.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 bg-card text-muted-foreground font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-2">Quick Actions</p>
              <button
                onClick={() => { setSelectedExtra("__sql__"); setSelectedFile(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-card hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left"
              >
                <Database className="size-3.5 text-cyan-400" />
                <span className="text-xs text-muted-foreground">View SQL Schema</span>
              </button>
              <button
                onClick={() => { setSelectedExtra("__env__"); setSelectedFile(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-card hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left"
              >
                <Settings className="size-3.5 text-emerald-400" />
                <span className="text-xs text-muted-foreground">View .env.example</span>
              </button>
              <button
                onClick={() => { setSelectedExtra("__readme__"); setSelectedFile(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-card hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left"
              >
                <FileText className="size-3.5 text-blue-400" />
                <span className="text-xs text-muted-foreground">View README</span>
              </button>
            </div>

            {/* Deploy CTA */}
            <div className="p-3 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-cyan-500/5">
              <p className="text-xs font-semibold text-foreground mb-1">Ready to ship?</p>
              <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                Download the ZIP and run locally, or deploy directly to Vercel for free.
              </p>
              <Button
                size="sm"
                onClick={handleDeployVercel}
                className="w-full bg-black hover:bg-zinc-900 text-white border border-white/10 text-xs gap-1.5"
              >
                <Globe className="size-3" />
                Deploy to Vercel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
