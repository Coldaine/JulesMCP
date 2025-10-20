# Frontend ↔ Backend Reconciliation and MCP Decision (Oct 2025)

This note aligns the current frontend prototype with the existing backend and answers whether a rewrite to an MCP framework is required.

## Summary

- Day 1: No backend rewrite is required. Keep the existing Express proxy as-is, wire the UI to it, and defer experimental/MCP features.
- Day 2+: Add an MCP sidecar or incremental adapter if/when we need tool/resource semantics for agent integrations. Prefer Official SDK (TS/Python) or FastMCP; no full rewrite needed.
- UI surface stays intact: retain every existing control/component even when backend support is pending, and label those gaps as aspirational rather than removing UI affordances.
- Scope: All implementation work lands in this JulesMCP repository; the checked-in `Julescontrolroomui/` prototype is our staging ground, and we will lift whatever code we need from it into the live app rather than relying on an external repo.

## Current Backend: What we have

- Runtime: Express on Node with security middleware (helmet, CORS, rate limiting, IP allowlist) and request IDs.
- HTTP API (under `/api`):
  - GET `/sessions` — list sessions
  - POST `/sessions` — create session
  - GET `/sessions/:id` — get session
  - GET `/sessions/:id/activities` — list activities
  - POST `/sessions/:id/approve` — approve
  - POST `/sessions/:id/message` — send message
- WS bridge: `/ws` (server-side polling every 5s to push session deltas to clients). Auth via `Sec-WebSocket-Protocol: bearer.<token>`.
- Jules client: Thin proxy to external Jules API with retries, timeouts, and partial error translation.
- Auth: Simple bearer token (`LOCAL_TOKEN`) for both HTTP and WS.
- Persistence/notifications hooks exist but are optional.

Notes:
- The backend primarily passes through Jules responses; it doesn’t transform payloads.
- Type definitions in `shared/` are simplified and do not match Jules v1alpha exactly (see gaps below) but do not affect runtime behavior.


## Frontend: What it expects

- UI types reflect Jules v1alpha concepts (`state` like QUEUED/PLANNING/etc., `name: "sessions/{id}"`, `createTime`, `updateTime`, `sourceContext`, etc.).
- A conversion layer exists (`/src/lib/jules-api-types.ts`):
  - `julesSessionToSession()` maps Jules responses to the UI’s `Session` type.
  - `julesActivityToActivity()` maps activities likewise.
- Proposed API client (in `INTEGRATION_GUIDE.md`) calls the backend under `/api/*` and converts responses on the client side.
- Real-time updates: The guide recommends polling; the backend can optionally offer WS pushes.

## Mapping: Endpoints and payloads

- UI → Backend
  - GET `/api/sessions` → passthrough to Jules list; frontend converts with `julesSessionToSession()`.
  - POST `/api/sessions` → passthrough create; frontend converts response.
  - GET `/api/sessions/:id` → passthrough get; frontend converts response.
  - GET `/api/sessions/:id/activities` → passthrough list; frontend converts each activity.
  - POST `/api/sessions/:id/approve` → backend proxies to Jules `:approve` action.
  - POST `/api/sessions/:id/message` → backend proxies to Jules `:sendMessage` action.
- Real-time
  - Optional frontend WS client can subscribe to `/ws` for `session_update` deltas pushed by the backend’s internal 5s poller.

## Gaps to track (non-blocking for Day 1)

1) Type mismatch
   - Backend TypeScript types in `shared/` use simplified keys (e.g., `planStatus`, `approval`) differing from Jules v1alpha fields. Runtime is fine because we pass through responses, but the types are misleading.
   - Day 2 fix: Either (a) align `shared/` to Jules v1alpha and/or (b) formalize server-side mapping if we want the backend to return the UI’s `Session` shape directly.

2) Base URL/version assurance
   - Frontend docs refer to `v1alpha`; backend default base is `https://api.jules.ai/v1` with `X-Goog-Api-Key` header support. Confirm the canonical base/version and set via `JULES_API_BASE` env.

3) Cancel session
   - Not implemented; Jules method unclear. Keep the Cancel UI disabled or toast-only until confirmed with the Jules team.

4) Plan content location
   - Plan likely appears as an activity of type PLAN rather than on the session. UI already accommodates this via activities; ensure we surface first PLAN activity in the plan tab (client-side).

5) Filtering/pagination
   - Jules query capability may be limited; do client-side filtering for now. Backend exposes `status`/`repo` filters but can remain best-effort.

6) Action endpoint style (colon vs slash)
   - The backend currently targets slash-form actions to Jules (`/sessions/{id}/approve`, `/sessions/{id}/message`) as implemented in `backend/src/julesClient.ts`. Some documentation and ecosystems prefer colon-form actions (`/sessions/{id}:approve`, `/sessions/{id}:sendMessage`). Confirm the canonical Jules paths; if colon-form is required, adjust the backend client accordingly. Tests in `backend/src/__tests__/routes.test.ts` validate the slash form today.

7) Persistence type assumption
   - If you enable persistence (`PERSIST=1`), SQLite upserts expect `updatedAt` on sessions per `shared/types.ts`. Jules v1alpha returns `updateTime`. Until types are aligned or a mapping is added, keep persistence disabled to avoid NOT NULL constraint failures during writes.

## Decision: Do we need to rewrite the backend with an MCP framework?

Short answer: No, not for Day 1.

- The existing Express backend already provides the required endpoints, security posture, and a WS bridge. It is sufficient to support the full current UI once wired.
- Rewriting to an MCP framework would add scope without near-term UI benefit. The UI consumes a simple REST proxy and client-side mapping today.

When would we add MCP?

- Day 2+: If/when we need standardized tool/resource definitions for multi-agent orchestration, context sharing, or to plug into broader agent ecosystems, add an MCP “sidecar” service rather than rewriting the proxy.
- Prefer:
  - Official SDK (TypeScript) if we want to stay in the current stack and keep tight control over protocol details.
  - FastMCP (Python/TS) if we want rapid server scaffolding with session/state conveniences.
- Reserve specialized stacks for specific constraints:
  - Strands SDK (Python) for model-driven/typed schemas across agents.
  - Shuttle MCP (Rust) for ultra-low latency or infra-heavy concurrency needs.
  - Higress MCP (Go) for enterprise proxy/routing with multi-tenancy at scale.

Architecture approach for MCP (Day 2)

- Keep Express proxy for UI/auth.
- Run MCP server as a separate process/service that exposes tools/resources mapped to our backend or directly to Jules/GitHub/etc.
- Bridge: The backend can call MCP locally (or vice versa) to fetch context or trigger tools, while the UI continues to call the backend.
- This avoids lock-in and mitigates risk; no big-bang rewrite required.

## Day 1 plan (ship the UI with current backend)

1) Wire the frontend to call the backend
   - Implement `/src/lib/api-client.ts` per `INTEGRATION_GUIDE.md` against `/api/*`.
   - Use Authorization: `Bearer <LOCAL_TOKEN>` in every request (and `Sec-WebSocket-Protocol` bearer for WS if used).

2) Client-side mapping
   - Convert Jules responses on the client with `julesSessionToSession()` and `julesActivityToActivity()`.

3) Polling or WS updates
   - Start with 3–5s polling for active sessions. Optionally add WS to receive `session_update` messages from the backend.

4) Hardening
   - Confirm `JULES_API_BASE` and `JULES_API_KEY` in backend `.env` and CORS origins.
   - Keep Cancel disabled until the Jules API method is confirmed.

5) UI surface continuity
   - Keep all UI elements (Approve, Cancel, plan preview, analytics placeholders, etc.) visible so stakeholders see the full product vision.
   - Clearly mark flows that lack backend support as “Coming soon” or similar so expectations stay aligned without hiding functionality.

### Variant: MCP is required Day 1 (for local model routing)

If you plan to route requests from local models or IDE/chat agents immediately, add an MCP sidecar now (still no rewrite):

- Keep the Express proxy exactly as-is for the UI and HTTP/WS.
- Stand up a separate MCP server (Official SDK TS preferred for consistency) that exposes tools/resources which internally call the existing backend functions in `backend/src/julesClient.ts`.
- Suggested tools (names are illustrative):

      - `create_session` (input: repo, branch, prompt, requirePlanApproval) → `createSession()`
      - `list_sessions` (input: optional status/repo) → `listSessions()`
      - `get_session` (input: id) → `getSession()`
      - `list_activities` (input: sessionId) → `listActivities()`
      - `approve_session` (input: id) → `approveSession()`
      - `send_message` (input: id, content) → `sendMessage()`

- Suggested resources:

      - `resource:sessions/{id}` (read-only session resource)
      - `resource:sessions/{id}/activities` (stream/paginated activity feed)
- Transport: MCP WS preferred; SSE optional where supported.
- Auth: Reuse LOCAL_TOKEN or introduce per-client tokens; enforce rate limits similar to HTTP.
- Placement: Run as a sibling process (e.g., `backend/src/mcp/server.ts`), separate port/process for clear isolation.
- Schema: Describe inputs/outputs via JSON Schema (or zod schemas compiled to JSON Schema) to give agents strong typing.

Acceptance (MCP-now):

   - Local models/agent clients can connect to the MCP server and discover the tools/resources above.
   - Invoking a tool triggers the same underlying operations as the REST proxy (no behavior drift).
   - The UI continues to work unchanged via REST.

## Day 2 (and later) items

- Types alignment: Update `shared/` to match Jules v1alpha or introduce server-side mapping to the UI’s `Session` type.
- MCP sidecar: Add MCP using Official SDK or FastMCP to enable cross-agent tooling and standardized context/resources.
- GitHub analytics + RAG pages: Implement when backends are ready (separate services, keep scope isolated).
- Auth upgrade: Replace `LOCAL_TOKEN` with OAuth/JWT and per-user auth.
- Observability: Metrics, tracing, and better retry/backoff tuning.

## Acceptance criteria for Day 1

- Frontend shows real sessions via backend proxy.
- Create, approve, message flows work against the backend.
- UI updates in near real-time via polling (and/or WS optional).
- No MCP rebuild required; experimental features clearly marked as Day 2+.
- Nonfunctional UI controls are still present but visibly tagged as upcoming so the UX roadmap remains clear.
