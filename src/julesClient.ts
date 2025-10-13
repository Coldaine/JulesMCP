import pino from 'pino';

const logger = pino.default({
  name: 'julesClient',
  level: process.env.LOG_LEVEL || 'info',
});

export interface JulesClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface JulesResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

/**
 * Redact sensitive information from headers and body
 */
function redactSensitiveData(obj: any): any {
  if (!obj) return obj;
  
  const redacted = { ...obj };
  const sensitiveKeys = ['authorization', 'password', 'token', 'secret', 'apikey', 'api-key'];
  
  for (const key in redacted) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      redacted[key] = '[REDACTED]';
    }
  }
  
  return redacted;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number }
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Jules Client - HTTP client with timeout, retries, and redacted logging
 */
export class JulesClient {
  private baseUrl: string;
  private defaultOptions: JulesClientOptions;

  constructor(baseUrl: string, options: JulesClientOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      timeout: options.timeout || DEFAULT_TIMEOUT,
      retries: options.retries || DEFAULT_RETRIES,
      retryDelay: options.retryDelay || DEFAULT_RETRY_DELAY,
    };
  }

  /**
   * Make an HTTP request with retries and logging
   */
  async request<T = any>(
    path: string,
    options: RequestInit & JulesClientOptions = {}
  ): Promise<JulesResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const {
      timeout = this.defaultOptions.timeout,
      retries = this.defaultOptions.retries,
      retryDelay = this.defaultOptions.retryDelay,
      ...fetchOptions
    } = options;

    const requestId = Math.random().toString(36).substring(7);
    
    logger.info({
      requestId,
      method: fetchOptions.method || 'GET',
      url,
      headers: redactSensitiveData(fetchOptions.headers),
    }, 'Outgoing request');

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries!; attempt++) {
      try {
        if (attempt > 0) {
          const delay = retryDelay! * attempt;
          logger.warn({
            requestId,
            attempt,
            delay,
          }, 'Retrying request');
          await sleep(delay);
        }

        const startTime = Date.now();
        const response = await fetchWithTimeout(url, {
          ...fetchOptions,
          timeout,
        });
        const duration = Date.now() - startTime;

        const responseData = await response.json().catch(() => ({}));

        logger.info({
          requestId,
          status: response.status,
          duration,
          attempt,
        }, 'Request completed');

        return {
          data: responseData as T,
          status: response.status,
        };
      } catch (error) {
        lastError = error as Error;
        
        logger.error({
          requestId,
          attempt,
          error: lastError.message,
        }, 'Request failed');

        // Don't retry if it's the last attempt
        if (attempt === retries) {
          break;
        }
      }
    }

    return {
      error: lastError?.message || 'Unknown error',
      status: 500,
    };
  }

  /**
   * GET request
   */
  async get<T = any>(path: string, options?: JulesClientOptions): Promise<JulesResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    path: string,
    body?: any,
    options?: JulesClientOptions
  ): Promise<JulesResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    path: string,
    body?: any,
    options?: JulesClientOptions
  ): Promise<JulesResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(path: string, options?: JulesClientOptions): Promise<JulesResponse<T>> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}
