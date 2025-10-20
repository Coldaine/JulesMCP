import { EventEmitter } from 'node:events';

import type { Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { logError, logEvent, logger, withRequestId } from '../logging.js';

describe('logging helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redacts secrets when logging events', () => {
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => logger);

    logEvent({ token: 'shhh', nested: { apiToken: '123', keep: 'ok' }, keep: 'value' });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith({
      token: '[redacted]',
      nested: { apiToken: '123', keep: 'ok' },
      keep: 'value',
    });
  });

  it('truncates error messages and redacts secrets', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
    const err = new Error('x'.repeat(400));

    logError({ msg: 'failure', secretKey: 'top', err });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const payload = errorSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      msg: 'failure',
      secretKey: '[redacted]',
    });
    expect(payload.err.message).toHaveLength(303);
    expect(payload.err.message?.endsWith('...')).toBe(true);
    expect(payload.err.stack).toBe(err.stack);
  });

  it('preserves provided request ids and logs structured events', () => {
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => logger);
    const req = {
      headers: { 'x-request-id': 'abc-123' },
      method: 'GET',
      path: '/healthz',
    } as unknown as Request & { id?: string };
    const res = new EventEmitter() as unknown as Response & { statusCode: number };
    res.statusCode = 204;
    const next = vi.fn();

    withRequestId(req, res, next);
    expect(req.id).toBe('abc-123');
    expect(next).toHaveBeenCalled();

    res.emit('finish');
    expect(infoSpy).toHaveBeenCalled();
    const logEntry = infoSpy.mock.calls.at(-1)?.[0];
    expect(logEntry).toMatchObject({
      id: 'abc-123',
      method: 'GET',
      path: '/healthz',
      status: 204,
    });
  });

  it('generates a request id when one is not supplied', () => {
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => logger);
    const req = {
      headers: {},
      method: 'POST',
      path: '/sessions',
    } as unknown as Request & { id?: string };
    const res = new EventEmitter() as unknown as Response & { statusCode: number };
    res.statusCode = 201;

    withRequestId(req, res, vi.fn());
    expect(req.id).toBeDefined();

    res.emit('finish');
    const logEntry = infoSpy.mock.calls.at(-1)?.[0];
    expect(logEntry?.id).toBe(req.id);
    expect(typeof logEntry?.id).toBe('string');
    expect(logEntry).toMatchObject({ method: 'POST', path: '/sessions', status: 201 });
  });
});
