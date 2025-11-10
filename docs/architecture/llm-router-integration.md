---
doc_type: architecture
subsystem: general
version: 1.0.0
status: approved
owners: Architecture Team
last_reviewed: 2025-11-10
---

# LLM Router Integration Plan

**Related:** [ADR-0002: Centralized LLM Router Pattern](adr-0002-centralized-llm-router.md)

## Overview

This document describes how JulesMCP (Jules Control Room) will integrate with the centralized LLM Router service to add agentic capabilities to the dashboard.

**Important:**
- **JulesMCP is a CLIENT** of the LLM router, not the router itself
- The router service will be built separately and shared across multiple projects
- This project currently does NOT make direct LLM calls (it calls Jules AI service API)

## Current State

### What JulesMCP Does Now

JulesMCP is a control room for managing Jules AI coding sessions:

- **Jules AI Integration** (`backend/src/julesClient.ts`)
  - Calls `api.jules.ai/v1` for session management
  - Creates/lists/manages coding sessions
  - Approves plans, sends messages
  - **Does NOT call LLM APIs directly**

- **WebSocket Broadcasting** (`backend/src/ws.ts`)
  - Real-time session updates
  - Delta broadcasting to UI clients

- **REST API** (`backend/src/routes/sessions.ts`)
  - Session CRUD operations
  - Activity logs
  - Plan approvals

### No LLM Calls Currently

**Analysis Result:** This project does not currently make any direct LLM API calls.

All AI functionality comes from the Jules AI service, which handles:
- Code generation
- Plan creation
- Session analysis
- Message responses

## Future Agentic Features

When we add agentic capabilities to JulesMCP, the following features will require LLM router integration:

### 1. Dashboard Assistant (High Priority)

**Use Case:** Users ask questions about their sessions in natural language

```
User: "What's the status of my latest session?"
Assistant: [Uses LLM to analyze session data and respond]

User: "Summarize what happened in session-abc-123"
Assistant: [Generates human-readable summary]

User: "Why did my plan fail?"
Assistant: [Analyzes error logs and provides insights]
```

**Implementation:**
- New endpoint: `POST /api/assistant/query`
- Uses LLM router for natural language understanding
- Context includes: user's sessions, recent activities, error logs

**Router Request Example:**
```typescript
await llmClient.chat({
  prompt: userQuestion,
  context: {
    service: 'jules-control-room',
    taskType: 'user-assistance',
    userId: req.userId,
  },
  preferences: {
    model: 'auto', // Let router choose based on complexity
    maxTokens: 1000,
  },
});
```

### 2. Session Summaries (Medium Priority)

**Use Case:** Automatically generate human-readable summaries of coding sessions

```
Session: "Add authentication to user service"
Activities: 50+ events (code changes, test runs, errors)

Summary:
"This session successfully added JWT authentication to the user service.
The implementation included middleware setup, token validation, and
comprehensive unit tests. All tests passed after fixing initial CORS issues."
```

**Implementation:**
- New endpoint: `GET /api/sessions/:id/summary`
- Aggregates session + activities data
- Uses LLM to generate concise summary

**Router Request Example:**
```typescript
await llmClient.chat({
  prompt: `Summarize this coding session:\n${JSON.stringify({ session, activities })}`,
  context: {
    service: 'jules-control-room',
    sessionId: sessionId,
    taskType: 'session-summary',
  },
  preferences: {
    model: 'auto',
    maxTokens: 500,
  },
});
```

### 3. Error Analysis (Medium Priority)

**Use Case:** Analyze why sessions failed and suggest fixes

```
Failed Session: Tests failing with cryptic error
Error Logs: [complex stack traces]

Analysis:
"The session failed due to a missing environment variable (DATABASE_URL).
This caused connection pool initialization to fail. Suggestion: Add
DATABASE_URL=... to your .env file before retrying."
```

**Implementation:**
- Enhanced `/api/sessions/:id` response includes error analysis
- Triggered automatically when session status = 'failed'
- Caches analysis to avoid repeated LLM calls

### 4. Proactive Recommendations (Low Priority)

**Use Case:** Suggest improvements based on session patterns

```
After analyzing 10+ sessions:
"I noticed you often encounter CORS errors. Consider adding a
.cors-config.json to your repos with standard settings."
```

**Implementation:**
- Background job analyzes session history
- Identifies common patterns/problems
- Generates personalized recommendations

### 5. Real-time Session Coaching (Future)

**Use Case:** Live suggestions while session is in progress

```
Session in progress: "Writing tests for API endpoints"
Coach: "I see you're testing auth. Don't forget to test token expiration!"
```

**Implementation:**
- WebSocket integration with LLM router
- Stream responses to UI in real-time
- Context-aware based on current session state

## Integration Architecture

### Client Contract

**Contract File:** `backend/src/llmRouterClient.ts`

This file defines:
- ✅ Request/Response interfaces
- ✅ Error handling
- ✅ Client interface (`ILLMRouterClient`)
- ✅ Stub implementation (for development before router is available)
- ✅ Usage examples

**Key Interfaces:**

```typescript
interface LLMRouterRequest {
  prompt: string;
  context: {
    service: string;
    sessionId?: string;
    taskType?: string;
    userId?: string;
  };
  preferences?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  };
}

interface LLMRouterResponse {
  content: string;
  model: string;
  usage: { inputTokens, outputTokens, cost };
  metadata: { latencyMs, provider };
}
```

### Configuration

**Environment Variables:**

```bash
# LLM Router connection
LLM_ROUTER_URL=http://llm-router:3000
LLM_ROUTER_TOKEN=<optional-auth-token>

# Feature flags (enable agentic features)
ENABLE_DASHBOARD_ASSISTANT=true
ENABLE_SESSION_SUMMARIES=true
ENABLE_ERROR_ANALYSIS=false
```

**Docker Compose Integration:**

```yaml
services:
  jules-control-room:
    environment:
      - LLM_ROUTER_URL=http://llm-router:3000
    depends_on:
      llm-router:
        condition: service_healthy
    networks:
      - mcp-network
```

### Client Initialization

**In `backend/src/server.ts`:**

```typescript
import { createLLMRouterClient } from './llmRouterClient.js';

// Initialize LLM router client (currently returns stub)
const llmClient = createLLMRouterClient({
  baseUrl: process.env.LLM_ROUTER_URL || 'http://llm-router:3000',
  serviceName: 'jules-control-room',
  timeoutMs: 30000,
  retry: {
    maxAttempts: 3,
    initialDelayMs: 500,
  },
});

// Make available to routes
app.locals.llmClient = llmClient;
```

## Implementation Phases

### Phase 1: Contract Establishment (Current)

**Status:** ✅ Complete

- [x] Create `llmRouterClient.ts` with interfaces
- [x] Define request/response contracts
- [x] Implement stub client for development
- [x] Document integration points (this file)

### Phase 2: Router Service Development (External)

**Status:** 🔄 Pending (separate project)

- [ ] Build centralized LLM router service
- [ ] Implement routing logic
- [ ] Deploy router in Docker network
- [ ] Validate router API matches contracts

### Phase 3: Real Client Implementation (Weeks 1-2)

**When router is available:**

- [ ] Implement real HTTP client in `llmRouterClient.ts`
- [ ] Replace stub with actual router calls
- [ ] Add retry logic and error handling
- [ ] Implement health checks
- [ ] Add observability (logging, metrics)

### Phase 4: Dashboard Assistant (Weeks 3-4)

**First agentic feature:**

- [ ] Create `/api/assistant/query` endpoint
- [ ] Integrate LLM router client
- [ ] Add UI chat interface
- [ ] Implement conversation context
- [ ] Add rate limiting

### Phase 5: Session Summaries (Weeks 5-6)

**Second agentic feature:**

- [ ] Create `/api/sessions/:id/summary` endpoint
- [ ] Aggregate session + activity data
- [ ] Generate summaries via router
- [ ] Cache summaries to reduce costs
- [ ] Display in UI

### Phase 6: Error Analysis (Weeks 7-8)

**Third agentic feature:**

- [ ] Detect failed sessions automatically
- [ ] Extract error logs and context
- [ ] Generate analysis via router
- [ ] Display in session detail view
- [ ] Track analysis accuracy

## Testing Strategy

### Unit Tests

**Test the contract, not the router:**

```typescript
// Test that we construct correct requests
describe('LLMRouterClient', () => {
  it('should build correct request payload', () => {
    const client = new LLMRouterClientStub(config);
    const request = {
      prompt: 'test',
      context: { service: 'jules-control-room' },
    };
    // Validate request structure
  });
});
```

### Integration Tests

**Use stub for development:**

```typescript
// Test routes with stub client
describe('Dashboard Assistant', () => {
  it('should respond to user queries', async () => {
    const res = await request(app)
      .post('/api/assistant/query')
      .send({ question: 'What is my latest session?' });

    expect(res.status).toBe(200);
    expect(res.body.answer).toBeDefined();
  });
});
```

### Router Integration Tests

**When router is available:**

```typescript
// Test against real router (integration environment)
describe('LLM Router Integration', () => {
  it('should get real response from router', async () => {
    const client = createLLMRouterClient({ baseUrl: ROUTER_URL });
    const response = await client.chat({
      prompt: 'Hello',
      context: { service: 'jules-control-room' },
    });

    expect(response.content).toBeTruthy();
    expect(response.model).not.toBe('stub-model');
  });
});
```

## Cost Management

### Strategies

1. **Caching**
   - Cache session summaries (don't regenerate)
   - Cache error analysis for identical errors
   - Use Redis for distributed cache

2. **Model Selection**
   - Use cheaper models for simple tasks (summaries)
   - Use expensive models for complex analysis (error debugging)
   - Let router optimize based on task type

3. **Rate Limiting**
   - Limit dashboard assistant queries per user
   - Throttle background analysis jobs
   - Prevent abuse

4. **Usage Tracking**
   - Log all LLM requests with cost
   - Dashboard showing LLM spend
   - Alerts when approaching budget

## Error Handling

### Graceful Degradation

**When router is unavailable:**

```typescript
try {
  const response = await llmClient.chat(request);
  return res.json({ answer: response.content });
} catch (error) {
  if (error instanceof LLMRouterError && !error.retryable) {
    // Router down - return graceful fallback
    return res.json({
      answer: 'Assistant temporarily unavailable. Please try again later.',
      degraded: true,
    });
  }
  throw error;
}
```

### Retry Logic

**Built into client:**

- Exponential backoff for transient failures
- Max 3 retry attempts
- Only retry on 429 (rate limit) or 5xx errors
- Don't retry on 4xx client errors

## Security Considerations

### API Token Management

- LLM_ROUTER_TOKEN stored in environment
- Never logged or exposed to UI
- Rotated regularly

### Input Validation

- Sanitize user prompts before sending to router
- Limit prompt length (prevent abuse)
- Filter sensitive data from context

### Output Validation

- Validate router responses match expected format
- Sanitize content before displaying in UI
- Detect and block harmful content

## Observability

### Logging

```typescript
logEvent({
  msg: 'llm_router_request',
  service: 'jules-control-room',
  taskType: 'user-assistance',
  model: response.model,
  inputTokens: response.usage.inputTokens,
  outputTokens: response.usage.outputTokens,
  cost: response.usage.cost,
  latencyMs: response.metadata.latencyMs,
});
```

### Metrics

- Request count by task type
- Average latency
- Total cost (daily/monthly)
- Error rate
- Cache hit rate

### Alerts

- Router health degraded
- High error rate (>5%)
- Cost spike (>$10/day)
- High latency (>5s P95)

## Related Documents

- [ADR-0002: Centralized LLM Router Pattern](adr-0002-centralized-llm-router.md)
- [Architecture Overview](../architecture.md)
- [Roadmap](roadmap.md)

---

**Last Updated:** 2025-11-10
**Status:** Contracts established, awaiting router service implementation
**Next Steps:** Build router service (external project), then implement real client
