import type { Express } from 'express';
import nock, { cleanAll } from 'nock';
import request from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as julesClient from '../julesClient.js';
import { JulesHttpError } from '../julesClient.js';

const BASE = 'https://api.jules.test';
const TOKEN = 'test-token';

describe('sessions routes', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.JULES_API_BASE = BASE;
    process.env.LOCAL_TOKEN = TOKEN;
    process.env.ALLOWLIST = '';
    const mod = await import('../server.js');
    app = mod.app;
  });

  beforeEach(() => {
    cleanAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('supports create, approve, message and activities', async () => {
    const session = {
      id: 'sess-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      repo: 'repo/a',
      planStatus: 'pending',
      approval: 'pending',
      participants: ['alice'],
    };

    nock(BASE)
      .post('/sessions')
      .reply(201, session)
      .get('/sessions')
      .reply(200, { sessions: [session] })
      .get('/sessions/sess-1')
      .reply(200, session)
      .get('/sessions/sess-1/activities')
      .reply(200, { activities: [{
        id: 'act-1',
        sessionId: 'sess-1',
        at: new Date().toISOString(),
        actor: 'jules',
        type: 'message',
        message: 'hi',
      }] })
      .post('/sessions/sess-1/approve')
      .reply(200, { ...session, approval: 'approved' })
      .post('/sessions/sess-1/message')
      .reply(200, { ok: true });

    await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ repo: 'repo/a' })
      .expect(201);

    const list = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${TOKEN}`)
      .expect(200);
    expect(list.body.sessions).toHaveLength(1);

    const detail = await request(app)
      .get('/api/sessions/sess-1')
      .set('Authorization', `Bearer ${TOKEN}`)
      .expect(200);
    expect(detail.body.id).toBe('sess-1');

    const approve = await request(app)
      .post('/api/sessions/sess-1/approve')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ state: 'approved' })
      .expect(200);
    expect(approve.body.approval).toBe('approved');

    const message = await request(app)
      .post('/api/sessions/sess-1/message')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ message: 'hello' })
      .expect(200);
    expect(message.body.ok).toBe(true);

    const activities = await request(app)
      .get('/api/sessions/sess-1/activities')
      .set('Authorization', `Bearer ${TOKEN}`)
      .expect(200);
    expect(activities.body.activities).toHaveLength(1);
  });

  it('returns validation errors from zod schemas', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ repo: '' })
      .expect(400);

    expect(response.body.error).toBe('invalid_request');
    expect(response.body).toHaveProperty('details');
  });

  it('maps Jules timeouts to 408 responses', async () => {
    vi.spyOn(julesClient, 'listSessions').mockRejectedValue(new JulesHttpError('timeout', 408, ''));

    const response = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${TOKEN}`)
      .expect(408);

    expect(response.body).toEqual({ error: 'jules_timeout' });
  });

  it('maps Jules rate limits to 429 responses', async () => {
    vi.spyOn(julesClient, 'listSessions').mockRejectedValue(new JulesHttpError('rate', 429, ''));

    const response = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${TOKEN}`)
      .expect(429);

    expect(response.body).toEqual({ error: 'jules_rate_limited' });
  });

  it('maps Jules server failures to 502 responses', async () => {
    vi.spyOn(julesClient, 'getSession').mockRejectedValue(new JulesHttpError('boom', 503, 'server_down'));

    const response = await request(app)
      .get('/api/sessions/sess-1')
      .set('Authorization', `Bearer ${TOKEN}`)
      .expect(502);

    expect(response.body).toEqual({ error: 'jules_unavailable', retry: true });
  });

  it('passes through other Jules errors with detail payload', async () => {
    vi.spyOn(julesClient, 'getSession').mockRejectedValue(new JulesHttpError('missing', 404, 'not_found'));

    const response = await request(app)
      .get('/api/sessions/sess-unknown')
      .set('Authorization', `Bearer ${TOKEN}`)
      .expect(404);

    expect(response.body).toEqual({ error: 'jules_error', detail: 'not_found' });
  });
});
