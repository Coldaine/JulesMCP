/**
 * LLM Router Client Contract
 *
 * This file defines the contract between JulesMCP (this project) and the
 * centralized LLM Router service. This project is a CLIENT of the router.
 *
 * The router is NOT implemented here - this is just the interface contract
 * that defines what this project expects from the router service.
 *
 * Implementation: Will be connected when the router service is available.
 */

/**
 * Request to the LLM Router
 */
export interface LLMRouterRequest {
  /** The prompt/message to send to the LLM */
  prompt: string;

  /** Context about the request source and purpose */
  context: {
    /** Service making the request (e.g., 'jules-control-room') */
    service: string;

    /** Optional session identifier for tracking */
    sessionId?: string;

    /** Type of task being performed */
    taskType?:
      | 'code-generation'
      | 'code-analysis'
      | 'session-summary'
      | 'user-assistance'
      | 'general-query';

    /** Optional user identifier */
    userId?: string;
  };

  /** Optional preferences for model selection and behavior */
  preferences?: {
    /** Specific model to use, or 'auto' for router to decide */
    model?: 'auto' | 'claude-3-5-sonnet' | 'claude-3-opus' | 'gpt-4' | 'gpt-3.5-turbo';

    /** Maximum tokens in response */
    maxTokens?: number;

    /** Temperature (0.0 - 1.0) */
    temperature?: number;

    /** System prompt override */
    systemPrompt?: string;
  };
}

/**
 * Response from the LLM Router
 */
export interface LLMRouterResponse {
  /** The LLM's response content */
  content: string;

  /** Model that was actually used */
  model: string;

  /** Token usage information */
  usage: {
    /** Input tokens consumed */
    inputTokens: number;

    /** Output tokens generated */
    outputTokens: number;

    /** Estimated cost in USD */
    cost: number;
  };

  /** Metadata about the request/response */
  metadata: {
    /** Latency in milliseconds */
    latencyMs: number;

    /** LLM provider (e.g., 'anthropic', 'openai') */
    provider: string;

    /** Whether this was cached/fallback */
    cached?: boolean;
    fallback?: boolean;
  };
}

/**
 * Error from the LLM Router
 */
export class LLMRouterError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'LLMRouterError';
  }
}

/**
 * LLM Router Client Interface
 *
 * This interface defines what methods this project expects the router client to provide.
 * Implementation will be added when router service is available.
 */
export interface ILLMRouterClient {
  /**
   * Send a chat request to the LLM router
   * @param request - The request to send
   * @returns Promise resolving to the LLM response
   * @throws LLMRouterError if the request fails
   */
  chat(request: LLMRouterRequest): Promise<LLMRouterResponse>;

  /**
   * Stream a chat request (for real-time UI updates)
   * @param request - The request to send
   * @param onChunk - Callback for each content chunk
   * @returns Promise resolving when stream completes
   * @throws LLMRouterError if the request fails
   */
  chatStream(
    request: LLMRouterRequest,
    onChunk: (chunk: string) => void,
  ): Promise<LLMRouterResponse>;

  /**
   * Health check for the router service
   * @returns Promise resolving to health status
   */
  health(): Promise<{ status: 'ok' | 'degraded' | 'down'; latencyMs: number }>;
}

/**
 * Configuration for the LLM Router Client
 */
export interface LLMRouterClientConfig {
  /** Base URL of the router service (e.g., 'http://llm-router:3000') */
  baseUrl: string;

  /** Authentication token for the router (if required) */
  apiToken?: string;

  /** Default timeout in milliseconds */
  timeoutMs?: number;

  /** Default retry configuration */
  retry?: {
    maxAttempts: number;
    initialDelayMs: number;
  };

  /** Service identifier for context */
  serviceName: string;
}

/**
 * Stub implementation (returns mock data until router is connected)
 *
 * This is a TEMPORARY stub that will be replaced with the real implementation
 * when the LLM router service is available. It allows development to continue
 * without the router being fully implemented.
 */
export class LLMRouterClientStub implements ILLMRouterClient {
  constructor(private config: LLMRouterClientConfig) {}

  async chat(request: LLMRouterRequest): Promise<LLMRouterResponse> {
    // TODO: Replace with actual HTTP call to router when available
    console.warn('[LLMRouterClientStub] Using stub implementation - replace with real router client');

    return {
      content: `[STUB RESPONSE] This is a mock response from the LLM router stub. Request: ${request.prompt.substring(0, 50)}...`,
      model: 'stub-model',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
      },
      metadata: {
        latencyMs: 0,
        provider: 'stub',
        cached: false,
      },
    };
  }

  async chatStream(
    request: LLMRouterRequest,
    onChunk: (chunk: string) => void,
  ): Promise<LLMRouterResponse> {
    // TODO: Replace with actual streaming HTTP call to router when available
    console.warn('[LLMRouterClientStub] Using stub implementation - replace with real router client');

    const response = await this.chat(request);
    onChunk(response.content);
    return response;
  }

  async health(): Promise<{ status: 'ok' | 'degraded' | 'down'; latencyMs: number }> {
    // TODO: Replace with actual health check when available
    return { status: 'down', latencyMs: 0 };
  }
}

/**
 * Factory function to create the LLM Router Client
 *
 * @param config - Configuration for the router client
 * @returns An instance of the router client (currently stub, will be real implementation later)
 */
export function createLLMRouterClient(config: LLMRouterClientConfig): ILLMRouterClient {
  // TODO: When router is available, check if baseUrl is accessible and return real client
  // For now, always return stub
  return new LLMRouterClientStub(config);
}

/**
 * Usage example for when this project adds agentic features:
 *
 * ```typescript
 * import { createLLMRouterClient } from './llmRouterClient.js';
 *
 * const llmClient = createLLMRouterClient({
 *   baseUrl: process.env.LLM_ROUTER_URL || 'http://llm-router:3000',
 *   serviceName: 'jules-control-room',
 *   timeoutMs: 30000,
 * });
 *
 * // Example: Dashboard assistant
 * router.post('/assistant/query', async (req, res) => {
 *   const { question } = req.body;
 *
 *   const response = await llmClient.chat({
 *     prompt: question,
 *     context: {
 *       service: 'jules-control-room',
 *       taskType: 'user-assistance',
 *       userId: req.userId,
 *     },
 *     preferences: {
 *       model: 'auto',
 *       maxTokens: 1000,
 *     },
 *   });
 *
 *   res.json({ answer: response.content });
 * });
 *
 * // Example: Session summary generation
 * router.get('/sessions/:id/summary', async (req, res) => {
 *   const session = await getSession(req.params.id);
 *   const activities = await listActivities(req.params.id);
 *
 *   const prompt = `Summarize this coding session:\n${JSON.stringify({ session, activities })}`;
 *
 *   const response = await llmClient.chat({
 *     prompt,
 *     context: {
 *       service: 'jules-control-room',
 *       sessionId: req.params.id,
 *       taskType: 'session-summary',
 *     },
 *   });
 *
 *   res.json({ summary: response.content });
 * });
 * ```
 */
