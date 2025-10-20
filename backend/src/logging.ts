import { randomUUID } from 'node:crypto';

import createPino, { stdTimeFunctions } from 'pino';

import type { Request, RequestHandler } from 'express';


const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const logger = createPino({
  level,
  base: undefined,
  timestamp: stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', 'res.headers', 'headers.authorization'],
    remove: true,
  },
});

type RequestWithId = Request & { id?: string };

export const withRequestId: RequestHandler = (req, res, next) => {
  const request = req as RequestWithId;
  const header = req.headers['x-request-id'];
  const requestId = Array.isArray(header) ? header[0] : header;
  request.id = requestId ?? randomUUID();
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      id: request.id,
      at: 'req',
      method: request.method,
      path: request.path,
      status: res.statusCode,
      ms: Date.now() - start,
    });
  });
  next();
};

export function logEvent(event: Record<string, unknown>): void {
  logger.info(filterValue(event));
}

export function logError(event: Record<string, unknown> & { err: Error }): void {
  const { err, ...rest } = event;
  logger.error({ ...filterValue(rest), err: { message: truncate(err.message), stack: err.stack } });
}

function filterValue<T>(value: T): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
        record[key] = '[redacted]';
      }
    }
  }
  return value;
}

function truncate(value: string, max = 300): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export function attachRequestId(req: { id?: string }): string {
  if (!req.id) {
    req.id = randomUUID();
  }
  return req.id;
}
