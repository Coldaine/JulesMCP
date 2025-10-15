import type { IncomingMessage } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';

import type { JulesSession, SessionDelta } from '@shared/types';
import { authWs } from './auth.js';
import { listSessions } from './julesClient.js';
import { logError, logEvent } from './logging.js';
import { loadSessions, persistSessions, persistenceEnabled } from './persistence.js';
import { enforceRateLimit, isIpAllowed, sanitizeIp } from './security.js';
import { notifyDelta } from './notifier.js';

interface JulesWebSocket extends WebSocket {
  isAlive?: boolean;
}

const MAX_BUFFER = 1_000_000;
const HEARTBEAT_INTERVAL = 30_000;
const POLL_INTERVAL = 5_000;

export function setupWebSockets(server: Server) {
  const wss = new WebSocketServer({ noServer: true, clientTracking: true });
  const clients = new Set<JulesWebSocket>();
  let cache = new Map<string, JulesSession>();
  if (persistenceEnabled) {
    loadSessions()
      .then((sessions) => {
        if (sessions.length) {
          cache = new Map(sessions.map((session) => [session.id, session] as const));
        }
      })
      .catch((error) => {
        logError({ msg: 'persistence_warmup_failed', err: error as Error });
      });
  }
  let stopped = false;

  wss.on('connection', (ws: JulesWebSocket) => {
    ws.isAlive = true;
    clients.add(ws);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  wss.on('error', (error) => {
    logError({ msg: 'ws_server_error', err: error as Error });
  });

  wss.on('headers', (headers, request) => {
    const protocol = (request as IncomingMessage & { acceptedProtocol?: string }).acceptedProtocol;
    const hasProtocolHeader = headers.some((value) =>
      value.toLowerCase().startsWith('sec-websocket-protocol'),
    );
    if (protocol && !hasProtocolHeader) {
      headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
    }
  });

  server.on('upgrade', (request, socket, head) => {
    const clientIp = extractIp(request);
    if (!isIpAllowed(clientIp)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    if (enforceRateLimit(`${clientIp ?? ''}:/ws`, 60)) {
      socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
      socket.destroy();
      return;
    }

    if (!authWs(request as any)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const selected = selectProtocol(request);
    if (!selected) {
      socket.write('HTTP/1.1 426 Upgrade Required\r\n\r\n');
      socket.destroy();
      return;
    }
    (request as IncomingMessage & { acceptedProtocol?: string }).acceptedProtocol = selected;

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  const heartbeat = setInterval(() => {
    for (const ws of clients) {
      if (!ws.isAlive) {
        ws.terminate();
        clients.delete(ws);
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  const poller = setInterval(async () => {
    if (clients.size === 0) {
      return;
    }
    try {
      const { sessions } = await listSessions();
      const nextMap = new Map(sessions.map((session) => [session.id, session] as const));
      const deltas = diffSessions(cache, nextMap);
      cache = nextMap;
      if (deltas.length) {
        await persistSessions(deltas);
        await notifyDelta(deltas);
        broadcast(clients, {
          type: 'session_update',
          delta: deltas,
        });
      }
    } catch (error) {
      logError({ msg: 'ws_poller_failed', err: error as Error });
    }
  }, POLL_INTERVAL);

  function shutdown() {
    if (stopped) {
      return;
    }
    stopped = true;
    clearInterval(heartbeat);
    clearInterval(poller);
    wss.close();
  }

  return { wss, shutdown };
}

export function diffSessions(
  prev: Map<string, JulesSession>,
  next: Map<string, JulesSession>,
): SessionDelta[] {
  const delta: SessionDelta[] = [];

  for (const [id, session] of next) {
    const previous = prev.get(id);
    if (!previous) {
      delta.push({ id, current: session, change: 'created' });
      continue;
    }
    if (JSON.stringify(previous) !== JSON.stringify(session)) {
      delta.push({ id, previous, current: session, change: 'updated' });
    }
  }

  for (const [id, session] of prev) {
    if (!next.has(id)) {
      delta.push({ id, previous: session, change: 'deleted' });
    }
  }

  return delta;
}

function broadcast(clients: Set<JulesWebSocket>, message: Record<string, unknown>): void {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState !== WebSocket.OPEN) {
      continue;
    }
    if (client.bufferedAmount > MAX_BUFFER) {
      client.close(4002, 'backpressure');
      continue;
    }
    client.send(payload, { binary: false, compress: false }, (error) => {
      if (error) {
        logError({ msg: 'ws_send_failed', err: error });
      }
    });
  }
  logEvent({ msg: 'ws_broadcast', clients: clients.size, bytes: payload.length });
}

function selectProtocol(request: IncomingMessage): string | null {
  const header = request.headers['sec-websocket-protocol'];
  if (!header) {
    return null;
  }
  const values = header
    .toString()
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const selected = values.find((value) => value.toLowerCase().startsWith('bearer.'));
  return selected ?? null;
}

function extractIp(request: IncomingMessage): string | undefined {
  const header = request.headers['x-forwarded-for'];
  if (typeof header === 'string' && header.length) {
    return sanitizeIp(header.split(',')[0]?.trim());
  }
  if (Array.isArray(header) && header.length) {
    return sanitizeIp(header[0]);
  }
  if (typeof request.headers['x-real-ip'] === 'string') {
    return sanitizeIp(request.headers['x-real-ip']);
  }
  return sanitizeIp(request.socket.remoteAddress);
}
