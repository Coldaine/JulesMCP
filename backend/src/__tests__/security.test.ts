import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { enforceRateLimit, ipAllow, isIpAllowed, rateLimit, resetRateLimits, sanitizeIp } from '../security.js';

describe('ipAllow', () => {
  afterEach(() => {
    delete process.env.ALLOWLIST;
  });

  it('permits matching prefixes', async () => {
    process.env.ALLOWLIST = '10.0.0.,192.168.';
    const app = express();
    app.use((req, _res, next) => {
      Object.defineProperty(req, 'ip', { value: '10.0.0.42' });
      next();
    });
    app.get('/allowed', ipAllow, (_req, res) => res.json({ ok: true }));
    const res = await request(app).get('/allowed');
    expect(res.status).toBe(200);
  });

  it('rejects missing prefixes', async () => {
    process.env.ALLOWLIST = '172.16.';
    const app = express();
    app.use((req, _res, next) => {
      Object.defineProperty(req, 'ip', { value: '10.0.0.42' });
      next();
    });
    app.get('/allowed', ipAllow, (_req, res) => res.json({ ok: true }));
    const res = await request(app).get('/allowed');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'forbidden' });
  });

  it('skips checks when no allowlist configured', async () => {
    const app = express();
    app.use((req, _res, next) => {
      Object.defineProperty(req, 'ip', { value: '203.0.113.5' });
      next();
    });
    app.get('/allowed', ipAllow, (_req, res) => res.json({ ok: true }));
    const res = await request(app).get('/allowed');
    expect(res.status).toBe(200);
  });
});

describe('isIpAllowed', () => {
  it('rejects empty addresses when allowlist set', () => {
    process.env.ALLOWLIST = '203.0.113.';
    expect(isIpAllowed('')).toBe(false);
  });

  it('normalises ipv6 mapped addresses', () => {
    process.env.ALLOWLIST = '127.0.0.';
    expect(isIpAllowed('::ffff:127.0.0.1')).toBe(true);
  });
});

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const buildApp = (limit = 2) => {
    const app = express();
    app.use((req, _res, next) => {
      Object.defineProperty(req, 'ip', { value: '127.0.0.1' });
      next();
    });
    app.get('/limited', rateLimit(limit), (_req, res) => res.json({ ok: true }));
    return app;
  };

  it('blocks once the limit is exceeded', async () => {
    const app = buildApp(2);
    const base = new Date('2024-01-01T00:00:00Z').getTime();

    vi.setSystemTime(base);
    const res1 = await request(app).get('/limited');
    expect(res1.status).toBe(200);

    vi.setSystemTime(base + 1);
    const res2 = await request(app).get('/limited');
    expect(res2.status).toBe(200);

    vi.setSystemTime(base + 2);
    const res3 = await request(app).get('/limited');
    expect(res3.status).toBe(429);
    expect(res3.body).toHaveProperty('error', 'rate_limited');
  });

  it('allows requests again after the rolling window elapses', async () => {
    const app = buildApp(1);
    const base = new Date('2024-01-01T00:00:00Z').getTime();

    vi.setSystemTime(base);
    const first = await request(app).get('/limited');
    expect(first.status).toBe(200);

    vi.setSystemTime(base + 1);
    const blocked = await request(app).get('/limited');
    expect(blocked.status).toBe(429);

    vi.setSystemTime(base + 60_001);
    const allowed = await request(app).get('/limited');
    expect(allowed.status).toBe(200);
  });

  it('can be reset', () => {
    const key = `${sanitizeIp('203.0.113.5')}:test`;
    for (let i = 0; i < 3; i += 1) {
      enforceRateLimit(key, 2, 1_000);
    }
    expect(enforceRateLimit(key, 2, 1_000)).toBe(true);
    resetRateLimits();
    expect(enforceRateLimit(key, 2, 1_000)).toBe(false);
  });
});
