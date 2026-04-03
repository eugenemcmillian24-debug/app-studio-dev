import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface StreamEvent {
  type: "step" | "error" | "complete";
  data: any;
}

interface StreamingStudioProps {
  prompt: string;
  onComplete?: (data: any) => void;
}

export function StreamingStudio({ prompt, onComplete }: StreamingStudioProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStreaming = () => {
    setIsStreaming(true);
    setSteps([]);
    setError(null);
    setResult(null);

    // Create EventSource for SSE
    const eventSource = new EventSource(
      `/api/scaffold/stream?prompt=${encodeURIComponent(prompt)}`
    );
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("step", (e: any) => {
      const data = JSON.parse(e.data);
      setSteps(prev => [...prev, data.message]);
    });

    eventSource.addEventListener("complete", (e: any) => {
      const data = JSON.parse(e.data);
      setResult(data.scaffold);
      setIsStreaming(false);
      eventSource.close();
      if (onComplete) onComplete(data);
      toast.success("Scaffold generated successfully!");
    });

    eventSource.addEventListener("error", (e: any) => {
      const data = JSON.parse(e.data);
      setError(data.message);
      setIsStreaming(false);
      eventSource.close();
      toast.error(data.message);
    });

    eventSource.onerror = () => {
      setError("Connection lost");
      setIsStreaming(false);
      eventSource.close();
    };
  };

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsStreaming(false);
  };

  return (
    <div className="space-y-4">
      {/* Control Button */}
      <Button
        onClick={isStreaming ? stopStreaming : startStreaming}
        disabled={!prompt}
        className="w-full"
        size="lg"
      >
        {isStreaming ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Generating...
          </>
        ) : (
          "Generate with Streaming"
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
