import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface StreamingStudioProps {
  prompt: string;
  onComplete?: (data: any) => void;
}

export function StreamingStudio({ prompt, onComplete }: StreamingStudioProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const generateMutation = trpc.scaffold.generate.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setIsStreaming(false);
      setSteps(prev => [...prev, "Generation complete!"]);
      if (onComplete) onComplete(data);
      toast.success("Scaffold generated successfully!");
    },
    onError: (error) => {
      setError(error.message || "Generation failed");
      setIsStreaming(false);
      toast.error(error.message || "Generation failed");
    },
  });

  const startStreaming = async () => {
    setIsStreaming(true);
    setSteps(["Starting generation..."]);
    setError(null);
    setResult(null);

    try {
      await generateMutation.mutateAsync({ prompt });
    } catch (err) {
      console.error("Generation error:", err);
    }
  };

  const stopStreaming = () => {
    setIsStreaming(false);
  };

  return (
    <div className="space-y-4">
      {/* Control Button */}
      <Button
        onClick={isStreaming ? stopStreaming : startStreaming}
        disabled={!prompt || isStreaming}
        className="w-full"
        size="lg"
      >
        {isStreaming ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Generating...
          </>
        ) : (
          "Generate Scaffold"
        )}
      </Button>

      {/* Progress Steps */}
      {steps.length > 0 && (
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold text-sm">Generation Progress</h3>
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                {idx === steps.length - 1 && isStreaming ? (
                  <Loader2 className="size-4 animate-spin text-blue-500" />
                ) : (
                  <CheckCircle2 className="size-4 text-green-500" />
                )}
                <span className="text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </Card>
      )}

      {/* Result Summary */}
      {result && (
        <Card className="p-4 border-green-500/20 bg-green-500/5">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-green-600">✓ Complete</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>App:</strong> {result.appName}</p>
              <p><strong>Files:</strong> {result.fileCount}</p>
              <p><strong>LLM:</strong> {result.aiModel}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
