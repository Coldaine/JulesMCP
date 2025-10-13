import type { RequestHandler } from 'express';

export const ipAllow: RequestHandler = (req, res, next) => {
  const allowlist = (process.env.ALLOWLIST ?? '')
    .split(',')
    .map((prefix) => prefix.trim())
    .filter(Boolean);
  if (!allowlist.length) {
    return next();
  }
  const ip = (req.ip ?? '').replace('::ffff:', '');
  if (allowlist.some((prefix) => ip.startsWith(prefix))) {
    return next();
  }
  return res.status(403).json({ error: 'forbidden' });
};

export function rateLimit(max = 60): RequestHandler {
  const hits = new Map<string, number[]>();
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const arr = (hits.get(key) ?? []).filter((value) => now - value < 60_000);
    arr.push(now);
    hits.set(key, arr);
    if (arr.length > max) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    return next();
  };
}
