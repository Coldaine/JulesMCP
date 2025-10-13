import nock from 'nock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { JulesHttpError, doJson } from '../julesClient.js';

const BASE = 'https://api.jules.test';

describe('doJson', () => {
  beforeEach(() => {
    process.env.JULES_API_BASE = BASE;
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('retries on transient failure', async () => {
    const scope = nock(BASE)
      .get('/sessions')
      .reply(500, { error: 'boom' })
      .get('/sessions')
      .reply(200, { sessions: [] });

    const result = await doJson('/sessions', { method: 'GET' });
    expect(result).toEqual({ sessions: [] });
    scope.done();
  });

  it('throws JulesHttpError on timeout', async () => {
    const clock = vi.useFakeTimers();
    const scope = nock(BASE)
      .get('/sessions')
      .delayConnection(2000)
      .reply(200, {});

    const promise = doJson('/sessions', { method: 'GET', timeoutMs: 500 });
    await clock.runAllAsync();
    await expect(promise).rejects.toHaveProperty('status', 408);
    scope.done();
    clock.useRealTimers();
  });

  it('surfaces non-retryable errors', async () => {
    nock(BASE).get('/sessions').reply(400, { error: 'bad' });

    await expect(doJson('/sessions', { method: 'GET' })).rejects.toBeInstanceOf(JulesHttpError);
  });
});
