import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { SessionDelta } from '@shared/types';
import { afterAll, beforeAll, describe, expect, it, vi, beforeEach } from 'vitest';
import { WebSocket } from 'ws';
import type * as JulesClient from '../julesClient.js';
import { enforceRateLimit, resetRateLimits, sanitizeIp } from '../security.js';

const TOKEN = 'test-token';

const sessionA = {
  id: 'sess-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  repo: 'repo/a',
  planStatus: 'pending',
  approval: 'pending',
  participants: ['alice'],
};

vi.mock('../julesClient.js', async () => {
  const actual = await vi.importActual<typeof JulesClient>('../julesClient.js');
  let call = 0;
  return {
    ...actual,
    listSessions: vi.fn(async () => {
      call += 1;
      if (call === 1) {
        return { sessions: [sessionA] };
      }
      return {
        sessions: [
          {
            ...sessionA,
            planStatus: 'succeeded',
            updatedAt: new Date().toISOString(),
          },
        ],
      };
    }),
  };
});

interface SessionUpdateMessage {
  type: 'session_update';
  delta: SessionDelta[];
}

describe('websocket updates', () => {
  let server: Server;
  let shutdown: () => void;

  beforeAll(async () => {
    vi.useFakeTimers();
    process.env.LOCAL_TOKEN = TOKEN;
    process.env.ALLOWLIST = '';
    const mod = await import('../server.js');
    server = mod.server;
    shutdown = mod.shutdown;
    await new Promise<void>((resolve) => server.listen(0, resolve));
  });

  beforeEach(() => {
    resetRateLimits();
    process.env.ALLOWLIST = '';
  });

  afterAll(async () => {
    vi.useRealTimers();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    shutdown?.();
  });

  it('emits session updates and heartbeats', async () => {
    const address = server.address() as AddressInfo;
    const url = `ws://127.0.0.1:${address.port}/ws`;
    const ws = new WebSocket(url, [`bearer.${TOKEN}`]);

    const messagePromise = new Promise<SessionUpdateMessage>((resolve) => {
      ws.once('message', (data) => resolve(JSON.parse(data.toString()) as SessionUpdateMessage));
    });

    const pingPromise = new Promise<boolean>((resolve) => {
      ws.once('ping', () => resolve(true));
    });

    await new Promise((resolve) => ws.once('open', resolve));

    await vi.advanceTimersByTimeAsync(5_000);
    const message = await messagePromise;
    expect(message.type).toBe('session_update');
    expect(message.delta[0].change).toBe('created');

    const secondMessagePromise = new Promise<SessionUpdateMessage>((resolve) => {
      ws.once('message', (data) => resolve(JSON.parse(data.toString()) as SessionUpdateMessage));
    });
    await vi.advanceTimersByTimeAsync(5_000);
    const secondMessage = await secondMessagePromise;
    expect(secondMessage.delta[0].change).toBe('updated');

    await vi.advanceTimersByTimeAsync(30_000);
    await expect(pingPromise).resolves.toBe(true);

    ws.terminate();
  });

  it('rejects disallowed addresses', async () => {
    process.env.ALLOWLIST = '10.0.';
    const address = server.address() as AddressInfo;
    const url = `ws://127.0.0.1:${address.port}/ws`;
    await expect(
      new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(url, [`bearer.${TOKEN}`]);
        ws.once('open', () => {
          ws.terminate();
          reject(new Error('connection should not open'));
        });
        ws.once('error', () => resolve());
      }),
    ).resolves.toBeUndefined();
  });

  it('rate limits repeated upgrades', async () => {
    const address = server.address() as AddressInfo;
    const url = `ws://127.0.0.1:${address.port}/ws`;
    const key = `${sanitizeIp('127.0.0.1')}:/ws`;
    for (let i = 0; i < 60; i += 1) {
      enforceRateLimit(key, 60, 60_000);
    }
    await expect(
      new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(url, [`bearer.${TOKEN}`]);
        ws.once('open', () => {
          ws.terminate();
          reject(new Error('connection should be throttled'));
        });
        ws.once('error', () => resolve());
      }),
    ).resolves.toBeUndefined();
  });

  it('rejects websocket connections without bearer credentials', async () => {
    const address = server.address() as AddressInfo;
    const url = `ws://127.0.0.1:${address.port}/ws`;
    const ws = new WebSocket(url);

    const error = await new Promise<Error>((resolve) => {
      ws.once('error', (err) => resolve(err as Error));
    });

    expect(error.message).toContain('401');
  });
});
