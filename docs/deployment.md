# Deployment Guide

This guide covers deploying the Jules Control Room Backend to production.

## Deployment Checklist

1. ✅ Provide production secrets (`JULES_API_KEY`, `LOCAL_TOKEN`)
2. ✅ Populate `ALLOWLIST` when exposing beyond localhost
3. ✅ Decide on persistence (`PERSIST=1`) and map the `data/` volume
4. ✅ Set `NOTIFY_WEBHOOK` if external notifications are desired
5. ✅ Build the container with `docker compose build`
6. ✅ Run with `docker compose up -d`

---

## Docker Deployment

### Build & Run

```bash
# Build the container
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Multi-Stage Dockerfile

The Dockerfile uses Node 20 with:

- Multi-stage build (build → runtime)
- Healthcheck endpoint (`/healthz`)
- Non-root runtime user
- Optimized layer caching

### Docker Compose Stack

The `docker-compose.yml` includes:

- Environment variable wiring
- Volume mounts for persistence
- Port mapping (3001:3001)
- Health checks
- Restart policies

---

## Environment Configuration

### Required Variables

```bash
# API Authentication
JULES_API_KEY=your-jules-api-key-here
LOCAL_TOKEN=strong-random-token-here

# Server Configuration
PORT=3001
```

### Security Configuration

```bash
# IP Allowlist (comma-separated CIDR prefixes)
ALLOWLIST=192.168.1.0/24,10.0.0.0/8

# CORS for remote UI
CORS_ORIGIN=https://your-frontend.com
```

### Optional Features

```bash
# Enable SQLite persistence
PERSIST=1

# Webhook notifications
NOTIFY_WEBHOOK=https://your-webhook-endpoint.com/notify

# Custom Jules API endpoint
JULES_API_BASE=https://api.jules.ai/v1
```

---

## Security Best Practices

### Authentication

- **Generate strong tokens**: Use `openssl rand -hex 32` for `LOCAL_TOKEN`
- **Never commit secrets**: Keep `.env` files out of version control
- **Rotate tokens regularly**: Change `LOCAL_TOKEN` periodically

### Network Security

- **Use ALLOWLIST**: Restrict access to known IP ranges
- **Enable HTTPS**: Use a reverse proxy (nginx, Caddy) for TLS termination
- **Firewall rules**: Only expose necessary ports

### Monitoring

- **Health checks**: Monitor `/healthz` and `/readyz` endpoints
- **Log aggregation**: Collect structured JSON logs for analysis
- **Rate limiting**: Monitor rate limit metrics for abuse patterns

---

## Persistence

### Enabling SQLite Storage

```bash
PERSIST=1
```

This enables session history storage in `data/sessions.sqlite`.

### Volume Mounting

Map the data directory to persist across container restarts:

```yaml
volumes:
  - ./data:/app/data
```

### Backup Strategy

```bash
# Backup the SQLite database
cp data/sessions.sqlite data/sessions.backup.$(date +%Y%m%d).sqlite

# Restore from backup
cp data/sessions.backup.20251019.sqlite data/sessions.sqlite
```

---

## Webhook Notifications

### Configuration

```bash
NOTIFY_WEBHOOK=https://your-endpoint.com/webhook
```

### Payload Format

The webhook receives `SessionDelta` objects:

```typescript
{
  changeType: 'created' | 'updated' | 'deleted',
  before: JulesSession | null,
  after: JulesSession | null,
  timestamp: string
}
```

### Security

- Use HTTPS endpoints only
- Implement signature verification in your webhook handler
- Rate limit webhook endpoints

---

## Reverse Proxy Configuration

### Nginx Example

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy Example

```caddyfile
api.yourdomain.com {
    reverse_proxy localhost:3001
}
```

---

## Monitoring & Observability

### Health Endpoints

- **`/healthz`**: Liveness check (always returns 200)
- **`/readyz`**: Readiness check (probes Jules API with 1s timeout)

### Logging

Structured JSON logs are written to stdout:

```json
{
  "level": 30,
  "time": "2025-10-19T12:00:00.000Z",
  "msg": "server_started",
  "port": 3001
}
```

### Log Aggregation

Use a log aggregation tool:

- **Docker**: `docker compose logs -f`
- **Cloud**: CloudWatch, Datadog, Splunk
- **Self-hosted**: ELK stack, Loki

### Metrics

Monitor these key metrics:

- Request rate and latency
- WebSocket connection count
- Jules API response times
- Rate limit hits
- Error rates by type

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs

# Verify environment variables
docker compose config

# Test locally first
npm run dev
```

### WebSocket Connections Fail

1. Check `LOCAL_TOKEN` is correct
2. Verify `Sec-WebSocket-Protocol` header
3. Check firewall allows WebSocket upgrades
4. Ensure reverse proxy supports WebSocket

### High Memory Usage

- SQLite persistence enabled? Monitor `data/sessions.sqlite` size
- Check WebSocket client count (may need to limit)
- Review log retention policies

### API Timeout Errors

1. Check Jules API availability
2. Review `JULES_API_BASE` configuration
3. Verify network connectivity
4. Check `/readyz` endpoint status

---

## Scaling Considerations

### Horizontal Scaling

- WebSocket sessions are not currently shared across instances
- Use sticky sessions or session affinity at load balancer
- Consider Redis for shared session state (future enhancement)

### Vertical Scaling

- Memory: ~100MB base + ~10MB per 1000 active sessions
- CPU: Minimal, mostly I/O bound
- Storage: Depends on persistence and log retention

---

## Maintenance

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test after updates
npm run test
npm run typecheck
npm run lint
```

### Rolling Updates

1. Build new image
2. Test in staging
3. Deploy with zero-downtime:

```bash
docker compose up -d --no-deps --build backend
```

### Database Migrations

Currently not applicable (SQLite schema is auto-created). Future versions may include migration scripts.
