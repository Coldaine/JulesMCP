# Jules Control Room

Secure real-time backend for Jules Control Room with TypeScript, Express, and WebSocket support.

## Features

- **Secure Authentication**: JWT-based authentication with token validation
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **WebSocket Support**: Real-time communication with heartbeat mechanism
- **Session Management**: Complete CRUD operations for sessions
- **Health Checks**: `/healthz` and `/readyz` endpoints for monitoring
- **Structured Logging**: Pino-based logging with request tracking
- **Robust HTTP Client**: `julesClient` with timeout, retries, and redacted logging
- **Observability**: Request IDs, timing, and comprehensive logging
- **Docker Support**: Production-ready Dockerfile and docker-compose

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- Docker (optional, for containerized deployment)

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and set your JWT_SECRET
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Lint code
npm run lint

# Type check
npm run type-check
```

## API Endpoints

### Health Checks

- `GET /healthz` - Basic health check
- `GET /readyz` - Readiness check

### Session Management (Requires Authentication)

- `POST /api/sessions` - Create a new session
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Get a specific session
- `PUT /api/sessions/:id` - Update a session
- `DELETE /api/sessions/:id` - Delete a session

### Authentication

All `/api/*` endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## WebSocket Connection

Connect to WebSocket endpoint with authentication:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws?token=<your-jwt-token>');

ws.on('open', () => {
  // Subscribe to session updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    sessionId: 'session-id-here'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message);
});
```

### WebSocket Message Types

- `welcome` - Connection established
- `subscribed` - Subscribed to session updates
- `session-update` - Session data changed (diff broadcast)

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Jules Client Usage

The `julesClient` module provides a robust HTTP client with automatic retries and logging:

```typescript
import { JulesClient } from './julesClient';

const client = new JulesClient('https://api.example.com', {
  timeout: 5000,
  retries: 3,
  retryDelay: 1000,
});

// GET request
const response = await client.get('/endpoint');

// POST request
const result = await client.post('/endpoint', { data: 'value' });

// PUT request
await client.put('/endpoint', { data: 'updated' });

// DELETE request
await client.delete('/endpoint');
```

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| JWT_SECRET | JWT signing secret | (required) |
| LOG_LEVEL | Logging level | info |

## Security Features

- JWT-based authentication
- Rate limiting (100 requests per 15 minutes per IP)
- Request ID tracking
- Sensitive data redaction in logs
- Non-root Docker user
- Graceful shutdown handling

## Architecture

- **Express**: HTTP server framework
- **ws**: WebSocket library
- **Pino**: High-performance logging
- **JWT**: Token-based authentication
- **express-rate-limit**: Rate limiting middleware
- **TypeScript**: Type-safe development

## License

MIT