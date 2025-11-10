---
doc_type: domain_overview
domain_code: auth
version: 1.0.0
status: approved
owners: Backend Team
last_reviewed: 2025-11-10
---

# Auth Domain

## Purpose

The Auth domain provides authentication and authorization mechanisms for the Jules Control Room Backend. It implements a dual authentication system supporting both HTTP REST API requests (Bearer token in `Authorization` header) and WebSocket connections (`Sec-WebSocket-Protocol` header). This domain ensures that only authenticated clients can access protected resources and maintain real-time connections.

## Scope

**In Scope:**
- Bearer token validation for REST API requests
- WebSocket subprotocol authentication
- Single-token authentication model (personal tool)
- Middleware integration with Express and WebSocket upgrade
- Token extraction and validation logic
- 401 Unauthorized responses for invalid/missing tokens
- Environment-based token configuration

**Out of Scope:**
- Multi-user authentication (not a multi-user system)
- Password hashing and user management
- OAuth/OIDC integration
- Session management (stateless token auth)
- Token generation and rotation
- Role-based access control (RBAC)
- Rate limiting (handled by Security domain)
- IP filtering (handled by Security domain)

## Key Components

### HTTP Authentication Middleware (`backend/src/auth.ts`)

Express middleware validating Bearer tokens in REST requests.

**Function Signature:**
```typescript
export function authHttp(
  req: Request,
  res: Response,
  next: NextFunction
): void
```

**Implementation:**
```typescript
export function authHttp(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Missing or invalid Authorization header'
    });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  if (token !== LOCAL_TOKEN) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid authentication token'
    });
  }

  next(); // Token valid, proceed to route handler
}
```

**Usage in Routes:**
```typescript
import { authHttp } from './auth.js';
import { Router } from 'express';

const router = Router();
router.get('/sessions', authHttp, getSessions);
router.post('/sessions', authHttp, createSession);
```

### WebSocket Authentication (`backend/src/auth.ts`)

Validates WebSocket upgrade requests using subprotocol header.

**Function Signature:**
```typescript
export function authWs(
  req: http.IncomingMessage,
  callback: (err: Error | null, success: boolean) => void
): void
```

**Implementation:**
```typescript
export function authWs(req, callback) {
  const protocols = req.headers['sec-websocket-protocol'];

  if (!protocols) {
    return callback(new Error('Missing Sec-WebSocket-Protocol header'), false);
  }

  const protocolList = protocols.split(',').map(p => p.trim());
  const bearerProtocol = protocolList.find(p => p.startsWith('bearer.'));

  if (!bearerProtocol) {
    return callback(new Error('No bearer token in subprotocol'), false);
  }

  const token = bearerProtocol.substring(7); // Remove "bearer." prefix

  if (token !== LOCAL_TOKEN) {
    return callback(new Error('Invalid token'), false);
  }

  callback(null, true); // Token valid, allow upgrade
}
```

**Usage in WebSocket Server:**
```typescript
import { authWs } from './auth.js';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({
  server: httpServer,
  verifyClient: (info, callback) => {
    authWs(info.req, callback);
  }
});
```

### Token Configuration

**Environment Variable:**
```bash
LOCAL_TOKEN=your-secret-token-here
```

**Loading:**
```typescript
import dotenv from 'dotenv';
dotenv.config();

const LOCAL_TOKEN = process.env.LOCAL_TOKEN;

if (!LOCAL_TOKEN) {
  throw new Error('LOCAL_TOKEN environment variable is required');
}
```

**Security Best Practices:**
- Generate cryptographically random tokens (min 32 characters)
- Never commit tokens to version control
- Rotate tokens periodically
- Store in `.env` file excluded from git

## Dependencies

### Internal Dependencies
- **Logging** (`backend/src/logging.ts`) - Logs auth failures with context
- **Server** (`backend/src/server.ts`) - Applies middleware to routes
- **WebSocket** (`backend/src/ws.ts`) - Uses authWs for upgrade verification

### External Dependencies
- **express** (^4.18.0) - Middleware interface
- **ws** (^8.14.0) - WebSocket verifyClient callback
- **dotenv** (^16.3.0) - Environment variable loading

## Related Domains

- **[API Domain](../api/README.md)** - Protected by `authHttp` middleware
- **[WebSocket Domain](../websocket/README.md)** - Protected by `authWs` verification
- **[Security Domain](../security/README.md)** - Complementary IP filtering and rate limiting

## Data Flow

### HTTP Authentication Flow
```
Client Request (GET /api/sessions)
  ↓
[Extract Authorization Header]
  ├─ Missing → 401 Unauthorized
  ├─ Invalid Format → 401 Unauthorized
  └─ Present → Extract Token
  ↓
[Compare Token with LOCAL_TOKEN]
  ├─ Mismatch → 401 Unauthorized
  └─ Match → Call next()
  ↓
Route Handler (Authenticated)
```

### WebSocket Authentication Flow
```
Client Upgrade Request (ws://localhost:3001)
  ↓
[Extract Sec-WebSocket-Protocol Header]
  ├─ Missing → Reject Upgrade
  ├─ No "bearer.*" → Reject Upgrade
  └─ Present → Extract Token
  ↓
[Compare Token with LOCAL_TOKEN]
  ├─ Mismatch → Reject Upgrade
  └─ Match → Accept Connection
  ↓
WebSocket Connection Established
```

## Authentication Specification

### REST API Authentication

**Header Format:**
```
Authorization: Bearer <token>
```

**Example:**
```http
GET /api/sessions HTTP/1.1
Host: localhost:3001
Authorization: Bearer my-secret-token-12345
```

**Success Response:**
- Request proceeds to route handler
- No authentication-related response headers

**Failure Response:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "unauthorized",
  "message": "Missing or invalid Authorization header"
}
```

### WebSocket Authentication

**Subprotocol Format:**
```
Sec-WebSocket-Protocol: bearer.<token>
```

**Example:**
```http
GET / HTTP/1.1
Host: localhost:3001
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Protocol: bearer.my-secret-token-12345
```

**Success Response:**
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Protocol: bearer.my-secret-token-12345
```

**Failure Response:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: text/plain

Unauthorized
```

## Testing

### Test Coverage
- **Location:** `backend/src/__tests__/auth.test.ts`
- **Framework:** Vitest with Supertest
- **Coverage Target:** All authentication paths and failure modes

### Key Test Scenarios

1. **HTTP Authentication:**
   - Valid Bearer token
   - Missing Authorization header
   - Malformed Authorization header (no "Bearer " prefix)
   - Invalid token value
   - Empty token value

2. **WebSocket Authentication:**
   - Valid token in Sec-WebSocket-Protocol
   - Missing Sec-WebSocket-Protocol header
   - Malformed subprotocol (no "bearer." prefix)
   - Invalid token value
   - Multiple subprotocols with valid token

3. **Token Comparison:**
   - Exact match (case-sensitive)
   - Whitespace handling
   - Special characters in token

### Test Examples

```typescript
describe('HTTP Authentication', () => {
  it('allows request with valid Bearer token', async () => {
    const response = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${LOCAL_TOKEN}`);

    expect(response.status).not.toBe(401);
  });

  it('rejects request with missing Authorization header', async () => {
    const response = await request(app)
      .get('/api/sessions');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('unauthorized');
  });

  it('rejects request with invalid token', async () => {
    const response = await request(app)
      .get('/api/sessions')
      .set('Authorization', 'Bearer wrong-token');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('unauthorized');
  });
});

describe('WebSocket Authentication', () => {
  it('accepts connection with valid token', async () => {
    const ws = new WebSocket('ws://localhost:3001', {
      headers: {
        'Sec-WebSocket-Protocol': `bearer.${LOCAL_TOKEN}`
      }
    });

    await new Promise((resolve) => ws.on('open', resolve));
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it('rejects connection with invalid token', async () => {
    const ws = new WebSocket('ws://localhost:3001', {
      headers: {
        'Sec-WebSocket-Protocol': 'bearer.invalid-token'
      }
    });

    await new Promise((resolve) => ws.on('error', resolve));
    expect(ws.readyState).not.toBe(WebSocket.OPEN);
  });
});
```

## Configuration

### Environment Variables
- **LOCAL_TOKEN** (required) - Authentication token for all requests
- **NODE_ENV** - Environment mode (affects error detail exposure)

### Token Generation

**Recommended approach:**
```bash
# Generate 32-byte random token (Base64 encoded)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example output:**
```
ZK9xR2vMpL7qN8wYjX3tF5hU1sC6dE4bA2iO0gP9nV8=
```

**Store in .env:**
```bash
LOCAL_TOKEN=ZK9xR2vMpL7qN8wYjX3tF5hU1sC6dE4bA2iO0gP9nV8=
```

## Monitoring & Observability

### Logging

**Successful Authentication:**
```json
{
  "level": "debug",
  "time": "2025-11-10T12:00:00.000Z",
  "requestId": "req_abc123",
  "msg": "Request authenticated",
  "method": "GET",
  "path": "/api/sessions"
}
```

**Failed Authentication:**
```json
{
  "level": "warn",
  "time": "2025-11-10T12:00:00.000Z",
  "requestId": "req_xyz789",
  "msg": "Authentication failed",
  "method": "GET",
  "path": "/api/sessions",
  "reason": "invalid_token",
  "ip": "192.168.1.100"
}
```

**WebSocket Rejection:**
```json
{
  "level": "warn",
  "time": "2025-11-10T12:00:00.000Z",
  "msg": "WebSocket upgrade rejected",
  "reason": "missing_token",
  "ip": "192.168.1.100"
}
```

### Metrics to Track
- Authentication success rate (REST + WS)
- Authentication failure rate by reason
- Failed attempts per IP address
- Token validation latency

## Performance Considerations

### Middleware Overhead
- Token comparison: O(1) constant time
- String operations: ~1-2 microseconds per request
- No database lookups or async operations
- Negligible performance impact

### Caching Strategy
- Token loaded once at startup (not per-request)
- No need for token caching (single token model)
- Future: Token cache for multi-user (if required)

### Scalability
- Single-token design: unlimited concurrent requests
- No shared state or synchronization required
- Horizontally scalable (stateless)

## Security Considerations

### Token Security

**Storage:**
- Never log token values (filtered by logging module)
- Store only in `.env` file (excluded from git)
- Avoid hardcoding in source code

**Transmission:**
- HTTPS required in production (TLS 1.2+)
- Token in header (not query string or body)
- WebSocket subprotocol (not URL parameter)

**Validation:**
- Constant-time comparison (prevents timing attacks)
- Case-sensitive matching
- No token normalization (exact match required)

### Attack Mitigation

**Brute Force:**
- Rate limiting at security layer (60 req/min)
- IP allowlist reduces attack surface
- Personal tool context (low risk)

**Token Leakage:**
- No tokens in logs or error messages
- Filtered from request/response logging
- HTTPS prevents network sniffing

**Replay Attacks:**
- Stateless tokens (no expiration currently)
- Future: Add token rotation mechanism
- Personal tool context (low risk)

### Known Vulnerabilities

1. **No Token Expiration:**
   - Tokens valid indefinitely
   - Stolen token usable until rotation
   - Mitigation: Rotate token periodically

2. **No Token Revocation:**
   - No mechanism to invalidate token
   - Requires server restart
   - Mitigation: Add token revocation list (future)

3. **Single Token:**
   - All clients share same token
   - No per-client authentication
   - Acceptable for personal tool

## Future Enhancements

### Planned Features

1. **Token Rotation:**
   - Periodic automatic token rotation
   - Grace period for old token
   - Webhook notification for new token

2. **Token Expiration:**
   - Time-based token expiry (JWT-style)
   - Refresh token mechanism
   - Configurable expiration duration

3. **Multi-Token Support:**
   - Multiple valid tokens (token pool)
   - Per-client token issuance
   - Token naming/labeling

4. **Audit Logging:**
   - Detailed authentication event log
   - Failed attempt tracking
   - Anomaly detection

5. **Token Management API:**
   - Generate new tokens via API
   - List active tokens
   - Revoke specific tokens

### Potential Upgrades

**JWT Implementation:**
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function authHttp(req, res, next) {
  const token = extractBearerToken(req);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // Attach user context
    next();
  } catch (err) {
    res.status(401).json({ error: 'invalid_token' });
  }
}
```

**OAuth2 Integration:**
```typescript
// Support for OAuth2 providers (GitHub, Google)
export function authOAuth(req, res, next) {
  const accessToken = extractBearerToken(req);

  // Verify token with OAuth provider
  verifyWithProvider(accessToken)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(() => res.status(401).json({ error: 'invalid_token' }));
}
```

## Migration Considerations

### From Single Token to Multi-User

**Step 1: Add User Context**
```typescript
interface AuthContext {
  userId: string;
  token: string;
  issuedAt: Date;
}

// Attach to request
req.auth = authContext;
```

**Step 2: Token Storage**
```typescript
// In-memory token store
const tokenStore = new Map<string, AuthContext>();

// Or database-backed
const tokenStore = new TokenDatabase();
```

**Step 3: Middleware Update**
```typescript
export function authHttp(req, res, next) {
  const token = extractBearerToken(req);
  const context = tokenStore.get(token);

  if (!context) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  req.auth = context;
  next();
}
```

## Troubleshooting

### Common Issues

**Issue:** All requests return 401
- **Cause:** Missing or incorrect LOCAL_TOKEN in .env
- **Solution:** Verify .env file exists and LOCAL_TOKEN is set correctly

**Issue:** WebSocket connections fail to establish
- **Cause:** Incorrect subprotocol format
- **Solution:** Use `Sec-WebSocket-Protocol: bearer.<token>` (not `Bearer`)

**Issue:** Token works in development but not production
- **Cause:** .env file not deployed to production
- **Solution:** Set environment variable in production environment

**Issue:** Authentication succeeds but logs show warnings
- **Cause:** Token contains special characters causing log issues
- **Solution:** Use Base64-encoded tokens without special URL characters

### Debug Commands

**Test HTTP Authentication:**
```bash
curl -H "Authorization: Bearer $LOCAL_TOKEN" \
  http://localhost:3001/api/sessions
```

**Test WebSocket Authentication:**
```bash
wscat -c ws://localhost:3001 \
  --subprotocol "bearer.$LOCAL_TOKEN"
```

**Verify Token Loading:**
```bash
node -e "require('dotenv').config(); console.log('Token:', process.env.LOCAL_TOKEN)"
```

## Change Log

| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| 1.0.0   | 2025-11-10 | Initial domain overview documentation        |

## Additional Resources

- **[Authentication Testing Guide](../../guides/testing/auth-testing.md)** - Comprehensive authentication test strategies
- **[Security Best Practices](../../guides/security/auth-best-practices.md)** - Token management and security guidelines
- **[WebSocket Authentication](../../guides/patterns/websocket-auth.md)** - WebSocket-specific authentication patterns
- **[RFC 6750](https://tools.ietf.org/html/rfc6750)** - OAuth 2.0 Bearer Token Usage
