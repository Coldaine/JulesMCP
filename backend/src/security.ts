import type { RequestHandler } from 'express';

const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export function sanitizeIp(ip?: string | null): string {
  return (ip ?? '').replace(/^::ffff:/, '');
}

export function isIpAllowed(ip?: string | null): boolean {
  const allowlist = (process.env.ALLOWLIST ?? '')
    .split(',')
    .map((prefix) => prefix.trim())
    .filter(Boolean);
  if (!allowlist.length) {
    return true;
  }
  const candidate = sanitizeIp(ip);
  if (!candidate) {
    return false;
  }
  return allowlist.some((prefix) => candidate.startsWith(prefix));
}

export const ipAllow: RequestHandler = (req, res, next) => {
  if (isIpAllowed(req.ip)) {
    return next();
  }
  return res.status(403).json({ error: 'forbidden' });
};

function consumeRateLimit(identifier: string, max: number, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const arr = (hits.get(identifier) ?? []).filter((value) => now - value < windowMs);
  arr.push(now);
  hits.set(identifier, arr);
  return arr.length > max;
}

export function rateLimit(max = 60): RequestHandler {
  return (req, res, next) => {
    const key = `${sanitizeIp(req.ip)}:${req.path}`;
    if (consumeRateLimit(key, max)) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    return next();
  };
}

export function enforceRateLimit(identifier: string, max = 60, windowMs = WINDOW_MS): boolean {
  return consumeRateLimit(identifier, max, windowMs);
}

export function resetRateLimits(): void {
  hits.clear();
}
