---
doc_type: domain_overview
domain_code: websocket
version: 1.0.0
status: approved
owners: Backend Team
last_reviewed: 2025-11-10
---

# WebSocket Domain

## Purpose

The WebSocket domain provides real-time bidirectional communication between the Jules Control Room Backend and connected clients. It handles session delta broadcasting, connection lifecycle management, heartbeat monitoring, and backpressure protection. This domain enables live updates for session state changes without polling, providing an efficient real-time experience.

## Scope

**In Scope:**
- WebSocket server initialization and upgrade handling
- Client connection lifecycle (connect, disconnect, error)
- Heartbeat ping/pong mechanism for connection health
- Session delta detection and broadcasting
- Backpressure management (buffered data limits)
- Dead connection cleanup
- WebSocket authentication via `Sec-WebSocket-Protocol` header
- Periodic session polling and diff calculation
- Integration with persistence layer for delta storage
- Integration with notification system for webhook delivery

**Out of Scope:**
- REST API endpoints (handled by API domain)
- Session data storage (handled by Persistence domain)
- Authentication token validation logic (handled by Auth domain)
- Jules API communication (handled by Jules Integration domain)
- Webhook delivery implementation (handled by Notifier)

## Key Components

### WebSocket Server (`backend/src/ws.ts`)

Primary module managing WebSocket connections and broadcasting.

**Core Functionality:**
- Express WebSocket upgrade handling
- Client connection set management
- Heartbeat interval (30s ping/pong)
- Background session polling (5s interval)
- Delta calculation and broadcast
- Connection termination on backpressure

**Key Exports:**
```typescript
export function setupWebSocket(server: http.Server): void;
export const wsClients: Set<WebSocket>;
```

### Connection Lifecycle

**Connection Flow:**
1. Client initiates WebSocket upgrade with `Sec-WebSocket-Protocol: bearer.<token>`
2. Auth middleware validates token before upgrade
3. Connection added to `wsClients` set
4. Heartbeat monitoring enabled
5. Client receives session deltas in real-time
6. On disconnect or error, connection removed from set

**Heartbeat Mechanism:**
```typescript
// Ping every 30s
const heartbeat = setInterval(() => {
  wsClients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30_000);

// Pong response marks connection alive
ws.on('pong', () => {
  ws.isAlive = true;
});
```

### Session Polling & Delta Broadcasting

**Polling Loop:**
- Runs every 5 seconds in background
- Fetches current sessions from Jules API
- Compares with previous snapshot
- Calculates deltas (created, updated, deleted)
- Broadcasts deltas to all connected clients

**Delta Calculation:**
```typescript
interface SessionDelta {
  type: 'created' | 'updated' | 'deleted';
  sessionId: string;
  before?: JulesSession;  // undefined for 'created'
  after?: JulesSession;   // undefined for 'deleted'
  timestamp: string;
}
```

**Broadcast Flow:**
```typescript
const delta: SessionDelta = {
  type: 'updated',
  sessionId: 'sess_123',
  before: previousSession,
  after: currentSession,
  timestamp: new Date().toISOString()
};

wsClients.forEach((client) => {
  if (client.readyState === WebSocket.OPEN) {
    if (client.bufferedAmount < 1_048_576) {  // 1MB limit
      client.send(JSON.stringify(delta));
    } else {
      logger.warn('Closing slow consumer connection');
      client.terminate();
    }
  }
});
```

### Backpressure Protection

**Problem:** Slow clients can buffer unlimited data, causing memory issues.

**Solution:** Monitor `bufferedAmount` and terminate connections exceeding threshold.

```typescript
const MAX_BUFFER = 1_048_576; // 1MB

if (client.bufferedAmount > MAX_BUFFER) {
  logger.warn({ bufferedAmount: client.bufferedAmount }, 'Terminating slow consumer');
  client.terminate();
  wsClients.delete(client);
}
```

## Dependencies

### Internal Dependencies
- **Auth Module** (`backend/src/auth.ts`) - WebSocket authentication
- **Jules Client** (`backend/src/julesClient.ts`) - Session data fetching
- **Persistence** (`backend/src/persistence.ts`) - Optional delta storage
- **Notifier** (`backend/src/notifier.ts`) - Optional webhook delivery
- **Logging** (`backend/src/logging.ts`) - Structured logging
- **Shared Types** (`shared/types.ts`) - SessionDelta, JulesSession types

### External Dependencies
- **ws** (^8.14.0) - WebSocket server implementation
- **http** (Node.js built-in) - HTTP server for upgrade handling

## Related Domains

- **[Auth Domain](../auth/README.md)** - Provides WebSocket authentication via `authWs`
- **[Jules Integration Domain](../jules-integration/README.md)** - Fetches session data for delta calculation
- **[Persistence Domain](../persistence/README.md)** - Stores session deltas when enabled
- **[API Domain](../api/README.md)** - Complementary REST interface for initial data load

## Data Flow

### Connection Establishment
```
Client WebSocket Upgrade Request
  ↓
[authWs Middleware] → Validate Sec-WebSocket-Protocol
  ↓
[Upgrade Handler] → Accept Connection
  ↓
[wsClients.add()] → Add to Active Connections
  ↓
[Heartbeat Monitor] → Start Ping/Pong
  ↓
Connection Ready (receives deltas)
```

### Delta Broadcasting Flow
```
[Background Poller] (every 5s)
  ↓
[Jules Client] → GET /sessions
  ↓
[Diff Calculator] → Compare with Previous Snapshot
  ↓
[Delta Generator] → Create SessionDelta objects
  ↓
[Persistence] → Store Delta (if PERSIST=1)
  ↓
[Notifier] → POST to Webhook (if configured)
  ↓
[Broadcast] → Send to All Connected Clients
  ↓
[Backpressure Check] → Terminate Slow Consumers
```

### Heartbeat Flow
```
[Heartbeat Timer] (every 30s)
  ↓
For Each Client:
  ├─ isAlive = false? → Terminate Connection
  └─ isAlive = true → Set false, Send Ping
  ↓
[Client Pong Response]
  ↓
[ws.on('pong')] → Set isAlive = true
```

## Protocol Specification

### Connection URL
```
ws://localhost:3001/
```

### Authentication Header
```
Sec-WebSocket-Protocol: bearer.<LOCAL_TOKEN>
```

Example:
```
Sec-WebSocket-Protocol: bearer.secret-token-12345
```

### Message Format

**Server → Client (Session Delta):**
```json
{
  "type": "created",
  "sessionId": "sess_abc123",
  "after": {
    "id": "sess_abc123",
    "repository": "owner/repo",
    "branch": "main",
    "planStatus": "pending",
    "approval": { "state": "pending" },
    "participants": [],
    "createdAt": "2025-11-10T12:00:00Z"
  },
  "timestamp": "2025-11-10T12:00:00Z"
}
```

**Server → Client (Session Update):**
```json
{
  "type": "updated",
  "sessionId": "sess_abc123",
  "before": {
    "id": "sess_abc123",
    "planStatus": "pending",
    "approval": { "state": "pending" }
  },
  "after": {
    "id": "sess_abc123",
    "planStatus": "in_progress",
    "approval": { "state": "approved", "approvedAt": "2025-11-10T12:05:00Z" }
  },
  "timestamp": "2025-11-10T12:05:00Z"
}
```

**Server → Client (Session Deletion):**
```json
{
  "type": "deleted",
  "sessionId": "sess_abc123",
  "before": {
    "id": "sess_abc123",
    "planStatus": "succeeded",
    "approval": { "state": "approved" }
  },
  "timestamp": "2025-11-10T12:30:00Z"
}
```

**Server → Client (Ping Frame):**
```
WebSocket Ping (opcode 0x9)
```

**Client → Server (Pong Frame):**
```
WebSocket Pong (opcode 0xA)
```

### Delta Types

| Type      | Description                        | Fields                      |
|-----------|------------------------------------|-----------------------------|
| `created` | New session detected               | `type`, `sessionId`, `after`, `timestamp` |
| `updated` | Existing session changed           | `type`, `sessionId`, `before`, `after`, `timestamp` |
| `deleted` | Session removed or completed       | `type`, `sessionId`, `before`, `timestamp` |

## Testing

### Test Coverage
- **Location:** `backend/src/__tests__/ws.test.ts`
- **Framework:** Vitest with ws client library
- **Coverage Target:** Connection lifecycle, heartbeat, broadcasting, backpressure

### Key Test Scenarios

1. **Connection Authentication:**
   - Valid token in `Sec-WebSocket-Protocol`
   - Invalid token rejection
   - Missing token rejection

2. **Heartbeat Monitoring:**
   - Ping sent every 30s
   - Pong response keeps connection alive
   - Missing pong terminates connection

3. **Delta Broadcasting:**
   - Session creation broadcast
   - Session update broadcast
   - Session deletion broadcast
   - Multiple clients receive same delta

4. **Backpressure Protection:**
   - Slow consumer termination
   - Buffer limit enforcement (1MB)
   - Fast consumers unaffected

5. **Connection Lifecycle:**
   - Clean disconnect
   - Error handling
   - Client removal from set

### Test Examples

```typescript
describe('WebSocket Server', () => {
  it('accepts connection with valid token', async () => {
    const ws = new WebSocket('ws://localhost:3001', {
      headers: { 'Sec-WebSocket-Protocol': `bearer.${LOCAL_TOKEN}` }
    });

    await new Promise((resolve) => ws.on('open', resolve));
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it('broadcasts session delta to all clients', async () => {
    const ws1 = await connectClient();
    const ws2 = await connectClient();

    const delta = {
      type: 'created',
      sessionId: 'sess_123',
      after: { id: 'sess_123', /* ... */ },
      timestamp: new Date().toISOString()
    };

    const received1 = new Promise((resolve) => ws1.on('message', resolve));
    const received2 = new Promise((resolve) => ws2.on('message', resolve));

    // Trigger delta broadcast
    await triggerSessionChange();

    const msg1 = JSON.parse(await received1);
    const msg2 = JSON.parse(await received2);

    expect(msg1).toEqual(delta);
    expect(msg2).toEqual(delta);
  });

  it('terminates connection on heartbeat timeout', async () => {
    const ws = await connectClient();

    // Mock pong not responding
    ws.pong = () => {}; // No-op

    await sleep(35_000); // Wait for heartbeat + buffer

    expect(ws.readyState).toBe(WebSocket.CLOSED);
  });
});
```

## Configuration

### Environment Variables
- **PERSIST** - Enable delta persistence (default: unset/disabled)
- **NOTIFY_WEBHOOK** - Webhook URL for delta notifications (default: unset)
- **JULES_API_BASE** - Jules API base URL for session fetching
- **NODE_ENV** - Environment mode affects logging verbosity

### Server Configuration
```typescript
// backend/src/server.ts
import { setupWebSocket } from './ws.js';

const server = app.listen(PORT);
setupWebSocket(server);
```

### Polling Interval
```typescript
// backend/src/ws.ts
const POLL_INTERVAL = 5_000; // 5 seconds
const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const MAX_BUFFER = 1_048_576; // 1MB
```

## Monitoring & Observability

### Logging

**Connection Events:**
```json
{
  "level": "info",
  "time": "2025-11-10T12:00:00.000Z",
  "msg": "WebSocket client connected",
  "clientCount": 3
}
```

**Delta Broadcast:**
```json
{
  "level": "info",
  "time": "2025-11-10T12:05:00.000Z",
  "msg": "Broadcasting session delta",
  "type": "updated",
  "sessionId": "sess_abc123",
  "clientCount": 3,
  "payloadSize": 512
}
```

**Heartbeat Termination:**
```json
{
  "level": "warn",
  "time": "2025-11-10T12:10:00.000Z",
  "msg": "Terminating dead connection",
  "reason": "heartbeat_timeout"
}
```

**Backpressure Termination:**
```json
{
  "level": "warn",
  "time": "2025-11-10T12:15:00.000Z",
  "msg": "Terminating slow consumer",
  "bufferedAmount": 1048576,
  "reason": "backpressure_limit"
}
```

### Metrics to Track
- Active connection count
- Delta broadcast frequency
- Average payload size
- Heartbeat timeout rate
- Backpressure termination rate
- Session poll duration
- Delta calculation time

## Performance Considerations

### Memory Management
- Fixed client set (no unbounded growth)
- Backpressure protection prevents buffer overflow
- Dead connection cleanup via heartbeat
- Snapshot diffing uses shallow comparison

### Network Efficiency
- Only deltas sent (not full sessions)
- JSON payloads gzipped at transport layer
- Heartbeat uses minimal ping/pong frames
- No unnecessary broadcasts (only on change)

### Scalability Limits
- Single-process design (no clustering)
- Recommended max: 100 concurrent connections
- Personal tool context (1-5 typical connections)
- No horizontal scaling required

## Security Considerations

### Authentication
- Token validation before upgrade
- Per-connection authentication
- No anonymous connections allowed
- Token transmitted in subprotocol header (not query string)

### Data Exposure
- Only authenticated clients receive deltas
- No broadcast to unauthenticated connections
- Session data filtered by permissions (future)

### DoS Protection
- Backpressure limits prevent memory exhaustion
- Heartbeat prevents zombie connections
- Rate limiting at transport layer (future)

### TLS/SSL
- Production requires WSS (WebSocket Secure)
- Localhost development uses WS (unencrypted)
- Certificate management via reverse proxy (nginx/Caddy)

## Future Enhancements

### Planned Features

1. **Client-to-Server Messages:**
   - Allow clients to send commands via WebSocket
   - Bidirectional RPC-style communication
   - Reduces need for REST API calls

2. **Selective Subscriptions:**
   - Clients subscribe to specific sessions
   - Filtered deltas based on subscription
   - Reduces unnecessary broadcasts

3. **Compression:**
   - Per-message deflate extension
   - Reduce bandwidth for large deltas
   - Configurable compression threshold

4. **Reconnection Support:**
   - Session ID persistence across reconnects
   - Delta replay from last received timestamp
   - Exponential backoff for reconnect attempts

5. **Metrics Endpoint:**
   - Expose connection count via REST API
   - Client list with connection duration
   - Broadcast statistics

### Potential Optimizations

1. **Binary Protocol:**
   - Replace JSON with MessagePack or Protocol Buffers
   - Reduce payload size by 30-50%
   - Faster serialization/deserialization

2. **Delta Compression:**
   - Send only changed fields in updates
   - JSON Patch (RFC 6902) format
   - Further reduce bandwidth

3. **Batching:**
   - Batch multiple deltas in single message
   - Reduce message overhead
   - Configurable batch window (100ms)

4. **Load Shedding:**
   - Graceful degradation under high load
   - Prioritize important deltas
   - Drop low-priority updates when overloaded

## Known Limitations

1. **No Message History:**
   - Clients joining mid-session miss previous deltas
   - Must fetch full state via REST API on connect
   - No replay mechanism

2. **No Authentication Refresh:**
   - Token validated only on connection
   - Long-lived connections vulnerable to revoked tokens
   - Requires periodic reconnection or token refresh mechanism

3. **Single-Process Only:**
   - Cannot scale horizontally with current design
   - Sticky sessions required for load balancing
   - Clustering requires Redis pub/sub or similar

4. **No Message Ordering Guarantees:**
   - Deltas broadcast in detection order
   - Race conditions possible with rapid changes
   - Clients must handle out-of-order updates

## Troubleshooting

### Common Issues

**Issue:** Clients not receiving deltas
- **Cause:** Session polling failure or Jules API down
- **Solution:** Check Jules API connectivity, review logs for errors

**Issue:** Connection drops frequently
- **Cause:** Heartbeat timeout or network instability
- **Solution:** Increase heartbeat interval, check network stability

**Issue:** High memory usage
- **Cause:** Slow consumers buffering data
- **Solution:** Verify backpressure termination, check buffer limits

**Issue:** Authentication failures
- **Cause:** Invalid token or incorrect header format
- **Solution:** Verify `Sec-WebSocket-Protocol: bearer.<token>` format

### Debug Commands

**Check active connections:**
```typescript
// In Node REPL or debug endpoint
console.log('Active connections:', wsClients.size);
```

**Monitor broadcast activity:**
```typescript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';
```

**Inspect client buffer:**
```typescript
wsClients.forEach(client => {
  console.log('Buffered:', client.bufferedAmount);
});
```

## Change Log

| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| 1.0.0   | 2025-11-10 | Initial domain overview documentation        |

## Additional Resources

- **[WebSocket Testing Guide](../../guides/testing/websocket-testing.md)** - Testing strategies for real-time connections
- **[Real-time Patterns](../../guides/patterns/realtime-communication.md)** - Best practices for WebSocket architecture
- **[RFC 6455](https://tools.ietf.org/html/rfc6455)** - WebSocket Protocol specification
- **[ws Library Documentation](https://github.com/websockets/ws)** - WebSocket server library reference
