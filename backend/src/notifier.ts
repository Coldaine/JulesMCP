import fetch from 'node-fetch';

import type { SessionDelta } from '@shared/types';
import { logError, logEvent } from './logging.js';

const webhookUrl = process.env.NOTIFY_WEBHOOK ?? '';

export async function notifyDelta(deltas: SessionDelta[]): Promise<void> {
  if (!webhookUrl || !deltas.length) {
    return;
  }
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'session_update', delta: deltas }),
    });
    logEvent({ msg: 'notifier_webhook', count: deltas.length });
  } catch (error) {
    logError({ msg: 'notifier_failed', err: error as Error });
  }
}
