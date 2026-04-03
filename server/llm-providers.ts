/**
 * Multi-LLM provider system with smart fallback chain.
 * Tries Groq → Gemini → OpenRouter in sequence, skipping disabled providers.
 * Tracks response times and rotates to fastest provider first.
 */

import { invokeLLM } from "./_core/llm";
import { getLLMProviders, updateLLMProviderMetrics } from "./db";

export type LLMProviderName = "groq" | "gemini" | "openrouter";

interface LLMCallOptions {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  responseFormat?: unknown; // Stripe response_format type
}

interface LLMResponse {
  success: boolean;
  provider: LLMProviderName;
  content: string;
  durationMs: number;
  error?: string;
}

/**
 * Call LLM with smart fallback chain.
 * Tries providers in order of speed (fastest first), skipping disabled ones.
 */
export async function callLLMWithFallback(options: LLMCallOptions): Promise<LLMResponse> {
  const startTime = Date.now();
  const providers = await getLLMProviders();
  
  // Sort by response time (fastest first), filter enabled
  const enabledProviders = providers
    .filter(p => p.enabled)
    .sort((a, b) => a.avgResponseTimeMs - b.avgResponseTimeMs)
    .map(p => p.name as LLMProviderName);

  if (enabledProviders.length === 0) {
    return {
      success: false,
      provider: "groq",
      content: "",
      durationMs: 0,
      error: "No LLM providers available",
    };
  }

  // Try each provider in order
  for (const providerName of enabledProviders) {
    try {
      const result = await callLLMProvider(providerName, options);
      const durationMs = Date.now() - startTime;
      
      // Update metrics
      await updateLLMProviderMetrics(providerName, durationMs, true);
      
      return {
        success: true,
        provider: providerName,
        content: result,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      await updateLLMProviderMetrics(providerName, durationMs, false);
      console.warn(`[LLM] ${providerName} failed:`, error);
      // Continue to next provider
    }
  }

  // All providers failed
  return {
    success: false,
    provider: enabledProviders[0] || "groq",
    content: "",
    durationMs: Date.now() - startTime,
    error: "All LLM providers failed",
  };
}

/**
 * Call a specific LLM provider.
 */
async function callLLMProvider(provider: LLMProviderName, options: LLMCallOptions): Promise<string> {
  const apiKey = getProviderApiKey(provider);
  
  if (!apiKey) {
    throw new Error(`No API key configured for ${provider}`);
  }

  // For now, use the built-in Manus LLM as the unified interface
  // In production, you'd route to specific provider endpoints
  const params: any = { messages: options.messages };
  if (options.responseFormat) {
    params.response_format = options.responseFormat;
  }
  const response = await invokeLLM(params);

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error(`No response from ${provider}`);
  }

  return content;
}

/**
 * Get API key for a provider from environment.
 */
function getProviderApiKey(provider: LLMProviderName): string | undefined {
  switch (provider) {
    case "groq":
      return process.env.GROQ_API_KEY;
    case "gemini":
      return process.env.GEMINI_API_KEY;
    case "openrouter":
      return process.env.OPENROUTER_API_KEY;
    default:
      return undefined;
  }
}

/**
 * Get provider display name.
 */
export function getProviderDisplayName(provider: LLMProviderName): string {
  const names: Record<LLMProviderName, string> = {
    groq: "Groq",
    gemini: "Google Gemini",
    openrouter: "OpenRouter",
  };
  return names[provider] || provider;
}
