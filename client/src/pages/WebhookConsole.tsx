import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, RotateCcw, Copy, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface WebhookEvent {
  id: string;
  timestamp: Date;
  url: string;
  eventType: string;
  status: "pending" | "success" | "failed" | "retrying";
  statusCode?: number;
  responseTime: number;
  payload: Record<string, any>;
  retries: number;
}

export default function WebhookConsole() {
  const [webhookUrl, setWebhookUrl] = useState("https://example.com/webhook");
  const [eventType, setEventType] = useState("project.created");
  const [payload, setPayload] = useState(JSON.stringify({ projectId: "123", name: "My App" }, null, 2));
  const [events, setEvents] = useState<WebhookEvent[]>([
    {
      id: "evt_1",
      timestamp: new Date(Date.now() - 5 * 60000),
      url: "https://example.com/webhook",
      eventType: "project.created",
      status: "success",
      statusCode: 200,
      responseTime: 245,
      payload: { projectId: "123", name: "My App" },
      retries: 0,
    },
    {
      id: "evt_2",
      timestamp: new Date(Date.now() - 10 * 60000),
      url: "https://example.com/webhook",
      eventType: "generation.completed",
      status: "failed",
      statusCode: 500,
      responseTime: 5000,
      payload: { generationId: "456", status: "completed" },
      retries: 2,
    },
  ]);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(events[0]);
  const [copied, setCopied] = useState(false);

  const handleSendTest = () => {
    const newEvent: WebhookEvent = {
      id: `evt_${Date.now()}`,
      timestamp: new Date(),
      url: webhookUrl,
      eventType,
      status: "pending",
      responseTime: 0,
      payload: JSON.parse(payload),
      retries: 0,
    };

    setEvents([newEvent, ...events]);
    setSelectedEvent(newEvent);

    // Simulate delivery
    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === newEvent.id
            ? {
                ...e,
                status: Math.random() > 0.3 ? "success" : "failed",
                statusCode: Math.random() > 0.3 ? 200 : 500,
                responseTime: Math.random() * 2000 + 100,
              }
            : e
        )
      );
    }, 1000);
  };

  const handleRetry = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, status: "retrying", retries: e.retries + 1 }
          : e
      )
    );

    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                status: Math.random() > 0.3 ? "success" : "failed",
                statusCode: Math.random() > 0.3 ? 200 : 500,
                responseTime: Math.random() * 2000 + 100,
              }
            : e
        )
      );
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Webhook Console</h1>
          <p className="text-gray-400">Test and monitor webhook deliveries in real-time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-slate-700 sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Test Webhook</CardTitle>
                <CardDescription>Send a test event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Webhook URL</label>
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://example.com/webhook"
                    className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md text-sm"
                  >
                    <option>project.created</option>
                    <option>project.updated</option>
                    <option>generation.started</option>
                    <option>generation.completed</option>
                    <option>payment.succeeded</option>
                    <option>user.subscribed</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">Payload</label>
                  <Textarea
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    className="mt-1 bg-slate-700/50 border-slate-600 text-white font-mono text-xs h-32"
                  />
                </div>

                <Button onClick={handleSendTest} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" />
                  Send Test
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Events List & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Events List */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Events</CardTitle>
                <CardDescription>Last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`p-3 rounded-lg cursor-pointer transition ${
                        selectedEvent?.id === event.id
                          ? "bg-blue-500/20 border border-blue-500/50"
                          : "bg-slate-700/30 hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-gray-400">{event.id}</span>
                            <Badge
                              variant="outline"
                              className={
                                event.status === "success"
                                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                                  : event.status === "failed"
                                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                              }
                            >
                              {event.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{event.eventType}</p>
                          <p className="text-xs text-gray-500 mt-1">{event.timestamp.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-gray-300">{event.statusCode || "-"}</p>
                          <p className="text-xs text-gray-400">{event.responseTime}ms</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Event Details */}
            {selectedEvent && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Event Details</CardTitle>
                      <CardDescription>{selectedEvent.id}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {selectedEvent.status === "failed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetry(selectedEvent.id)}
                          className="text-xs"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(JSON.stringify(selectedEvent.payload, null, 2))}
                        className="text-xs"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">URL</p>
                      <p className="text-sm font-mono text-gray-300 break-all">{selectedEvent.url}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Event Type</p>
                      <p className="text-sm font-mono text-gray-300">{selectedEvent.eventType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedEvent.status === "success" && <CheckCircle className="h-4 w-4 text-green-400" />}
                        {selectedEvent.status === "failed" && <AlertCircle className="h-4 w-4 text-red-400" />}
                        {(selectedEvent.status === "pending" || selectedEvent.status === "retrying") && (
                          <Clock className="h-4 w-4 text-yellow-400 animate-spin" />
                        )}
                        <span className="text-sm text-gray-300 capitalize">{selectedEvent.status}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Response Time</p>
                      <p className="text-sm font-mono text-gray-300">{selectedEvent.responseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status Code</p>
                      <p className="text-sm font-mono text-gray-300">{selectedEvent.statusCode || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Retries</p>
                      <p className="text-sm font-mono text-gray-300">{selectedEvent.retries}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Payload</p>
                    <pre className="bg-slate-900/50 p-3 rounded text-xs text-gray-300 overflow-x-auto">
                      {JSON.stringify(selectedEvent.payload, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
