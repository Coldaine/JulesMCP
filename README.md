# Jules Control Room Backend

Secure, single-origin backend for orchestrating Jules sessions with strict auth, resilient WebSockets, and observability baked in.

## Repository Layout

```
jules-control-room/
  backend/
    src/
      server.ts
      routes/
      auth.ts
      security.ts
      julesClient.ts
      ws.ts
      logging.ts
    public/
  shared/
    types.ts
```

## Prerequisites

- Node.js 20+
- npm 9+
- Optional: Docker & Docker Compose

## Getting Started

```bash
npm install
cp backend/.env.example backend/.env
# edit backend/.env with real tokens before running in production

# Start the API + WebSocket server with hot reload
npm run dev
```

Core npm scripts are proxied through the root workspace:

- `npm run build` – compile TypeScript to `backend/dist`
- `npm run start` – run the compiled server
- `npm run lint` – ESLint with Prettier formatting rules
- `npm run typecheck` – strict TypeScript checking
- `npm run test` – Vitest unit + integration suite

## Environment Variables (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `JULES_API_KEY` | Jules service key, injected into outbound API calls |
| `LOCAL_TOKEN` | Bearer token required for both REST and WebSocket clients |
| `PORT` | Listening port (defaults to `3001`) |
| `ALLOWLIST` | Comma-separated CIDR prefixes for LAN exposure (empty = localhost only) |
| `CORS_ORIGIN` | Explicit origins when serving a remote UI (unset keeps single-origin mode) |
| `PERSIST` | Set to `1` to enable optional SQLite history (`sql.js`) |
| `NOTIFY_WEBHOOK` | Optional HTTPS endpoint notified on session deltas |

**Never** expose the backend without a strong `LOCAL_TOKEN`, firewall rules, and an explicit `ALLOWLIST`.

## Security & Networking

- Unified origin: static assets can be served from `backend/public/` to avoid CORS.
- REST auth: `Authorization: Bearer <LOCAL_TOKEN>`.
- WebSocket auth: `Sec-WebSocket-Protocol: bearer.<LOCAL_TOKEN>`.
- Rate limiting: 60 requests/minute per IP+path.
- LAN mode: only prefixes in `ALLOWLIST` are accepted.
- No secrets in logs: request bodies, headers, and env values are excluded.

## Observability

- `GET /healthz` – liveness probe.
- `GET /readyz` – 1s Jules API probe.
- Structured logs (Pino) with request IDs for every HTTP response.

## Testing

```
npm run test
```

The suite covers auth middleware, security guards, HTTP schema validation, Jules client retry/backoff logic, integration flows (create → approve → message → activities), and WebSocket heartbeats/delta broadcasts.

## Docker

Build and run the containerised backend:

```bash
docker compose build
docker compose up -d
```

Environment variables are sourced from your shell. The image exposes `3001` and ships with a healthcheck hitting `/healthz`.

If `NOTIFY_WEBHOOK` is set, each session delta is posted to that HTTPS endpoint (headers/body redacted of secrets by default).

Persistent session history (when `PERSIST=1`) is written under `/app/data/sessions.sqlite`. Mount the `data/` volume to keep history between restarts.

## Demo Flow

A scripted Vitest integration test (`routes.test.ts`) mocks the Jules API to create a session, approve it, send a message, and read back activities. The WebSocket test (`ws.test.ts`) verifies heartbeats and diff broadcasts.
