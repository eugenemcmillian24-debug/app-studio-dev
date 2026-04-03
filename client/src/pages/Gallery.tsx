import { useLocation } from "wouter";
import { useState } from "react";
import { ArrowLeft, Sparkles, Globe, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  saas:       { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  dashboard:  { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/20" },
  ecommerce:  { bg: "bg-emerald-500/10",text: "text-emerald-400",border: "border-emerald-500/20" },
  social:     { bg: "bg-pink-500/10",   text: "text-pink-400",   border: "border-pink-500/20" },
  blog:       { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  portfolio:  { bg: "bg-cyan-500/10",   text: "text-cyan-400",   border: "border-cyan-500/20" },
  tool:       { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  game:       { bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20" },
};

const CATEGORY_EMOJI: Record<string, string> = {
  saas: "🚀", dashboard: "📊", ecommerce: "🛒", social: "💬",
  blog: "📝", portfolio: "🎨", tool: "⚡", game: "🎮",
};

function triggerDownload(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ProjectCard({ project }: { project: { id: number; appName: string; appDescription: string; appCategory: string; techStack: string[]; aiModel: string | null; createdAt: Date } }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const colors = CATEGORY_COLORS[project.appCategory] ?? CATEGORY_COLORS["tool"]!;
  const emoji = CATEGORY_EMOJI[project.appCategory] ?? "🚀";

  const downloadMutation = trpc.scaffold.downloadZip.useMutation({
    onSuccess: (data) => {
      triggerDownload(data.base64, data.filename);
      toast.success("Project downloaded!");
      setIsDownloading(false);
    },
    onError: () => {
      toast.error("Download failed");
      setIsDownloading(false);
    },
  });

  const handleDownload = () => {
    setIsDownloading(true);
    downloadMutation.mutate({ id: project.id });
  };

  const handleDeploy = () => {
    const name = project.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const vercelUrl = `https://vercel.com/new/clone?repository-url=${encodeURIComponent("https://github.com/vercel/next.js/tree/canary/examples/with-supabase")}&project-name=${name}&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY`;
    window.open(vercelUrl, "_blank");
  };

  return (
    <div className="group p-5 rounded-2xl border border-border/50 bg-card/50 hover:border-border hover:bg-card transition-all flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-cyan-500/20 border border-border/50 flex items-center justify-center text-xl flex-shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-sm truncate">{project.appName}</h3>
          <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} font-medium capitalize mt-0.5`}>
            {project.appCategory}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{project.appDescription}</p>
      <div className="flex flex-wrap gap-1">
        {project.techStack.slice(0, 4).map(t => (
          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 bg-background text-muted-foreground font-mono">{t}</span>
        ))}
        {project.techStack.length > 4 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 bg-background text-muted-foreground">+{project.techStack.length - 4}</span>
        )}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
        <span className="text-[10px] text-muted-foreground/50">{new Date(project.createdAt).toLocaleDateString()}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20 disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
            ZIP
          </button>
          <button
            onClick={handleDeploy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all border border-transparent hover:border-border"
          >
            <Globe className="size-3" />
            Deploy
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Gallery() {
  const [, navigate] = useLocation();
  const { data: projects, isLoading } = trpc.scaffold.listRecent.useQuery({ limit: 24 });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-xl z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">AppStudio</span>
        </div>
        <Button size="sm" onClick={() => navigate("/studio")}
          className="bg-violet-600 hover:bg-violet-500 text-white">
          Build New
        </Button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Community Scaffolds</h1>
          <p className="text-muted-foreground">
            Browse recently generated full-stack projects. Download any scaffold and start building.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-8 text-violet-400 animate-spin" />
              <p className="text-muted-foreground text-sm">Loading projects...</p>
            </div>
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <Sparkles className="size-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Be the first to generate a full-stack scaffold!
            </p>
            <Button onClick={() => navigate("/studio")}
              className="bg-violet-600 hover:bg-violet-500 text-white">
              Generate First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

