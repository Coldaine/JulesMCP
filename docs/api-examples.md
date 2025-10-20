# API Examples

Quick snippets for exercising the Jules Control Room Backend API.

## Prerequisites

1. Install dependencies: `npm install`
2. Copy `backend/.env.example` to `backend/.env`
3. Set at least `LOCAL_TOKEN` and `JULES_API_KEY`
4. Start the backend:
   - Development: `npm run dev`
   - Production: `npm run build && npm run start`

### Environment Variables

```bash
export BASE_URL="http://localhost:3001"
export LOCAL_TOKEN="local-dev-token"
```

---

## REST API Examples

### 1. Bash Script (`examples/api-example.sh`)

A complete happy-path flow using curl and jq:

1. Health and readiness probes
2. Create a session
3. List sessions
4. Approve a session
5. Send a message
6. Fetch activities
7. Demonstrate auth failure

**Run it:**

```bash
./examples/api-example.sh
```

**Requirements:**
- `curl` command-line tool
- `jq` JSON processor

### 2. TypeScript Client (`examples/client-example.ts`)

Demonstrates calling the REST API with `fetch` (Node 20+) and strong typing.

**Run it:**

```bash
npx tsx examples/client-example.ts
```

**Features:**
- TypeScript type safety
- Error handling
- Uses shared types from `shared/types.ts`

### 3. WebSocket Listener (`examples/websocket-example.ts`)

Connects to `/ws` using the `bearer.<token>` subprotocol, prints heartbeats, and echoes incoming deltas.

**Run it:**

```bash
npx tsx examples/websocket-example.ts
```

**Features:**
- WebSocket protocol negotiation
- Heartbeat monitoring
- Session delta broadcasting

---

## API Endpoints

### Health Checks

#### GET /healthz
Liveness check (always returns 200).

```bash
curl http://localhost:3001/healthz
```

#### GET /readyz
Readiness check (probes Jules API with 1s timeout).

```bash
curl http://localhost:3001/readyz
```

---

### Sessions

#### POST /api/sessions
Create a new session.

**Request:**
```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Authorization: Bearer $LOCAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "owner/repo",
    "summary": "Description of the task",
    "participants": ["user1", "user2"]
  }'
```

**Response:**
```json
{
  "id": "sess-abc123",
  "repo": "owner/repo",
  "branch": "main",
  "summary": "Description of the task",
  "planStatus": "pending",
  "approval": "pending",
  "participants": ["user1", "user2"],
  "createdAt": "2025-10-19T12:00:00.000Z"
}
```

#### GET /api/sessions
List all sessions.

```bash
curl http://localhost:3001/api/sessions \
  -H "Authorization: Bearer $LOCAL_TOKEN"
```

#### GET /api/sessions/:id
Get a specific session.

```bash
curl http://localhost:3001/api/sessions/sess-abc123 \
  -H "Authorization: Bearer $LOCAL_TOKEN"
```

---

### Session Actions

#### POST /api/sessions/:id/approve
Approve or reject a session plan.

**Request:**
```bash
curl -X POST http://localhost:3001/api/sessions/sess-abc123/approve \
  -H "Authorization: Bearer $LOCAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"state": "approved"}'
```

**Values:** `approved` | `rejected`

#### POST /api/sessions/:id/message
Send a message to the AI agent.

**Request:**
```bash
curl -X POST http://localhost:3001/api/sessions/sess-abc123/message \
  -H "Authorization: Bearer $LOCAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Please add more tests"}'
```

#### GET /api/sessions/:id/activities
Fetch all activities for a session.

```bash
curl http://localhost:3001/api/sessions/sess-abc123/activities \
  -H "Authorization: Bearer $LOCAL_TOKEN"
```

---

## WebSocket API

### Connection

Connect to `/ws` with bearer token authentication:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws', ['bearer.local-dev-token']);
```

### Heartbeat

Server sends ping frames every 30 seconds. Client must respond with pong.

### Session Deltas

Server broadcasts session changes to all connected clients:

```json
{
  "changeType": "created" | "updated" | "deleted",
  "before": null | JulesSession,
  "after": JulesSession | null,
  "timestamp": "2025-10-19T12:00:00.000Z"
}
```

### Example

```typescript
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3001/ws', ['bearer.local-dev-token']);

ws.on('open', () => {
  console.log('Connected to WebSocket');
});

ws.on('message', (data) => {
  const delta = JSON.parse(data.toString());
  console.log('Received delta:', delta);
});

ws.on('ping', () => {
  console.log('Received heartbeat ping');
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

---

## Error Responses

### 400 Bad Request
Invalid request body (Zod validation error).

```json
{
  "error": "validation_error",
  "details": {
    "repo": ["Required"],
    "summary": ["String must contain at least 1 character(s)"]
  }
}
```

### 401 Unauthorized
Missing or invalid bearer token.

```json
{
  "error": "unauthorized",
  "message": "Missing Authorization header"
}
```

### 408 Request Timeout
Jules API request timed out.

```json
{
  "error": "jules_timeout",
  "message": "Jules API request exceeded timeout"
}
```

### 429 Too Many Requests
Rate limit exceeded.

```json
{
  "error": "rate_limited",
  "message": "Rate limit exceeded"
}

Or:

{
  "error": "jules_rate_limited",
  "message": "Jules API rate limit exceeded"
}
```

### 502 Bad Gateway
Jules API is unavailable.

```json
{
  "error": "jules_unavailable",
  "message": "Jules API returned 5xx error",
  "shouldRetry": true
}
```

---

## Authentication

### REST API

Use the `Authorization` header with bearer token:

```bash
Authorization: Bearer <LOCAL_TOKEN>
```

### WebSocket

Use the `Sec-WebSocket-Protocol` header with bearer token:

```
Sec-WebSocket-Protocol: bearer.<LOCAL_TOKEN>
```

---

## Tips

### For LAN Deployments

Adjust `BASE_URL` for remote testing:

```bash
export BASE_URL="http://192.168.1.100:3001"
```

### For Production

Use HTTPS and strong tokens:

```bash
export BASE_URL="https://api.yourdomain.com"
export LOCAL_TOKEN="$(openssl rand -hex 32)"
```

### Debugging

Add `-v` flag to curl for verbose output:

```bash
curl -v http://localhost:3001/healthz
```

### Pretty-print JSON

Use `jq` to format responses:

```bash
curl -s http://localhost:3001/api/sessions \
  -H "Authorization: Bearer $LOCAL_TOKEN" | jq .
```
