# Personal Deployment Guide

This guide covers running the Jules Control Room Backend on your local machine or home server.

> **🏠 Personal Tool:** This is designed for single-user personal use, not enterprise deployment. Run it on your development machine or a home server you control.

## Deployment Options

### Option 1: Local Development (Recommended)

Run directly on your machine with hot reload - perfect for daily use.

### Option 2: Docker (Personal Server)

Run in a container on your home server for always-on access.

### Option 3: Always-Running Process

Use PM2 or systemd for persistent local operation.

## Quick Setup Checklist

1. ✅ Set your `JULES_API_KEY` and `LOCAL_TOKEN`
2. ✅ Run locally on `localhost:3001` (default)
3. ✅ Optional: Enable persistence (`PERSIST=1`) for session history
4. ✅ Optional: Set `ALLOWLIST` to access from other devices on your home network

---

## Docker Deployment (Personal Server)

### Build & Run on Your Machine

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

### About the Dockerfile

Simple, secure Node 20 container:

- Multi-stage build for smaller image
- Healthcheck endpoint (`/healthz`)
- Non-root user for basic security

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

## Security for Personal Use

### Basic Security

- **Generate a strong token**: `openssl rand -hex 32` for `LOCAL_TOKEN`
- **Keep secrets private**: Don't commit `.env` files
- **Localhost first**: Run on `127.0.0.1` unless you need home network access

### Home Network Access (Optional)

If you want to access from your phone/tablet on the same WiFi:

1. Set `ALLOWLIST` to your home network (e.g., `192.168.1.0/24`)
2. Firewall will still block internet access
3. Token still required for authentication

### Don't Overthink It

This is your personal tool running on your machine. You don't need:

- Enterprise monitoring
- Log aggregation services
- Complex firewall rules
- Load balancers or clustering

Just keep your `LOCAL_TOKEN` private and you're good!

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

## Optional: Reverse Proxy (Advanced)

If you want HTTPS on your home network, you can use Caddy:

```caddyfile
localhost {
    reverse_proxy localhost:3001
}
```

**Note:** Most personal use cases don't need this. Just use `http://localhost:3001`.

---

## Monitoring (Simple)

### Health Endpoints

- **`/healthz`**: Check if server is running
- **`/readyz`**: Check if Jules API is accessible

Just curl these occasionally to verify things are working:

```bash
curl http://localhost:3001/healthz
curl http://localhost:3001/readyz
```

### Logs

The server logs to console. If running with Docker:

```bash
docker compose logs -f
```

If running directly:

```bash
npm run dev  # Logs show in terminal
```

That's it! No need for log aggregation or complex monitoring for personal use.

---

## Simple Troubleshooting

### Server Won't Start

```bash
# Check if port 3001 is already in use
lsof -i :3001

# Check your .env file exists
ls backend/.env

# Try running directly to see errors
cd backend && npm run dev
```

### Can't Connect from Another Device

1. Check `ALLOWLIST` includes your home network
2. Verify firewall isn't blocking port 3001
3. Make sure you're using the machine's local IP, not `localhost`

### WebSocket Not Working

- Check `LOCAL_TOKEN` is correct in your client
- Use the right protocol: `ws://localhost:3001/ws` (not `wss://` unless you have HTTPS)

---

## Keeping It Updated

```bash
# Update dependencies occasionally
npm update

# Run tests to make sure things still work
npm run test
```

That's it! This is your personal tool - keep it simple.
