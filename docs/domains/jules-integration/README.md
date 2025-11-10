---
doc_type: domain_overview
domain_code: jules-integration
version: 1.0.0
status: approved
owners: Backend Team
last_reviewed: 2025-11-10
---

# Jules Integration Domain

## Purpose

The Jules Integration domain provides a robust client wrapper for communicating with the external Jules AI API. It handles HTTP request construction, timeout management, exponential backoff retry logic, error handling, and secret-safe logging. This domain abstracts the complexity of external API communication and provides a reliable, type-safe interface for the rest of the application.

## Scope

**In Scope:**
- HTTP client wrapper for Jules API endpoints
- Request timeout management (10s default)
- Exponential backoff retry logic (4 attempts for 429/5xx)
- Custom error types (`JulesHttpError`) with retry hints
- Secret-safe logging (no API keys in logs)
- AbortController integration for request cancellation
- Type-safe request/response interfaces
- Base URL configuration via environment variable
- Rate limit handling (429 responses)
- Server error retry (5xx responses)

**Out of Scope:**
- WebSocket communication with Jules API
- Authentication token generation/rotation
- Request body validation (handled by API domain)
- Response caching
- Request queuing or throttling
- API version negotiation
- Multi-region failover

## Key Components

### Jules Client Module (`backend/src/julesClient.ts`)

Primary client implementation with retry logic and error handling.

**Core Functions:**

```typescript
export async function createSession(input: CreateSessionInput): Promise<JulesSession>;
export async function listSessions(): Promise<JulesSession[]>;
export async function getSession(id: string): Promise<JulesSession>;
export async function getActivities(id: string): Promise<SessionActivity[]>;
export async function approveSession(id: string, approved: boolean, feedback?: string): Promise<JulesSession>;
export async function sendMessage(id: string, content: string): Promise<void>;
```

**Internal Helper:**
```typescript
async function julesRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  retries = 4
): Promise<T>;
```

### Retry Logic

**Exponential Backoff Implementation:**
```typescript
const delays = [1000, 2000, 4000, 8000]; // milliseconds

for (let attempt = 0; attempt < retries; attempt++) {
  try {
    return await makeRequest();
  } catch (error) {
    if (shouldRetry(error) && attempt < retries - 1) {
      const delay = delays[attempt];
      logger.warn({ attempt, delay }, 'Retrying Jules API request');
      await sleep(delay);
      continue;
    }
    throw error;
  }
}
```

**Retry Conditions:**
- HTTP 429 (Rate Limit Exceeded)
- HTTP 5xx (Server Errors)
- Network timeouts
- Connection refused

**Non-Retry Conditions:**
- HTTP 4xx (except 429) - Client errors
- HTTP 408 (Timeout) - Explicit timeout
- Invalid JSON responses
- Authentication errors (401)

### Custom Error Type

**JulesHttpError Class:**
```typescript
export class JulesHttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retry: boolean = false
  ) {
    super(message);
    this.name = 'JulesHttpError';
  }
}
```

**Error Mapping:**
```typescript
if (response.status === 408) {
  throw new JulesHttpError(408, 'jules_timeout', 'Request timed out', false);
}
if (response.status === 429) {
  throw new JulesHttpError(429, 'jules_rate_limited', 'Rate limit exceeded', true);
}
if (response.status >= 500) {
  throw new JulesHttpError(response.status, 'jules_unavailable', 'Service unavailable', true);
}
if (!response.ok) {
  throw new JulesHttpError(response.status, 'jules_error', `HTTP ${response.status}`, false);
}
```

### Timeout Management

**AbortController Implementation:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10_000); // 10s timeout

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: { /* ... */ }
  });
  return response;
} finally {
  clearTimeout(timeoutId);
}
```

**Timeout Error Handling:**
```typescript
catch (error) {
  if (error.name === 'AbortError') {
    throw new JulesHttpError(408, 'jules_timeout', 'Request timed out', false);
  }
  throw error;
}
```

### Secret-Safe Logging

**Request Logging:**
```typescript
logger.info({
  method,
  path,
  baseUrl: JULES_API_BASE,
  // API key intentionally omitted
}, 'Jules API request');
```

**Response Logging:**
```typescript
logger.info({
  method,
  path,
  status: response.status,
  elapsed: Date.now() - startTime,
  // Response body omitted for brevity
}, 'Jules API response');
```

**Error Logging:**
```typescript
logger.error({
  method,
  path,
  status: error.status,
  code: error.code,
  retry: error.retry,
  // Stack trace included but sanitized
}, 'Jules API error');
```

## Dependencies

### Internal Dependencies
- **Logging** (`backend/src/logging.ts`) - Structured logging with secret filtering
- **Shared Types** (`shared/types.ts`) - TypeScript DTOs (JulesSession, SessionActivity, etc.)

### External Dependencies
- **node-fetch** (or native fetch in Node 18+) - HTTP client
- **abort-controller** (polyfill for Node < 15) - Request cancellation

## Related Domains

- **[API Domain](../api/README.md)** - Consumes Jules client for route handlers
- **[WebSocket Domain](../websocket/README.md)** - Uses client for session polling
- **[Auth Domain](../auth/README.md)** - Provides JULES_API_KEY configuration

## Data Flow

### Session Creation Flow
```
API Route Handler
  ↓
julesClient.createSession({ repository, branch })
  ↓
[julesRequest] → Construct Request
  ↓
[fetch] → POST /sessions (10s timeout)
  ↓
[Response Handler]
  ├─ Success → Parse JSON → Return JulesSession
  ├─ 429 → Retry with Backoff
  ├─ 5xx → Retry with Backoff
  └─ 4xx → Throw JulesHttpError (no retry)
  ↓
Return to Route Handler
```

### Retry Flow with Backoff
```
[Attempt 1] → Request → 500 Internal Server Error
  ↓
[Wait 1s]
  ↓
[Attempt 2] → Request → 500 Internal Server Error
  ↓
[Wait 2s]
  ↓
[Attempt 3] → Request → 500 Internal Server Error
  ↓
[Wait 4s]
  ↓
[Attempt 4] → Request → 200 OK
  ↓
Return Success
```

### Error Propagation Flow
```
Jules API Error (e.g., 404)
  ↓
[julesRequest] → Throw JulesHttpError
  ↓
Route Handler Catch Block
  ↓
[Error Handler Middleware]
  ├─ JulesHttpError → Map to HTTP Response
  └─ Other Error → 500 Internal Error
  ↓
Client Receives Error Response
```

## API Client Specification

### Configuration

**Environment Variables:**
```bash
JULES_API_KEY=your-jules-api-key-here
JULES_API_BASE=https://api.jules.ai/v1
```

**Client Initialization:**
```typescript
import dotenv from 'dotenv';
dotenv.config();

const JULES_API_KEY = process.env.JULES_API_KEY;
const JULES_API_BASE = process.env.JULES_API_BASE || 'https://api.jules.ai/v1';

if (!JULES_API_KEY) {
  throw new Error('JULES_API_KEY environment variable is required');
}
```

### Request Format

**Common Headers:**
```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${JULES_API_KEY}`,
  'User-Agent': 'JulesControlRoom/1.0'
};
```

**Example POST Request:**
```typescript
const response = await fetch(`${JULES_API_BASE}/sessions`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    repository: 'owner/repo',
    branch: 'main'
  }),
  signal: abortController.signal
});
```

### Response Handling

**Success Response (2xx):**
```json
{
  "id": "sess_abc123",
  "repository": "owner/repo",
  "branch": "main",
  "planStatus": "pending",
  "approval": { "state": "pending" },
  "participants": [],
  "createdAt": "2025-11-10T12:00:00Z"
}
```

**Error Response (4xx/5xx):**
```json
{
  "error": "invalid_repository",
  "message": "Repository not found or inaccessible"
}
```

### Endpoints

| Method | Path                          | Description                     | Retryable |
|--------|-------------------------------|---------------------------------|-----------|
| GET    | `/sessions`                   | List all sessions               | Yes       |
| POST   | `/sessions`                   | Create new session              | No        |
| GET    | `/sessions/:id`               | Get session details             | Yes       |
| GET    | `/sessions/:id/activities`    | Get session activity log        | Yes       |
| POST   | `/sessions/:id/approve`       | Approve/reject session plan     | No        |
| POST   | `/sessions/:id/message`       | Send message to session         | No        |

**Retry Policy:**
- GET requests: Retryable on timeout/5xx
- POST requests: Not retryable (idempotency concerns)
- 429 Rate Limit: Always retryable (all methods)

## Testing

### Test Coverage
- **Location:** `backend/src/__tests__/julesClient.test.ts`
- **Framework:** Vitest with nock for HTTP mocking
- **Coverage Target:** All client methods, retry scenarios, error conditions

### Key Test Scenarios

1. **Successful Requests:**
   - Create session with valid input
   - List sessions (empty and populated)
   - Get session by ID
   - Get activities for session
   - Approve session
   - Send message

2. **Retry Logic:**
   - 429 Rate Limit → Retry → Success
   - 500 Server Error → Retry → Success
   - Multiple retries exhausted → Error
   - Exponential backoff timing validation

3. **Timeout Handling:**
   - Request exceeds 10s timeout
   - Timeout during retry attempt
   - AbortController cleanup

4. **Error Handling:**
   - 404 Not Found (no retry)
   - 400 Bad Request (no retry)
   - 401 Unauthorized (no retry)
   - Network error (retry)
   - Invalid JSON response

5. **Secret Safety:**
   - API key not in logs
   - Authorization header filtered
   - Error messages sanitized

### Test Examples

```typescript
describe('julesClient', () => {
  it('creates session successfully', async () => {
    nock('https://api.jules.ai/v1')
      .post('/sessions')
      .reply(201, {
        id: 'sess_123',
        repository: 'test/repo',
        branch: 'main',
        planStatus: 'pending'
      });

    const session = await createSession({
      repository: 'test/repo',
      branch: 'main'
    });

    expect(session.id).toBe('sess_123');
    expect(session.repository).toBe('test/repo');
  });

  it('retries on 429 rate limit', async () => {
    nock('https://api.jules.ai/v1')
      .get('/sessions')
      .reply(429, { error: 'rate_limited' })
      .get('/sessions')
      .reply(200, []);

    const sessions = await listSessions();

    expect(sessions).toEqual([]);
    // Verify retry attempt in logs
  });

  it('throws JulesHttpError on 404', async () => {
    nock('https://api.jules.ai/v1')
      .get('/sessions/nonexistent')
      .reply(404, { error: 'not_found' });

    await expect(getSession('nonexistent')).rejects.toThrow(JulesHttpError);
    await expect(getSession('nonexistent')).rejects.toMatchObject({
      status: 404,
      code: 'jules_error',
      retry: false
    });
  });

  it('exhausts retries on persistent 500 errors', async () => {
    nock('https://api.jules.ai/v1')
      .get('/sessions')
      .times(4)
      .reply(500, { error: 'internal_error' });

    await expect(listSessions()).rejects.toThrow(JulesHttpError);
    // Verify 4 retry attempts in logs
  });
});
```

## Configuration

### Environment Variables

| Variable        | Required | Default                     | Description                    |
|-----------------|----------|-----------------------------|--------------------------------|
| JULES_API_KEY   | Yes      | -                           | Jules API authentication key   |
| JULES_API_BASE  | No       | https://api.jules.ai/v1     | Base URL for Jules API         |
| NODE_ENV        | No       | development                 | Environment mode               |

### Timeout Configuration

```typescript
const DEFAULT_TIMEOUT = 10_000; // 10 seconds
const RETRY_DELAYS = [1000, 2000, 4000, 8000]; // Exponential backoff
const MAX_RETRIES = 4;
```

**Customization (Future):**
```typescript
export function configureClient(options: {
  timeout?: number;
  retries?: number;
  retryDelays?: number[];
}) {
  // Allow runtime configuration
}
```

## Monitoring & Observability

### Logging

**Request Started:**
```json
{
  "level": "info",
  "time": "2025-11-10T12:00:00.000Z",
  "msg": "Jules API request",
  "method": "POST",
  "path": "/sessions",
  "baseUrl": "https://api.jules.ai/v1"
}
```

**Request Completed:**
```json
{
  "level": "info",
  "time": "2025-11-10T12:00:00.500Z",
  "msg": "Jules API response",
  "method": "POST",
  "path": "/sessions",
  "status": 201,
  "elapsed": 500
}
```

**Retry Attempt:**
```json
{
  "level": "warn",
  "time": "2025-11-10T12:00:00.000Z",
  "msg": "Retrying Jules API request",
  "method": "GET",
  "path": "/sessions",
  "attempt": 1,
  "delay": 1000,
  "reason": "rate_limited"
}
```

**Request Failed:**
```json
{
  "level": "error",
  "time": "2025-11-10T12:00:00.000Z",
  "msg": "Jules API error",
  "method": "POST",
  "path": "/sessions",
  "status": 400,
  "code": "jules_error",
  "retry": false,
  "elapsed": 250
}
```

### Metrics to Track

- Request count by endpoint and status code
- Request duration (p50, p95, p99)
- Retry count by reason
- Timeout rate
- Error rate by error code
- Success rate after retries

### Health Checks

**Readiness Probe:**
```typescript
export async function checkHealth(): Promise<boolean> {
  try {
    await fetch(`${JULES_API_BASE}/health`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${JULES_API_KEY}` },
      signal: AbortSignal.timeout(1000) // 1s timeout for health check
    });
    return true;
  } catch {
    return false;
  }
}
```

**Usage:**
```typescript
app.get('/readyz', async (req, res) => {
  const healthy = await checkHealth();
  res.status(healthy ? 200 : 503).json({ healthy });
});
```

## Performance Considerations

### Request Batching
- Currently: Individual requests per operation
- Future: Batch multiple operations in single request
- Reduces latency and API call count

### Connection Pooling
- Node.js `http.Agent` with `keepAlive: true`
- Reuses TCP connections for multiple requests
- Reduces connection overhead

### Response Caching
- Currently: No caching (always fresh data)
- Future: Cache GET requests with TTL
- Invalidate on mutations (POST/PUT/DELETE)

### Parallel Requests
```typescript
// Multiple independent requests
const [sessions, activities] = await Promise.all([
  listSessions(),
  getActivities('sess_123')
]);
```

## Security Considerations

### API Key Protection
- Stored in environment variable (not code)
- Never logged or exposed in errors
- Filtered from all log output
- Transmitted only via HTTPS

### Request Signing
- Currently: Bearer token only
- Future: HMAC request signing
- Prevents replay attacks

### Rate Limit Compliance
- Respects 429 responses
- Exponential backoff prevents aggressive retries
- Max 4 retries per request

### TLS/SSL Verification
- Validates server certificates
- Rejects self-signed certificates in production
- Development mode may allow insecure connections

## Error Handling Best Practices

### Caller Responsibility
```typescript
try {
  const session = await createSession(input);
  return res.status(201).json({ session });
} catch (error) {
  if (error instanceof JulesHttpError) {
    return res.status(error.status).json({
      error: error.code,
      message: error.message,
      retry: error.retry
    });
  }
  return res.status(500).json({ error: 'internal_error' });
}
```

### Retry Hints
```typescript
if (error instanceof JulesHttpError && error.retry) {
  // Client should retry after delay
  res.setHeader('Retry-After', '60'); // seconds
}
```

### Circuit Breaker (Future)
```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailure: Date | null = null;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    return this.failureCount >= 5 &&
           Date.now() - this.lastFailure!.getTime() < 60_000;
  }
}
```

## Future Enhancements

### Planned Features

1. **Response Caching:**
   - In-memory LRU cache for GET requests
   - Configurable TTL per endpoint
   - Cache invalidation on mutations

2. **Request Queuing:**
   - Queue POST requests to prevent overwhelming API
   - Configurable concurrency limits
   - Priority queue for critical operations

3. **Metrics Export:**
   - Prometheus metrics endpoint
   - Request duration histograms
   - Error rate counters

4. **GraphQL Support:**
   - GraphQL client for batch queries
   - Reduces over-fetching
   - Single request for multiple resources

5. **Webhook Integration:**
   - Subscribe to Jules events via webhooks
   - Reduces polling frequency
   - Real-time updates

### API Client Upgrades

**Axios Migration:**
```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: JULES_API_BASE,
  timeout: 10_000,
  headers: { 'Authorization': `Bearer ${JULES_API_KEY}` }
});

// Interceptors for logging and retry
client.interceptors.response.use(
  response => response,
  error => retryHandler(error)
);
```

**GraphQL Client:**
```typescript
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient(`${JULES_API_BASE}/graphql`, {
  headers: { 'Authorization': `Bearer ${JULES_API_KEY}` }
});

const sessions = await client.request(gql`
  query {
    sessions {
      id
      repository
      planStatus
    }
  }
`);
```

## Troubleshooting

### Common Issues

**Issue:** All requests timeout
- **Cause:** Jules API unavailable or network issues
- **Solution:** Check API status, verify network connectivity

**Issue:** 401 Unauthorized errors
- **Cause:** Invalid or expired JULES_API_KEY
- **Solution:** Verify API key in .env, regenerate if expired

**Issue:** Excessive retries
- **Cause:** Jules API experiencing high load or outage
- **Solution:** Implement circuit breaker, reduce retry count

**Issue:** Rate limit errors (429)
- **Cause:** Exceeding Jules API rate limits
- **Solution:** Reduce request frequency, implement request queuing

### Debug Commands

**Test API Connectivity:**
```bash
curl -H "Authorization: Bearer $JULES_API_KEY" \
  https://api.jules.ai/v1/sessions
```

**Enable Debug Logging:**
```bash
LOG_LEVEL=debug npm run dev
```

**Inspect Request/Response:**
```typescript
// Temporarily add detailed logging
logger.debug({ body: request.body }, 'Request body');
logger.debug({ body: response.body }, 'Response body');
```

## Change Log

| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| 1.0.0   | 2025-11-10 | Initial domain overview documentation        |

## Additional Resources

- **[Jules API Documentation](https://docs.jules.ai/api)** - Official API reference
- **[HTTP Client Testing Guide](../../guides/testing/http-client-testing.md)** - Testing strategies for external APIs
- **[Retry Patterns](../../guides/patterns/retry-strategies.md)** - Exponential backoff and circuit breaker patterns
- **[Error Handling Standards](../../standards/error-handling.md)** - Error response format specifications
