import type { IncomingMessage } from 'node:http';

import type { RequestHandler } from 'express';

export const authHttp: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token && token === process.env.LOCAL_TOKEN) {
    return next();
  }
  return res.status(401).json({ error: 'unauthorized' });
};

export function authWs(req: Pick<IncomingMessage, 'headers'>): boolean {
  const protocols = (req.headers['sec-websocket-protocol'] ?? '')
    .toString()
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const bearer = protocols.find((value) => value.toLowerCase().startsWith('bearer.'));
  const token = bearer?.split('.')[1];
  return token === process.env.LOCAL_TOKEN && Boolean(token);
}
