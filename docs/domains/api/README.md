---
doc_type: domain_overview
domain_code: api
version: 1.0.0
status: approved
owners: Backend Team
last_reviewed: 2025-11-10
---

# API Domain

## Purpose

The API domain provides the RESTful HTTP interface for the Jules Control Room Backend. It handles all synchronous client-server interactions, including session management, activity tracking, and command execution. This domain is responsible for request validation, routing, response formatting, and error handling for all REST endpoints.

## Scope

**In Scope:**
- REST endpoint implementation (`/api/sessions`, `/api/sessions/:id`, etc.)
- Request/response validation using Zod schemas
- HTTP method handling (GET, POST, PUT, DELETE)
- Query parameter and path parameter parsing
- JSON request body parsing and validation
- Structured error responses with appropriate HTTP status codes
- Integration with Jules client for external API calls
- Session lifecycle management (create, read, update)
- Activity log retrieval and filtering
- Session approval workflows
- Message sending to active sessions

**Out of Scope:**
- WebSocket real-time communication (handled by WebSocket domain)
- Authentication/authorization logic (handled by Auth domain)
- Direct database operations (abstracted through service layer)
- Static file serving (handled at Express app level)
- Rate limiting and IP filtering (handled by Security domain)

## Key Components

### Routes Module (`backend/src/routes/sessions.ts`)

Primary router implementation containing all session-related endpoints.

**Core Functions:**
- `GET /api/sessions` - List all sessions with optional filtering
- `POST /api/sessions` - Create new session with repository and branch
- `GET /api/sessions/:id` - Retrieve single session details
- `GET /api/sessions/:id/activities` - Retrieve session activity log
- `POST /api/sessions/:id/approve` - Approve pending session plan
- `POST /api/sessions/:id/message` - Send message to active session

**Key Features:**
- Express Router instance exported as `sessionsRouter`
- Zod schema validation for all request bodies
- Async error handling wrapper for route handlers
- Jules client integration for external API calls
- Standardized error response format

### Validation Schemas (`backend/src/routes/sessions.ts`)

Zod schemas ensuring type safety and runtime validation.

**Schema Definitions:**
```typescript
const createSessionSchema = z.object({
  repository: z.string().min(1),
  branch: z.string().min(1).optional(),
  description: z.string().optional()
});

const approveSessionSchema = z.object({
  approved: z.boolean(),
  feedback: z.string().optional()
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  role: z.enum(['user', 'assistant']).optional()
});
```

### Error Handling

Structured error responses with consistent format:

```typescript
interface ApiError {
  error: string;           // Machine-readable error code
  message: string;         // Human-readable description
  details?: unknown;       // Optional validation details
  retry?: boolean;         // Whether client should retry
}
```

**Error Mapping:**
- Zod validation errors → 400 with flattened field errors
- Jules 408 timeout → 408 `jules_timeout`
- Jules 429 rate limit → 429 `jules_rate_limited`
- Jules 5xx → 502 `jules_unavailable` with retry flag
- Not found → 404 `not_found`
- Other Jules errors → original status with `jules_error`
- Uncaught errors → 500 `internal_error`

## Dependencies

### Internal Dependencies
- **Jules Client** (`backend/src/julesClient.ts`) - External API communication
- **Auth Middleware** (`backend/src/auth.ts`) - Request authentication
- **Logging** (`backend/src/logging.ts`) - Structured request/response logging
- **Shared Types** (`shared/types.ts`) - TypeScript DTOs and interfaces

### External Dependencies
- **express** (^4.18.0) - Web framework and routing
- **zod** (^3.22.0) - Schema validation library
- **pino** (^8.16.0) - Structured logging (via logging module)

## Related Domains

- **[Auth Domain](../auth/README.md)** - Provides authentication middleware protecting API endpoints
- **[Jules Integration Domain](../jules-integration/README.md)** - Handles external Jules API communication
- **[WebSocket Domain](../websocket/README.md)** - Provides real-time updates complementing REST API
- **[Persistence Domain](../persistence/README.md)** - Optional storage for session history

## Data Flow

### Session Creation Flow
```
Client Request
  ↓
[Auth Middleware] → Validate Bearer Token
  ↓
[Route Handler] → Validate Request Body (Zod)
  ↓
[Jules Client] → POST /sessions to Jules API
  ↓
[Route Handler] → Format Response
  ↓
Client Response (201 Created)
```

### Session Approval Flow
```
Client Request (POST /sessions/:id/approve)
  ↓
[Auth Middleware] → Validate Token
  ↓
[Route Handler] → Validate Body + Path Params
  ↓
[Jules Client] → POST /sessions/:id/approve
  ↓
[Route Handler] → Return Updated Session
  ↓
Client Response (200 OK)
```

### Error Handling Flow
```
Route Handler Error
  ↓
[Error Type Detection]
  ├─ ZodError → 400 + Field Details
  ├─ JulesHttpError → Map Status Code
  └─ Unknown Error → 500 Internal Error
  ↓
[Structured Logging] → Log with Request ID
  ↓
Client Response (JSON Error)
```

## API Specification

### Endpoints

#### `GET /api/sessions`
**Description:** List all active sessions

**Query Parameters:**
- `status` (optional): Filter by planStatus ('pending' | 'in_progress' | 'succeeded' | 'failed')
- `repo` (optional): Filter by repository name

**Response:** `200 OK`
```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "repository": "owner/repo",
      "branch": "main",
      "planStatus": "pending",
      "approval": { "state": "pending" },
      "participants": [],
      "createdAt": "2025-11-10T12:00:00Z"
    }
  ]
}
```

#### `POST /api/sessions`
**Description:** Create a new coding session

**Request Body:**
```json
{
  "repository": "owner/repo",
  "branch": "feature-branch",
  "description": "Implement new feature"
}
```

**Response:** `201 Created`
```json
{
  "session": {
    "id": "sess_xyz789",
    "repository": "owner/repo",
    "branch": "feature-branch",
    "planStatus": "pending",
    "approval": { "state": "pending" },
    "participants": [],
    "createdAt": "2025-11-10T12:05:00Z"
  }
}
```

#### `GET /api/sessions/:id`
**Description:** Retrieve specific session details

**Response:** `200 OK`
```json
{
  "session": {
    "id": "sess_abc123",
    "repository": "owner/repo",
    "branch": "main",
    "planStatus": "in_progress",
    "approval": { "state": "approved", "approvedAt": "2025-11-10T12:10:00Z" },
    "participants": ["user_123"],
    "createdAt": "2025-11-10T12:00:00Z"
  }
}
```

#### `GET /api/sessions/:id/activities`
**Description:** Retrieve session activity log

**Query Parameters:**
- `limit` (optional): Maximum number of activities (default: 50)
- `before` (optional): ISO timestamp for pagination

**Response:** `200 OK`
```json
{
  "activities": [
    {
      "id": "act_001",
      "sessionId": "sess_abc123",
      "type": "plan_created",
      "timestamp": "2025-11-10T12:00:00Z",
      "data": { "description": "Initial plan" }
    }
  ]
}
```

#### `POST /api/sessions/:id/approve`
**Description:** Approve or reject session plan

**Request Body:**
```json
{
  "approved": true,
  "feedback": "Looks good, proceed"
}
```

**Response:** `200 OK`
```json
{
  "session": {
    "id": "sess_abc123",
    "approval": {
      "state": "approved",
      "approvedAt": "2025-11-10T12:10:00Z",
      "feedback": "Looks good, proceed"
    }
  }
}
```

#### `POST /api/sessions/:id/message`
**Description:** Send message to active session

**Request Body:**
```json
{
  "content": "Please add unit tests",
  "role": "user"
}
```

**Response:** `200 OK`
```json
{
  "message": {
    "id": "msg_456",
    "sessionId": "sess_abc123",
    "content": "Please add unit tests",
    "role": "user",
    "timestamp": "2025-11-10T12:15:00Z"
  }
}
```

## Testing

### Test Coverage
- **Location:** `backend/src/__tests__/routes.test.ts`
- **Framework:** Vitest with Supertest
- **Coverage Target:** All endpoints and error scenarios

### Key Test Scenarios
1. **Session Creation:**
   - Valid repository and branch
   - Missing required fields
   - Invalid request body format

2. **Session Retrieval:**
   - Existing session by ID
   - Non-existent session (404)
   - List filtering by status/repo

3. **Session Approval:**
   - Valid approval with feedback
   - Rejection with reason
   - Invalid session ID

4. **Activity Retrieval:**
   - Pagination with limit/before
   - Empty activity log
   - Invalid session ID

5. **Message Sending:**
   - Valid message content
   - Empty content (validation error)
   - Session not in correct state

6. **Error Handling:**
   - Zod validation failures
   - Jules API timeouts
   - Jules API rate limiting
   - Network errors with retry flag

### Test Examples

```typescript
describe('POST /api/sessions', () => {
  it('creates session with valid input', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${LOCAL_TOKEN}`)
      .send({
        repository: 'test/repo',
        branch: 'main'
      });

    expect(response.status).toBe(201);
    expect(response.body.session).toHaveProperty('id');
    expect(response.body.session.repository).toBe('test/repo');
  });

  it('rejects invalid repository format', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${LOCAL_TOKEN}`)
      .send({ repository: '' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
  });
});
```

## Configuration

### Environment Variables
- **PORT** - Server listening port (default: 3001)
- **JULES_API_BASE** - Jules API base URL (default: https://api.jules.ai/v1)
- **NODE_ENV** - Environment mode ('development' | 'production')

### Route Configuration
```typescript
// backend/src/server.ts
import { sessionsRouter } from './routes/sessions.js';

app.use('/api', sessionsRouter);
```

## Monitoring & Observability

### Logging
All API requests logged with structured format:

```json
{
  "level": "info",
  "time": "2025-11-10T12:00:00.000Z",
  "requestId": "req_abc123",
  "method": "POST",
  "path": "/api/sessions",
  "status": 201,
  "elapsed": 245,
  "msg": "Request completed"
}
```

### Metrics to Track
- Request count by endpoint and status code
- Response time percentiles (p50, p95, p99)
- Error rate by error type
- Jules API call duration and retry count

### Error Monitoring
All errors logged with full context:

```json
{
  "level": "error",
  "time": "2025-11-10T12:00:00.000Z",
  "requestId": "req_xyz789",
  "error": "jules_timeout",
  "message": "Jules API request timed out",
  "stack": "Error: timeout\n  at ...",
  "retry": true
}
```

## Performance Considerations

### Request Validation
- Zod schemas compiled once at module load
- Validation errors fail fast before external calls
- Minimal memory overhead per request

### Response Size
- Session lists paginated by default
- Activity logs limited to 50 entries per request
- Large responses streamed when possible

### Caching Strategy
- No caching at API layer (handled by Jules API)
- ETag support for conditional requests (future)
- Client-side caching recommended for session lists

## Security Considerations

### Input Validation
- All request bodies validated with Zod schemas
- Path parameters sanitized and validated
- Query parameters type-checked and bounded

### Authentication
- All endpoints protected by auth middleware
- Bearer token required in Authorization header
- Token validation before request processing

### Error Information Disclosure
- Stack traces excluded from production errors
- Validation details limited to field names
- Internal error details logged but not exposed

### Rate Limiting
- Implemented at security layer (not API layer)
- Per-IP and per-endpoint limits
- Jules API rate limits respected with backoff

## Future Enhancements

### Planned Features
1. **Pagination Improvements:**
   - Cursor-based pagination for large result sets
   - Total count metadata in list responses

2. **Filtering Enhancements:**
   - Full-text search across sessions
   - Date range filtering for activities
   - Complex query operators (AND/OR)

3. **Batch Operations:**
   - Bulk session creation
   - Batch approval workflows
   - Multi-session status updates

4. **Response Optimization:**
   - Field selection (`?fields=id,status`)
   - Response compression (gzip/brotli)
   - ETag support for conditional requests

5. **WebHooks:**
   - Configurable webhooks for session events
   - Retry logic for failed webhook deliveries
   - Webhook signature verification

### API Versioning Strategy
- Current: Single version at `/api/*`
- Future: Version in path (`/api/v1/*`, `/api/v2/*`)
- Deprecation policy: 6-month notice for breaking changes

## Change Log

| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| 1.0.0   | 2025-11-10 | Initial domain overview documentation        |

## Additional Resources

- **[API Testing Guide](../../guides/testing/api-testing.md)** - Comprehensive testing strategies
- **[Error Handling Standards](../../standards/error-handling.md)** - Error response format specifications
- **[Validation Patterns](../../guides/validation/zod-patterns.md)** - Zod schema best practices
- **[REST API Guidelines](../../standards/api-design.md)** - REST endpoint design principles
