import type { Express } from 'express';
import nock, { cleanAll } from 'nock';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

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
});
