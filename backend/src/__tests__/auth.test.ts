import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { authHttp, authWs } from '../auth.js';

describe('authHttp', () => {
  const app = express();
  app.get('/secure', authHttp, (_req, res) => {
    res.json({ ok: true });
  });

  it('rejects missing token', async () => {
    const response = await request(app).get('/secure');
    expect(response.status).toBe(401);
  });

  it('accepts valid token', async () => {
    const response = await request(app)
      .get('/secure')
      .set('Authorization', `Bearer ${process.env.LOCAL_TOKEN}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});

describe('authWs', () => {
  it('rejects invalid protocol token', () => {
    const result = authWs({
      headers: { 'sec-websocket-protocol': 'bearer.invalid' },
    } as any);
    expect(result).toBe(false);
  });

  it('accepts matching token', () => {
    const result = authWs({
      headers: { 'sec-websocket-protocol': `bearer.${process.env.LOCAL_TOKEN}` },
    } as any);
    expect(result).toBe(true);
  });
});
