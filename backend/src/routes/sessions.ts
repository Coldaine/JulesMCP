import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import {
  JulesHttpError,
  approveSession,
  createSession,
  getSession,
  listActivities,
  listSessions,
  sendMessage,
} from '../julesClient.js';
import { logError } from '../logging.js';

const router = Router();

const planStatusSchema = z.enum(['pending', 'in_progress', 'succeeded', 'failed']);
const approvalStateSchema = z.enum(['pending', 'approved', 'rejected']);

const createSessionSchema = z.object({
  repo: z.string().min(1),
  branch: z.string().min(1).optional(),
  summary: z.string().max(2000).optional(),
  metadata: z.record(z.any()).optional(),
  participants: z.array(z.string().min(1)).optional(),
});

const approveSchema = z.object({
  state: approvalStateSchema.default('approved'),
});

const messageSchema = z.object({
  message: z.string().min(1).max(4000),
});

const sessionsQuerySchema = z.object({
  status: planStatusSchema.optional(),
  repo: z.string().optional(),
});

router.get('/sessions', async (req, res, next) => {
  try {
    const query = sessionsQuerySchema.parse(req.query);
    const data = await listSessions(query);
    return res.json(data);
  } catch (error) {
    return handleError(error, req, res, next);
  }
});

router.post('/sessions', async (req, res, next) => {
  try {
    const body = createSessionSchema.parse(req.body);
    const session = await createSession(body);
    return res.status(201).json(session);
  } catch (error) {
    return handleError(error, req, res, next);
  }
});

router.get('/sessions/:id', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id);
    return res.json(session);
  } catch (error) {
    return handleError(error, req, res, next);
  }
});

router.get('/sessions/:id/activities', async (req, res, next) => {
  try {
    const activities = await listActivities(req.params.id);
    return res.json({ activities });
  } catch (error) {
    return handleError(error, req, res, next);
  }
});

router.post('/sessions/:id/approve', async (req, res, next) => {
  try {
    const { state } = approveSchema.parse(req.body ?? {});
    const session = await approveSession(req.params.id, state);
    return res.json(session);
  } catch (error) {
    return handleError(error, req, res, next);
  }
});

router.post('/sessions/:id/message', async (req, res, next) => {
  try {
    const { message } = messageSchema.parse(req.body ?? {});
    const response = await sendMessage(req.params.id, message);
    return res.json(response);
  } catch (error) {
    return handleError(error, req, res, next);
  }
});

function handleError(error: unknown, req: Request, res: Response, next: NextFunction) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: 'invalid_request', details: error.flatten() });
  }
  if (error instanceof JulesHttpError) {
    if (error.status === 408) {
      return res.status(408).json({ error: 'jules_timeout' });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'jules_rate_limited' });
    }
    if (error.status >= 500) {
      return res.status(502).json({ error: 'jules_unavailable', retry: true });
    }
    return res.status(error.status).json({ error: 'jules_error', detail: error.body });
  }
  logError({ msg: 'route_error', route: req.path, err: error as Error });
  return next(error);
}

export default router;
