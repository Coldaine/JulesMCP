import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';

import cors from 'cors';
import { config as loadEnv } from 'dotenv';
import express, { json as expressJson, static as expressStatic } from 'express';
import helmet from 'helmet';

import { authHttp } from './auth.js';
import { doJson, JulesHttpError } from './julesClient.js';
import { logError, logEvent, logger, withRequestId } from './logging.js';
import sessionsRouter from './routes/sessions.js';
import { ipAllow, rateLimit } from './security.js';
import { setupWebSockets } from './ws.js';

const envPath = process.env.ENV_FILE ?? path.resolve(process.cwd(), 'backend', '.env');
if (fs.existsSync(envPath)) {
  loadEnv({ path: envPath });
} else {
  loadEnv();
}

const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' } }));
app.use(expressJson({ limit: '1mb' }));
app.use(withRequestId);

if (process.env.CORS_ORIGIN) {
  const origins = process.env.CORS_ORIGIN.split(',').map((value) => value.trim()).filter(Boolean);
  app.use(
    cors({
      origin: origins,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    }),
  );
}

const publicDir = path.resolve(process.cwd(), 'backend', 'public');
if (fs.existsSync(publicDir)) {
  app.use(expressStatic(publicDir, { setHeaders: (res) => res.setHeader('Cache-Control', 'no-store') }));
}

app.use('/api', ipAllow, rateLimit(60), authHttp, sessionsRouter);

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/readyz', async (_req, res) => {
  try {
    await doJson('/sessions?limit=1', { method: 'GET', timeoutMs: 1_000 });
    res.json({ status: 'ok' });
  } catch (error) {
    if (error instanceof JulesHttpError) {
      res.status(503).json({ status: 'degraded', reason: error.status });
      return;
    }
    res.status(503).json({ status: 'degraded' });
  }
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError({ msg: 'unhandled_error', route: req.path, err });
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(500).json({ error: 'internal_error' });
});

const server = http.createServer(app);
const wsManager = setupWebSockets(server);
const shutdown = wsManager.shutdown;

const port = Number(process.env.PORT ?? 3001);

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => {
    logger.info({ msg: 'server_started', port });
  });
}

process.on('SIGTERM', () => {
  logEvent({ msg: 'signal', signal: 'SIGTERM' });
  shutdown();
  server.close();
});

process.on('SIGINT', () => {
  logEvent({ msg: 'signal', signal: 'SIGINT' });
  shutdown();
  server.close();
});

export { app, server, shutdown };
