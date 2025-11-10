---
doc_type: architecture
subsystem: general
version: 1.0.0
status: approved
owners: Architecture Team
last_reviewed: 2025-11-10
---

# Jules Control Room Backend - Architecture

**Personal AI Development Control Center** - A single-user tool for orchestrating Jules AI coding sessions with real-time monitoring and control.

## System Vision

Jules Control Room Backend provides a secure, personal command center for managing AI coding sessions. It serves as the bridge between you and the Jules AI service, offering:

- **Real-time session monitoring** via WebSocket delta broadcasting
- **Secure API gateway** with authentication and rate limiting
- **Session lifecycle management** (create, approve, message, monitor)
- **Optional persistence** with SQLite storage
- **Webhook notifications** for session events

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Jules Control Room Backend                │
│                    (Express + TypeScript + Node 20+)         │
└─────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
          ┌──────▼──────┐          ┌──────▼──────┐
          │   REST API  │          │  WebSocket  │
          │  /api/*     │          │    /ws      │
          └──────┬──────┘          └──────┬──────┘
                 │                         │
    ┌────────────┴────────────┐           │
    │  Auth + Security Layer  │◄──────────┘
    │  - Bearer token         │
    │  - IP allowlist         │
    │  - Rate limiting        │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │   Jules API Client      │
    │   - Retry logic         │
    │   - Timeout handling    │
    │   - Error mapping       │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │     Jules AI Service    │
    │   api.jules.ai/v1       │
    └─────────────────────────┘
```

## Core Components

### 1. Express Server ([`backend/src/server.ts`](../../backend/src/server.ts))
- Security hardening (Helmet, CORS, rate limiting)
- Single-origin static file serving from `backend/public/`
- Request ID logging (Pino structured JSON)
- Graceful shutdown handlers (SIGTERM/SIGINT)
- Health probes: `/healthz` (liveness), `/readyz` (readiness with Jules API probe)

### 2. REST API ([`docs/domains/api/`](domains/api/))
- **Sessions endpoints**: GET/POST `/api/sessions`, GET `/api/sessions/:id`
- **Activity endpoints**: GET `/api/sessions/:id/activities`
- **Control endpoints**: POST `/api/sessions/:id/approve`, POST `/api/sessions/:id/message`
- Zod schema validation for all request/response bodies
- Error mapping: Zod → 400, Jules errors → appropriate HTTP codes

### 3. WebSocket Server ([`docs/domains/websocket/`](domains/websocket/))
- Delta broadcasting with 5s polling interval
- Heartbeat ping/pong every 30s
- Backpressure protection (1MB buffer limit)
- Session diffing and change detection

### 4. Authentication ([`docs/domains/auth/`](domains/auth/))
- **REST**: `Authorization: Bearer <LOCAL_TOKEN>`
- **WebSocket**: `Sec-WebSocket-Protocol: bearer.<LOCAL_TOKEN>`
- IP allowlist for LAN exposure (CIDR prefixes)
- Rate limiting: 60 requests/minute per IP+path

### 5. Jules Integration ([`docs/domains/jules-integration/`](domains/jules-integration/))
- 10s timeout with AbortController
- Exponential backoff retry (4 attempts for 429/5xx)
- Custom `JulesHttpError` for API failures
- Secret-safe logging (no API keys in logs)

### 6. Persistence ([`docs/domains/persistence/`](domains/persistence/))
- **Optional SQLite storage** (PERSIST=1): `sql.js` in-memory with file snapshots
- **Optional webhook notifications** (NOTIFY_WEBHOOK): POST session deltas to HTTPS endpoint
- Session delta history for auditing

## Workspace Structure

```
jules-control-room/
├── backend/              # Express server implementation
│   ├── src/
│   │   ├── server.ts     # Main Express app
│   │   ├── routes/       # REST API routes
│   │   ├── auth.ts       # Authentication middleware
│   │   ├── security.ts   # IP allowlist + rate limiting
│   │   ├── julesClient.ts # Jules API wrapper
│   │   ├── ws.ts         # WebSocket delta broadcasting
│   │   ├── persistence.ts # Optional SQLite storage
│   │   ├── notifier.ts   # Optional webhook notifications
│   │   └── logging.ts    # Structured logging (Pino)
│   ├── public/           # Static files (if serving UI)
│   └── __tests__/        # Vitest test suite
├── shared/
│   └── types.ts          # Shared TypeScript DTOs
└── docs/                 # Documentation (you are here)
```

## Key Design Decisions

### Personal Tool, Not Enterprise Application
- **Single-user**: No multi-tenancy, simple bearer token auth
- **Localhost-first**: Typically runs on `localhost:3001`
- **LAN-optional**: Can expose to home network via `ALLOWLIST`
- **No scaling concerns**: No need for load balancing, clustering, etc.
- **Simple and pragmatic**: Avoid over-engineering

### Architecture Decision Records (ADRs)
- [ADR-0001: MCP Framework Selection](architecture/adr-0001-mcp-framework-selection.md) - FastMCP 2.0 chosen for MCP implementation
- [ADR-0002: Centralized LLM Router Pattern](architecture/adr-0002-centralized-llm-router.md) - Centralized router for all LLM API requests

See [`docs/architecture/roadmap.md`](architecture/roadmap.md) for future architecture plans.

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 20+ | JavaScript runtime with ESM support |
| **Language** | TypeScript (ESM) | Type-safe development |
| **Framework** | Express.js | HTTP server + middleware |
| **Validation** | Zod | Runtime schema validation |
| **Logging** | Pino | Structured JSON logging |
| **WebSocket** | ws | WebSocket server implementation |
| **Testing** | Vitest | Unit + integration testing |
| **Optional Storage** | sql.js | In-memory SQLite with snapshots |

## Security Model

**Personal Use - Single Token Authentication:**
- One `LOCAL_TOKEN` for all authentication
- Keep `LOCAL_TOKEN` private and secure
- Typically run on localhost only
- LAN exposure via `ALLOWLIST` (CIDR prefixes)
- Rate limiting prevents accidental loops (60 req/min)
- No secrets in logs (API keys and tokens filtered)

## Request Flow

### REST API Request
1. Express middleware chain: `withRequestId` → `ipAllow` → `rateLimit` → `authHttp`
2. Route handler validates request body with Zod schema
3. `julesClient` makes external API call with retry logic
4. Success returns JSON, failure caught by route error handler
5. Structured logs emitted with request ID correlation

### WebSocket Connection
1. Upgrade request authenticated via `authWs` checking `Sec-WebSocket-Protocol` header
2. Connection added to clients set, heartbeat timer enabled
3. Background poller diffs Jules sessions every 5s
4. Deltas persisted (if enabled) and broadcast to all connected clients
5. Dead connections terminated by heartbeat monitor (30s timeout)

## Error Handling

| Error Source | HTTP Status | Error Code | Retry? |
|-------------|------------|------------|--------|
| Zod validation error | 400 | `validation_error` | No |
| Jules 408 timeout | 408 | `jules_timeout` | Yes |
| Jules 429 rate limit | 429 | `jules_rate_limited` | Yes (backoff) |
| Jules 5xx server error | 502 | `jules_unavailable` | Yes |
| Other Jules errors | Original | `jules_error` | No |
| Uncaught errors | 500 | `internal_error` | No |

## Observability

- **HTTP logging**: All responses logged with status, path, elapsed time, request ID
- **Jules client logging**: Operations logged with elapsed time and status
- **WebSocket logging**: Broadcasts logged with client count and payload size
- **Error logging**: Full stack traces with secrets filtered
- **Health endpoints**:
  - `/healthz` - Liveness probe (always returns 200)
  - `/readyz` - Readiness probe (1s Jules API check)

## Module System

- **TypeScript ESM**: `"type": "module"` in package.json
- **Import extensions**: All imports use `.js` extension (TypeScript ESM requirement)
- **Node 20+ required**: Enforced via `engines` constraint

## Related Documentation

- **[Development Guide](../reference/development-guide.md)** - Setup, commands, testing
- **[Implementation Notes](../reference/implementation-notes.md)** - Design decisions and patterns
- **[Deployment Guide](../reference/deployment.md)** - Running in production
- **[Domain Documentation](../domains/)** - Deep dives into each subsystem
  - [API Domain](domains/api/) - REST endpoints
  - [WebSocket Domain](domains/websocket/) - Real-time updates
  - [Auth Domain](domains/auth/) - Security
  - [Jules Integration Domain](domains/jules-integration/) - External API
  - [Persistence Domain](domains/persistence/) - Storage & notifications
- **[Roadmap](architecture/roadmap.md)** - Future plans and milestones

## Contributing

See [Standards](standards.md) for documentation standards and [TODO](todo.md) for current tasks.

---

**Last Updated:** 2025-11-10
**Status:** Phase 0 & 1 of UI integration complete (per git history)
