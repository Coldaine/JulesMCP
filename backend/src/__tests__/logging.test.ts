import { EventEmitter } from 'node:events';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { logError, logEvent, logger, withRequestId } from '../logging.js';

import type { NextFunction, Request, Response } from 'express';

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
    const payload = errorSpy.mock.calls[0]?.[0];
    expect(isRecord(payload) && isRecord(payload.err)).toBe(true);
    if (!isRecord(payload) || !isRecord(payload.err)) {
      throw new Error('expected structured error payload');
    }
    expect(payload).toMatchObject({
      msg: 'failure',
      secretKey: '[redacted]',
    });
    const message = payload.err.message;
    expect(typeof message).toBe('string');
    if (typeof message !== 'string') {
      throw new Error('expected string error message');
    }
    expect(message).toHaveLength(303);
    expect(message.endsWith('...')).toBe(true);
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
    const next = vi.fn<Parameters<NextFunction>, void>();
    const nextHandler: NextFunction = (...args) => next(...args);

    withRequestId(req, res, nextHandler);
    expect(req.id).toBe('abc-123');
    expect(next).toHaveBeenCalled();

    res.emit('finish');
    expect(infoSpy).toHaveBeenCalled();
    const logEntry = infoSpy.mock.calls.at(-1)?.[0];
    expect(isRecord(logEntry)).toBe(true);
    if (!isRecord(logEntry)) {
      throw new Error('expected structured log entry');
    }
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

    const next = vi.fn<Parameters<NextFunction>, void>();
    const nextHandler: NextFunction = (...args) => next(...args);

    withRequestId(req, res, nextHandler);
    expect(req.id).toBeDefined();

    res.emit('finish');
    const logEntry = infoSpy.mock.calls.at(-1)?.[0];
    expect(isRecord(logEntry)).toBe(true);
    if (!isRecord(logEntry)) {
      throw new Error('expected structured log entry');
    }
    const identifier = logEntry.id;
    expect(typeof identifier).toBe('string');
    if (typeof identifier !== 'string') {
      throw new Error('expected string identifier');
    }
    expect(identifier).toBe(req.id);
    expect(logEntry).toMatchObject({ method: 'POST', path: '/sessions', status: 201 });
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
