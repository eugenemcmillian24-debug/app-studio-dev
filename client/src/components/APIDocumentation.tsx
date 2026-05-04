import React, { useState } from "react";
import { Search, Code, Play as PlayIcon, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Endpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  description: string;
  category: string;
  authentication: "public" | "protected" | "admin";
  examples?: Array<{
    name: string;
    request: Record<string, unknown>;
    response: Record<string, unknown>;
  }>;
}

interface APIDocumentationProps {
  endpoints?: Endpoint[];
  onTestEndpoint?: (endpoint: Endpoint) => void;
}

export function APIDocumentation({ endpoints = [], onTestEndpoint }: APIDocumentationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string | Record<string, unknown>>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || endpoint.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(endpoints.map(e => e.category)));

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-100 text-blue-800",
      POST: "bg-green-100 text-green-800",
      PUT: "bg-yellow-100 text-yellow-800",
      DELETE: "bg-red-100 text-red-800",
      PATCH: "bg-purple-100 text-purple-800",
    };
    return colors[method] || "bg-gray-100 text-gray-800";
  };

  const getAuthBadge = (auth: string) => {
    const colors: Record<string, string> = {
      public: "bg-green-100 text-green-800",
      protected: "bg-yellow-100 text-yellow-800",
      admin: "bg-red-100 text-red-800",
    };
    return colors[auth] || "bg-gray-100 text-gray-800";
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-gray-600">
          Explore and test all available API endpoints with interactive examples
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            size="sm"
          >
            All Categories
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {filteredEndpoints.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No endpoints found matching your search</p>
          </Card>
        ) : (
          filteredEndpoints.map((endpoint) => {
            const endpointId = `${endpoint.method}-${endpoint.path}`;
            const isExpanded = expandedEndpoint === endpointId;

            return (
              <Card key={endpointId} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedEndpoint(isExpanded ? null : endpointId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${getMethodColor(endpoint.method)}`}>
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-mono text-gray-700">{endpoint.path}</code>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getAuthBadge(endpoint.authentication)}`}>
                          {endpoint.authentication}
                        </span>
                      </div>
                      <p className="text-gray-600">{endpoint.description}</p>
                    </div>
                    <div className="text-gray-400">
                      {isExpanded ? "▼" : "▶"}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t p-4 space-y-4 bg-gray-50">
                    {/* Examples */}
                    {endpoint.examples && endpoint.examples.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Examples</h4>
                        {endpoint.examples.map((example, idx) => (
                          <div key={idx} className="space-y-2 bg-white p-3 rounded border">
                            <p className="text-sm font-medium">{example.name}</p>
                            
                            {/* Request */}
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-gray-600">Request:</p>
                              <div className="relative">
                                <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(example.request as Record<string, unknown>, null, 2)}
                                </pre>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute top-2 right-2"
                                  onClick={() => handleCopyCode(JSON.stringify(example.request, null, 2), `req-${idx}`)}
                                >
                                  {copiedCode === `req-${idx}` ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Response */}
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-gray-600">Response:</p>
                              <div className="relative">
                                <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(example.response as Record<string, unknown>, null, 2)}
                                </pre>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute top-2 right-2"
                                  onClick={() => handleCopyCode(JSON.stringify(example.response, null, 2), `res-${idx}`)}
                                >
                                  {copiedCode === `res-${idx}` ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Test Button */}
                    <Button
                      onClick={() => onTestEndpoint?.(endpoint)}
                      className="w-full gap-2"
                    >
                      <PlayIcon className="h-4 w-4" />
                      Test Endpoint
                    </Button>

                    {/* Test Results */}
                    {testResults[endpointId] && (
                      <div className="space-y-2 bg-white p-3 rounded border">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-medium">Test Result</p>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(testResults[endpointId] as Record<string, unknown>, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Stats */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Endpoints</p>
            <p className="text-2xl font-bold">{endpoints.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Categories</p>
            <p className="text-2xl font-bold">{categories.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Protected</p>
            <p className="text-2xl font-bold">{endpoints.filter(e => e.authentication !== "public").length}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
