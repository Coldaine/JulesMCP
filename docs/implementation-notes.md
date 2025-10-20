# Jules Control Room – Implementation Notes

## Backend Highlights

- **Single-origin Express server** with helmet hardening, request-ID logging, and unified routing under `/api`.
- **Strict authentication**: REST uses `Authorization: Bearer <LOCAL_TOKEN>`, WebSocket upgrades require `Sec-WebSocket-Protocol: bearer.<token>`.
- **LAN-aware security**: `ipAllow` middleware enforces prefix allow lists and per-path rate limiting (60 req/min).
- **Schema-first contracts**: All request/response bodies validated with Zod, wired to shared DTOs in `shared/types.ts`.
- **Jules client**: hardened fetch with 10s timeout, exponential backoff retries, structured error surfacing, and secret-safe logging.
- **Observability**: `/healthz`, `/readyz`, structured JSON logs via Pino, and deterministic request IDs.
- **Resilient WebSockets**: heartbeat ping/pong every 30s, backpressure protection (`4002` close), background diff poller (5s cadence), optional webhook notifier, and persistence hook.
- **Optional persistence**: `PERSIST=1` enables a lightweight `sql.js` store that snapshots session history to `data/sessions.sqlite`.
- **Container ready**: multi-stage Dockerfile (Node 20), healthcheck, non-root runtime, and compose stack with environment wiring.

## Testing Strategy

Vitest covers:

1. **Auth guards** – HTTP/WS token enforcement.
2. **Security middlewares** – allow list and rate limiting behaviour.
3. **Jules client** – retry/backoff and timeout handling (nock mocks).
4. **REST integration** – create → approve → message → activities round-trip via mocked Jules API.
5. **WebSocket flow** – live diff broadcasts, heartbeat pings, and protocol negotiation.

Set `npm run test` after installing dependencies to execute the full suite.

## Extensibility Hooks

- `shared/types.ts` exposes DTOs for future front-end packages.
- `notifyDelta` posts session deltas to `NOTIFY_WEBHOOK` without leaking payload secrets.
- Persistence + notifier modules are completely optional and disabled unless explicitly configured.

## Deployment Checklist

1. Provide production secrets (`JULES_API_KEY`, `LOCAL_TOKEN`).
2. Populate `ALLOWLIST` when exposing beyond localhost.
3. Decide on persistence (`PERSIST=1`) and map the `data/` volume.
4. Set `NOTIFY_WEBHOOK` if external notifications are desired.
5. Build the container with `docker compose build` and run `docker compose up -d`.
