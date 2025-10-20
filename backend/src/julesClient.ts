import type { CreateSessionInput, JulesSession, SessionActivity } from '@shared/types';
import fetch, { Headers, type RequestInit } from 'node-fetch';

import { logError, logEvent } from './logging.js';

const USER_AGENT = 'jules-control-room/1.0';
const MAX_ATTEMPTS = 4;
const DEFAULT_TIMEOUT = 10_000;

export class JulesHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(message);
  }
}

const apiBase = () => process.env.JULES_API_BASE ?? 'https://api.jules.ai/v1';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function doJson<T = unknown>(path: string, init: FetchOptions = {}, attempt = 0): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? DEFAULT_TIMEOUT);
  const url = path.startsWith('http') ? path : `${apiBase()}${path}`;

  try {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('User-Agent', USER_AGENT);
    if (process.env.JULES_API_KEY) {
      headers.set('X-Goog-Api-Key', process.env.JULES_API_KEY);
    }
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers,
    });

    const text = await response.text();
    const status = response.status;
    const success = response.ok;

    if (!success) {
      if ((status === 429 || status >= 500) && attempt < MAX_ATTEMPTS) {
        const delay = 300 * 2 ** attempt + Math.random() * 200;
        await sleep(delay);
        return doJson<T>(path, init, attempt + 1);
      }
      throw new JulesHttpError(`Jules ${status}`, status, text.slice(0, 300));
    }

    const trimmed = text.trim();
    return trimmed ? (JSON.parse(trimmed) as T) : (null as T);
  } catch (error) {
    if (error instanceof JulesHttpError) {
      throw error;
    }
    if ((error as Error).name === 'AbortError') {
      throw new JulesHttpError('Jules timeout', 408, '');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createSession(input: CreateSessionInput): Promise<JulesSession> {
  const start = Date.now();
  try {
    const session = await doJson<JulesSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    logEvent({ msg: 'create_session', status: 'ok', elapsed: Date.now() - start });
    return session;
  } catch (err) {
    handleClientError('create_session', err, start);
    throw err;
  }
}

export async function listSessions(params: { status?: string; repo?: string } = {}): Promise<{
  sessions: JulesSession[];
}> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.repo) search.set('repo', params.repo);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  const start = Date.now();
  try {
    const data = await doJson<{ sessions: JulesSession[] }>(`/sessions${suffix}`, { method: 'GET' });
    logEvent({ msg: 'list_sessions', status: 'ok', elapsed: Date.now() - start });
    return data;
  } catch (err) {
    handleClientError('list_sessions', err, start);
    throw err;
  }
}

export async function getSession(id: string): Promise<JulesSession> {
  const start = Date.now();
  try {
    const session = await doJson<JulesSession>(`/sessions/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
    logEvent({ msg: 'get_session', status: 'ok', elapsed: Date.now() - start });
    return session;
  } catch (err) {
    handleClientError('get_session', err, start);
    throw err;
  }
}

export async function listActivities(id: string): Promise<SessionActivity[]> {
  const start = Date.now();
  try {
    const data = await doJson<{ activities: SessionActivity[] }>(
      `/sessions/${encodeURIComponent(id)}/activities`,
      { method: 'GET' },
    );
    logEvent({ msg: 'list_activities', status: 'ok', elapsed: Date.now() - start });
    return data.activities;
  } catch (err) {
    handleClientError('list_activities', err, start);
    throw err;
  }
}

export async function approveSession(id: string, state: 'approved' | 'rejected'): Promise<JulesSession> {
  const start = Date.now();
  try {
    const data = await doJson<JulesSession>(`/sessions/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ state }),
    });
    logEvent({ msg: 'approve_session', status: 'ok', elapsed: Date.now() - start });
    return data;
  } catch (err) {
    handleClientError('approve_session', err, start);
    throw err;
  }
}

export async function sendMessage(id: string, message: string): Promise<{ ok: boolean }> {
  const start = Date.now();
  try {
    const data = await doJson<{ ok: boolean }>(`/sessions/${encodeURIComponent(id)}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    logEvent({ msg: 'send_message', status: 'ok', elapsed: Date.now() - start });
    return data;
  } catch (err) {
    handleClientError('send_message', err, start);
    throw err;
  }
}

function handleClientError(operation: string, error: unknown, start: number): void {
  if (error instanceof JulesHttpError) {
    logEvent({ msg: operation, status: error.status, elapsed: Date.now() - start, error: error.body });
    return;
  }
  logError({ msg: operation, elapsed: Date.now() - start, err: error as Error });
}
