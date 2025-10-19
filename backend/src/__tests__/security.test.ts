import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { ipAllow, rateLimit } from '../security.js';

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

describe('rateLimit', () => {
  const app = express();
  app.get('/limited', rateLimit(2), (_req, res) => res.json({ ok: true }));

  it('allows requests within limit then blocks excess', async () => {
    const res1 = await request(app).get('/limited');
    expect(res1.status).toBe(200);
    expect(res1.body).toEqual({ ok: true });

    const res2 = await request(app).get('/limited');
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual({ ok: true });

    const res3 = await request(app).get('/limited');
    expect(res3.status).toBe(429);
    expect(res3.body).toHaveProperty('error', 'rate_limited');
  });
});
