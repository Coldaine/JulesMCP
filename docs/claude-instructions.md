# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jules Control Room Backend: A secure, single-origin backend for orchestrating Jules AI sessions with strict authentication, resilient WebSockets, and observability.

## Development Commands

### Setup
```bash
npm install
cp backend/.env.example backend/.env
# Edit backend/.env with real tokens before running
```

### Common Commands
```bash
npm run dev        # Start server with hot reload (nodemon)
npm run build      # Compile TypeScript to backend/dist
npm run start      # Run compiled server
npm run lint       # ESLint check
npm run typecheck  # TypeScript strict checking
npm run test       # Run Vitest test suite
npm run test:watch # Run tests in watch mode
```

### Docker
```bash
docker compose build
docker compose up -d
```

## Architecture

### Workspace Structure
- **Root**: npm workspace orchestrator proxying commands to backend
- **backend/**: Express server with TypeScript
- **shared/**: Shared type definitions (DTOs) used across packages

### Core Components

**server.ts** - Main Express app with:
- Security hardening (helmet, CORS, rate limiting)
- Single-origin static file serving from `backend/public/`
- Request ID logging (Pino structured JSON)
- Graceful shutdown handlers (SIGTERM/SIGINT)
- Health probes: `/healthz` (liveness), `/readyz` (1s Jules API probe)

**julesClient.ts** - Jules API wrapper:
- 10s default timeout with AbortController
- Exponential backoff retry (4 attempts for 429/5xx)
- Secret-safe logging (no API keys in logs)
- Custom `JulesHttpError` for API failures

**routes/sessions.ts** - REST API under `/api`:
- Zod schema validation for all request/response bodies
- Endpoints: GET/POST `/sessions`, GET `/sessions/:id`, GET `/sessions/:id/activities`, POST `/sessions/:id/approve`, POST `/sessions/:id/message`
- Error handling: maps Zod validation errors to 400, Jules errors to appropriate HTTP codes

**auth.ts** - Dual auth system:
- REST: `Authorization: Bearer <LOCAL_TOKEN>`
- WebSocket: `Sec-WebSocket-Protocol: bearer.<LOCAL_TOKEN>`

**security.ts** - IP allowlist + rate limiting:
- `ipAllow`: enforces CIDR prefixes from `ALLOWLIST` env var
- `rateLimit`: 60 req/min per IP+path (in-memory)

**ws.ts** - WebSocket session delta broadcasting:
- Heartbeat ping/pong every 30s, terminates dead connections
- Background poller (5s interval) diffs Jules sessions and broadcasts deltas
- Backpressure protection (closes connection if bufferedAmount > 1MB)
- Optional persistence to SQLite and webhook notifications

**persistence.ts** - Optional SQLite storage (enabled when `PERSIST=1`):
- Uses `sql.js` in-memory database with file snapshots to `data/sessions.sqlite`
- Stores session deltas for history

**notifier.ts** - Optional webhook notifications:
- Posts session deltas to `NOTIFY_WEBHOOK` URL when configured

**logging.ts** - Structured logging:
- Pino JSON logger with request IDs
- `withRequestId` middleware assigns UUIDs to each request
- Secrets automatically filtered from logs

## Environment Variables

Located in `backend/.env`:

| Variable | Purpose | Default |
|----------|---------|---------|
| `JULES_API_KEY` | Jules API service key | - |
| `LOCAL_TOKEN` | Bearer token for auth (REST + WS) | - |
| `PORT` | Server listening port | 3001 |
| `ALLOWLIST` | Comma-separated CIDR prefixes for LAN | empty (localhost only) |
| `CORS_ORIGIN` | Explicit CORS origins (remote UI) | unset (single-origin mode) |
| `PERSIST` | Enable SQLite session history | unset (disabled) |
| `NOTIFY_WEBHOOK` | HTTPS endpoint for session deltas | unset (disabled) |
| `JULES_API_BASE` | Jules API base URL | https://api.jules.ai/v1 |

**Security**: Never expose without strong `LOCAL_TOKEN`, firewall rules, and explicit `ALLOWLIST`.

## Testing

**Location**: `backend/src/__tests__/`

**Test files**:
- `auth.test.ts` - HTTP/WS token enforcement
- `security.test.ts` - IP allowlist and rate limiting
- `julesClient.test.ts` - Retry/backoff with nock mocks
- `routes.test.ts` - Integration flow (create → approve → message → activities)
- `ws.test.ts` - WebSocket heartbeats and delta broadcasts

**Configuration**: `backend/vitest.config.ts`
- Runs with `--no-threads` to avoid race conditions
- Uses path alias `@shared` → `../shared`
- Setup file: `vitest.setup.ts`

**Running individual tests**:
```bash
npx vitest run backend/src/__tests__/auth.test.ts
npx vitest run backend/src/__tests__/routes.test.ts
```

## Type System

**shared/types.ts** - Shared DTOs:
- `JulesSession`: session state with id, repo, branch, planStatus, approval, participants
- `SessionActivity`: activity log entries
- `CreateSessionInput`: session creation payload
- `SessionDelta`: before/after snapshot with change type (created/updated/deleted)
- `PlanStatus`: 'pending' | 'in_progress' | 'succeeded' | 'failed'
- `ApprovalState`: 'pending' | 'approved' | 'rejected'

**Validation**: All API routes use Zod schemas that mirror these types for runtime validation.

## Key Patterns

**Request flow**:
1. Express middleware chain: `withRequestId` → `ipAllow` → `rateLimit` → `authHttp`
2. Route handler validates body with Zod
3. `julesClient` makes external API call with retry logic
4. Success returns JSON, failure caught by route error handler
5. Structured logs emitted with request ID correlation

**WebSocket flow**:
1. Upgrade request authenticated via `authWs` checking `Sec-WebSocket-Protocol` header
2. Connection added to clients set, heartbeat enabled
3. Background poller diffs Jules sessions every 5s
4. Deltas persisted (if enabled) and broadcast to all connected clients
5. Dead connections terminated by heartbeat monitor

**Error handling**:
- Zod validation errors → 400 with flattened details
- Jules 408 timeout → 408 `jules_timeout`
- Jules 429 rate limit → 429 `jules_rate_limited`
- Jules 5xx → 502 `jules_unavailable` with retry flag
- Other Jules errors → original status with `jules_error`
- Uncaught errors → 500 `internal_error`

## Module System

- TypeScript ESM (`"type": "module"` in package.json)
- All imports use `.js` extension (TypeScript requirement for ESM)
- Node 20+ required (`engines` constraint in package.json)

## Observability

- All HTTP responses logged with status, path, elapsed time, request ID
- Jules client operations logged with elapsed time and status
- WebSocket broadcasts logged with client count and payload size
- Errors logged with full stack traces (secrets filtered)
- No request bodies or Authorization headers in logs
