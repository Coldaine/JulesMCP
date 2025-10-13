# Jules Control Room Examples

Quick snippets for exercising the backend.

## Prerequisites

1. Install dependencies (`npm install`) after setting up access to the private npm registry.
2. Copy `backend/.env.example` to `backend/.env` and set at least `LOCAL_TOKEN` and `JULES_API_KEY`.
3. Start the backend (`npm run dev` for hot reload or `npm run start` after `npm run build`).

Set the following environment variables for the examples:

```bash
export BASE_URL="http://localhost:3001"
export LOCAL_TOKEN="local-dev-token"
```

## 1. REST Walkthrough (`api-example.sh`)

Runs a happy-path flow:

1. Health and readiness probes
2. Create a session
3. List sessions
4. Approve a session
5. Send a message
6. Fetch activities
7. Demonstrate auth failure

```bash
./examples/api-example.sh
```

## 2. TypeScript REST Snippets (`client-example.ts`)

Illustrates calling the REST API with `fetch` (Node 20+) and strong typing.

```bash
npx tsx examples/client-example.ts
```

## 3. WebSocket Listener (`websocket-example.ts`)

Connects to `/ws` using the `bearer.<token>` subprotocol, prints heartbeats, and echoes incoming deltas.

```bash
npx tsx examples/websocket-example.ts
```

> 💡 The examples assume the backend is running locally with `LOCAL_TOKEN`. Adjust `BASE_URL` as needed for LAN deployments.
