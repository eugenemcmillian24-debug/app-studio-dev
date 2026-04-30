import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

interface ExportDialogProps {
  projectId: number;
}

export function ExportDialog({ projectId }: ExportDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const exportIndividualMutation = trpc.exports.exportIndividual.useMutation();
  const exportMonorepoMutation = trpc.exports.exportMonorepo.useMutation();
  const exportTurborepoMutation = trpc.exports.exportTurborepo.useMutation();

  const handleCopyUrl = (url: string, format: string) => {
    navigator.clipboard.writeText(url);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Individual Project */}
          <div className="p-4 border border-border rounded-lg space-y-3">
            <div>
              <h4 className="font-semibold text-sm">Individual Project</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Export as a standalone project with all files and dependencies.
              </p>
            </div>
            <Button
              onClick={() => exportIndividualMutation.mutate({ projectId })}
              disabled={exportIndividualMutation.isPending}
              className="w-full"
            >
              {exportIndividualMutation.isPending ? "Generating..." : "Export as Individual"}
            </Button>
            {exportIndividualMutation.data && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={exportIndividualMutation.data.downloadUrl}
                  readOnly
                  className="flex-1 px-2 py-1 text-xs border border-border rounded bg-muted"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleCopyUrl(exportIndividualMutation.data.downloadUrl, "individual")
                  }
                >
                  {copied === "individual" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Monorepo */}
          <div className="p-4 border border-border rounded-lg space-y-3">
            <div>
              <h4 className="font-semibold text-sm">Monorepo</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Export as a monorepo with separate packages for app, api, db, and shared.
              </p>
            </div>
            <Button
              onClick={() => exportMonorepoMutation.mutate({ projectId })}
              disabled={exportMonorepoMutation.isPending}
              className="w-full"
            >
              {exportMonorepoMutation.isPending ? "Generating..." : "Export as Monorepo"}
            </Button>
            {exportMonorepoMutation.data && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={exportMonorepoMutation.data.downloadUrl}
                  readOnly
                  className="flex-1 px-2 py-1 text-xs border border-border rounded bg-muted"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyUrl(exportMonorepoMutation.data.downloadUrl, "monorepo")}
                >
                  {copied === "monorepo" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Turborepo */}
          <div className="p-4 border border-border rounded-lg space-y-3">
            <div>
              <h4 className="font-semibold text-sm">Turborepo</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Export as a Turborepo with optimized monorepo structure and task pipeline.
              </p>
            </div>
            <Button
              onClick={() => exportTurborepoMutation.mutate({ projectId })}
              disabled={exportTurborepoMutation.isPending}
              className="w-full"
            >
              {exportTurborepoMutation.isPending ? "Generating..." : "Export as Turborepo"}
            </Button>
            {exportTurborepoMutation.data && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={exportTurborepoMutation.data.downloadUrl}
                  readOnly
                  className="flex-1 px-2 py-1 text-xs border border-border rounded bg-muted"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleCopyUrl(exportTurborepoMutation.data.downloadUrl, "turborepo")
                  }
                >
                  {copied === "turborepo" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
