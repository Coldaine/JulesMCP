import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { enforceRateLimit, ipAllow, isIpAllowed, rateLimit, resetRateLimits, sanitizeIp } from '../security.js';

describe('ipAllow', () => {
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
  const app = express();
  app.get('/limited', rateLimit(2), (_req, res) => res.json({ ok: true }));

  it('allows within limits', async () => {
    await request(app).get('/limited');
    await request(app).get('/limited');
    const res = await request(app).get('/limited');
    expect(res.status).toBe(429);
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
