# Jules Control Room Backend

**Personal AI development control center** - Secure backend for orchestrating Jules AI coding sessions with real-time monitoring, WebSocket updates, and complete session control.

> **Note:** This is a **single-user personal tool** designed for individual developers working with Jules AI. It's not intended for multi-user deployments or enterprise use.

## 📚 Documentation

**→ See [docs/INDEX.md](./docs/INDEX.md) for complete documentation**

Quick links:

- **[Development Guide](./docs/reference/development-guide.md)** - Architecture, setup, and workflow
- **[Personal Deployment](./docs/reference/deployment.md)** - Running on your local machine or home server
- **[Code Quality](./docs/linting.md)** - Linting and quality standards
- **[Scope Update](./docs/SCOPE_UPDATE.md)** - Constraints for this solo-use tool

---

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
- Optional: Docker (for containerized personal deployment)

## Getting Started

**This is a personal tool - it runs on your machine or home server:**

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
- `npm run lint` – ESLint check
- `npm run lint:fix` – **auto-fix** all linting issues (imports, formatting, etc.)
- `npm run typecheck` – strict TypeScript checking
- `npm run test` – Vitest unit + integration suite

> **🎉 Auto-linting enabled!** Code auto-fixes on save and on commit. See [docs/linting.md](./docs/linting.md) for details.

## Environment Variables (`backend/.env`)

| Variable         | Purpose                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| `JULES_API_KEY`  | Jules service key, injected into outbound API calls                        |
| `LOCAL_TOKEN`    | Bearer token required for both REST and WebSocket clients                  |
| `PORT`           | Listening port (defaults to `3001`)                                        |
| `ALLOWLIST`      | Comma-separated CIDR prefixes for LAN exposure (empty = localhost only)    |
| `CORS_ORIGIN`    | Explicit origins when serving a remote UI (unset keeps single-origin mode) |
| `PERSIST`        | Set to `1` to enable optional SQLite history (`sql.js`)                    |
| `NOTIFY_WEBHOOK` | Optional HTTPS endpoint notified on session deltas                         |

**Personal use note:** Keep `LOCAL_TOKEN` private. Only expose beyond localhost if you need to access from other devices on your home network.

## Security & Networking

**Single-user security model** (you control access):

- REST auth: `Authorization: Bearer <LOCAL_TOKEN>` (set your own token)
- WebSocket auth: `Sec-WebSocket-Protocol: bearer.<LOCAL_TOKEN>`
- Rate limiting: 60 requests/minute (prevents accidental loops)
- LAN mode: Optionally expose to your local network via `ALLOWLIST`
- No secrets in logs: API keys and tokens are filtered

**Typical usage:** Run locally on `localhost:3001` with no external exposure.

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

---

## More Information

See the [Documentation Index](./docs/INDEX.md) for:

- Architecture details
- Deployment guides
- Testing strategies
- Solo-tool scope notes (no public examples provided)

## Contributing

We welcome contributions to the Jules Control Room Backend! Please refer to our [Documentation Standards](./docs/standards.md) for guidelines on code quality and documentation.

### How to Contribute

1.  **Check the To-Do List**: See `docs/todo.md` for current tasks and priorities.
2.  **Fork the Repository**: Create your own fork on GitHub.
3.  **Create a Feature Branch**: Branch off `main` for your changes.
4.  **Develop and Test**: Implement your changes and ensure all tests pass (`npm run test`).
5.  **Lint and Typecheck**: Run `npm run lint:fix` and `npm run typecheck`.
6.  **Submit a Pull Request**: Follow the guidelines in `docs/playbooks/organizational/pr_playbook.md`.

### Code Quality Standards

All code must pass:

- ✅ Linting: `npm run lint`
- ✅ Type checking: `npm run typecheck`
- ✅ Tests: `npm run test`

Auto-fix is enabled for linting (see [Linting Guide](./docs/linting.md)).

### Documentation Standards

- Keep README minimal (overview + quick start only)
- Detailed docs go in `/docs/`
- Use clear headings and concise explanations
- Link between related documents
