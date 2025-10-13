import type { CreateSessionInput, JulesSession, SessionActivity } from '../shared/types.js';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001';
const TOKEN = process.env.LOCAL_TOKEN ?? 'local-dev-token';

async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return (await response.json()) as T;
}

async function run() {
  console.log('▶ Creating session');
  const payload: CreateSessionInput = {
    repo: 'example/repo',
    summary: 'demo via client-example.ts',
    participants: ['cli-user'],
  };
  const created = await http<JulesSession>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  console.log('Created session:', created.id);

  console.log('▶ Listing sessions');
  const list = await http<{ sessions: JulesSession[] }>('/api/sessions');
  console.log(`Total sessions: ${list.sessions.length}`);

  console.log('▶ Approving session');
  const approved = await http<JulesSession>(`/api/sessions/${created.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ state: 'approved' }),
  });
  console.log('Approval state:', approved.approval);

  console.log('▶ Sending message');
  await http(`/api/sessions/${created.id}/message`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Client example ping' }),
  });
  console.log('Message sent');

  console.log('▶ Fetching activities');
  const activities = await http<{ activities: SessionActivity[] }>(
    `/api/sessions/${created.id}/activities`,
  );
  console.log(`Activities returned: ${activities.activities.length}`);
}

run().catch((error) => {
  console.error('Client example failed:', error.message);
  process.exit(1);
});
