import { randomUUID } from 'crypto';
import pino from 'pino';
import type { RequestHandler } from 'express';

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const logger = pino({
  level,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', 'res.headers', 'headers.authorization'],
    remove: true,
  },
});

export const withRequestId: RequestHandler = (req, res, next) => {
  (req as any).id = req.headers['x-request-id'] ?? randomUUID();
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      id: (req as any).id,
      at: 'req',
      method: req.method,
      path: req.path,
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
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
        (value as Record<string, unknown>)[key] = '[redacted]';
      }
    }
  }
  return value;
}

function truncate(value: string, max = 300): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function attachRequestId(req: { id?: string }): string {
  if (!req.id) {
    req.id = randomUUID();
  }
  return req.id;
}
