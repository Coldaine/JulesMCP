import type { RequestHandler } from 'express';

const WINDOW_MS = 60_000;
// Global hits backing helper functions used by tests and ws upgrade logic
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
  // Drop timestamps outside the rolling window and guard against clock going backwards
  const arr = (hits.get(identifier) ?? []).filter((value) => now >= value && now - value < windowMs);
  arr.push(now);
  hits.set(identifier, arr);
  return arr.length > max;
}

export function rateLimit(max = 60): RequestHandler {
  // Use a per-middleware store to avoid interference across apps/tests
  const localHits = new Map<string, number[]>();
  return (req, res, next) => {
    const now = Date.now();
    const key = `${sanitizeIp(req.ip)}:${req.path}`;
    const arr = (localHits.get(key) ?? []).filter((value) => now >= value && now - value < WINDOW_MS);
    arr.push(now);
    localHits.set(key, arr);
    if (arr.length > max) {
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
