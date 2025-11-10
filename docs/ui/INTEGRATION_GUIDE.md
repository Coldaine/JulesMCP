# Jules API Integration Guide

## ✅ What This Prototype Does Right Now

**100% Client-Side Mock Data**
- Uses `/lib/mock-data.ts` for all session and activity data
- No actual API calls
- All interactions are simulated with toast notifications
- Perfect for UX validation and stakeholder demos

---

## 🔄 How to Integrate Real Jules API

### Step 1: Set Up Backend Proxy (REQUIRED)

**Why?** Jules API requires `X-Goog-Api-Key` header which CANNOT be exposed in browser code.

**Create a Node.js backend:**

```bash
mkdir jules-proxy
cd jules-proxy
npm init -y
npm install express cors dotenv
```

**Create `server.js`:**

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JULES_API_BASE = 'https://generativelanguage.googleapis.com/v1alpha';
const API_KEY = process.env.JULES_API_KEY; // Store securely!

// List sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const response = await fetch(`${JULES_API_BASE}/sessions`, {
      headers: { 'X-Goog-Api-Key': API_KEY }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create session
app.post('/api/sessions', async (req, res) => {
  try {
    const response = await fetch(`${JULES_API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session details
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const response = await fetch(
      `${JULES_API_BASE}/sessions/${req.params.id}`,
      { headers: { 'X-Goog-Api-Key': API_KEY } }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get activities
app.get('/api/sessions/:id/activities', async (req, res) => {
  try {
    const response = await fetch(
      `${JULES_API_BASE}/sessions/${req.params.id}/activities`,
      { headers: { 'X-Goog-Api-Key': API_KEY } }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve plan
app.post('/api/sessions/:id/approve', async (req, res) => {
  try {
    const response = await fetch(
      `${JULES_API_BASE}/sessions/${req.params.id}:approve`,
      {
        method: 'POST',
        headers: {
          'X-Goog-Api-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
app.post('/api/sessions/:id/message', async (req, res) => {
  try {
    const response = await fetch(
      `${JULES_API_BASE}/sessions/${req.params.id}:sendMessage`,
      {
        method: 'POST',
        headers: {
          'X-Goog-Api-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Jules proxy running on http://localhost:3001');
});
```

**Create `.env`:**
```
JULES_API_KEY=your_actual_api_key_here
```

**Run it:**
```bash
node server.js
```

---

### Step 2: Create Frontend API Client

**Create `/lib/api-client.ts`:**

```typescript
import {
  JulesSession,
  JulesActivity,
  CreateSessionRequest,
  SendMessageRequest,
  julesSessionToSession,
  julesActivityToActivity
} from './jules-api-types';
import { Session, Activity } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Fetch all sessions
 */
export async function fetchSessions(): Promise<Session[]> {
  const response = await fetch(`${API_BASE}/sessions`);
  if (!response.ok) throw new Error('Failed to fetch sessions');

  const data = await response.json();
  const sessions: JulesSession[] = data.sessions || [];

  return sessions.map(julesSessionToSession);
}

/**
 * Create a new session
 */
export async function createSession(
  repo: string,
  branch: string,
  prompt: string,
  requirePlanApproval: boolean
): Promise<Session> {
  const requestBody: CreateSessionRequest = {
    prompt,
    sourceContext: { repo, branch },
    requirePlanApproval
  };

  const response = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) throw new Error('Failed to create session');

  const julesSession: JulesSession = await response.json();
  return julesSessionToSession(julesSession);
}

/**
 * Get session details
 */
export async function fetchSession(sessionId: string): Promise<Session> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`);
  if (!response.ok) throw new Error('Failed to fetch session');

  const julesSession: JulesSession = await response.json();
  return julesSessionToSession(julesSession);
}

/**
 * Get activities for a session
 */
export async function fetchActivities(sessionId: string): Promise<Activity[]> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/activities`);
  if (!response.ok) throw new Error('Failed to fetch activities');

  const data = await response.json();
  const activities: JulesActivity[] = data.activities || [];

  return activities.map(julesActivityToActivity);
}

/**
 * Approve a plan
 */
export async function approveSession(sessionId: string): Promise<Session> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  if (!response.ok) throw new Error('Failed to approve session');

  const julesSession: JulesSession = await response.json();
  return julesSessionToSession(julesSession);
}

/**
 * Send a message to Jules
 */
export async function sendMessage(sessionId: string, content: string): Promise<void> {
  const requestBody: SendMessageRequest = { content };

  const response = await fetch(`${API_BASE}/sessions/${sessionId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) throw new Error('Failed to send message');
}
```

---

### Step 3: Replace Mock Data in App.tsx

**Current (Mock):**
```typescript
import { mockSessions } from './lib/mock-data';

// Inside component
const filteredSessions = mockSessions.filter(...);
```

**Updated (Real API):**
```typescript
import { useState, useEffect } from 'react';
import { fetchSessions, createSession } from './lib/api-client';
import { Session } from './lib/types';

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoading(true);
      const data = await fetchSessions();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  // Filter sessions client-side
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchQuery === '' ||
      session.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // ... rest of filter logic
    return matchesSearch && matchesStatus;
  });

  // Create session handler
  const handleCreateJob = async () => {
    if (!repo || !prompt.trim()) {
      toast.error('Please fill in repository and prompt');
      return;
    }

    try {
      const newSession = await createSession(repo, branch, prompt, requireApproval);
      setSessions([newSession, ...sessions]); // Add to list
      setSelectedSessionId(newSession.id);    // Auto-select
      toast.success('Session created successfully!');

      // Reset form
      setRepo('');
      setBranch('main');
      setPrompt('');
    } catch (err) {
      toast.error('Failed to create session');
      console.error(err);
    }
  };

  // ... rest of component
}
```

---

### Step 4: Add Real-time Polling

Since Jules API doesn't have WebSockets, poll for updates:

```typescript
useEffect(() => {
  if (!selectedSessionId) return;

  const session = sessions.find(s => s.id === selectedSessionId);
  if (!session) return;

  // Don't poll if session is in terminal state
  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(session.status)) {
    return;
  }

  // Poll every 3 seconds
  const interval = setInterval(async () => {
    try {
      const updated = await fetchSession(selectedSessionId);
      setSessions(sessions.map(s => s.id === selectedSessionId ? updated : s));
    } catch (err) {
      console.error('Failed to poll session:', err);
    }
  }, 3000);

  return () => clearInterval(interval);
}, [selectedSessionId, sessions]);
```

---

### Step 5: Update Session Detail Component

**In `/components/session-detail.tsx`:**

```typescript
import { fetchActivities, approveSession, sendMessage } from '../lib/api-client';

export function SessionDetail({ session }: SessionDetailProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Load activities
  useEffect(() => {
    loadActivities();
  }, [session.id]);

  async function loadActivities() {
    try {
      setLoading(true);
      const data = await fetchActivities(session.id);
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async () => {
    try {
      await approveSession(session.id);
      toast.success('Plan approved!');
      // Trigger parent to reload session
    } catch (err) {
      toast.error('Failed to approve plan');
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(session.id, message);
      toast.success('Message sent');
      // Reload activities to see new message
      await loadActivities();
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  // ... rest of component
}
```

---

## 🎯 Migration Checklist

### Phase 1: Backend Setup
- [ ] Create Node.js proxy server
- [ ] Get Jules API key from Google
- [ ] Test all endpoints with curl/Postman
- [ ] Deploy proxy to production (Railway, Render, etc.)

### Phase 2: Frontend API Client
- [ ] Create `/lib/api-client.ts`
- [ ] Test each API function independently
- [ ] Add error handling and retries

### Phase 3: Replace Mock Data
- [ ] Update `App.tsx` to use `fetchSessions()`
- [ ] Update `handleCreateJob` to use `createSession()`
- [ ] Add loading states (Skeleton screens)
- [ ] Add error states

### Phase 4: Real-time Updates
- [ ] Implement polling for active sessions
- [ ] Poll activities when session detail is open
- [ ] Stop polling for completed sessions

### Phase 5: Polish
- [ ] Add optimistic updates
- [ ] Add request caching
- [ ] Add retry logic
- [ ] Add connection status indicator

---

## 🚨 Important Notes

### What Won't Work Without Changes

1. **Search/Filter** - Jules API might not support query params
   - Solution: Fetch all, filter client-side (current approach)

2. **Plan in Session Object** - Plan might only be in activities
   - Solution: Find first PLAN activity and display that

3. **Cancel Session** - Method unclear from docs
   - Solution: Disable until confirmed with Jules team

4. **PR URLs** - Jules doesn't create PRs
   - Solution: Show artifacts/diffs instead

### Security Considerations

- ✅ API key stored server-side only
- ✅ CORS configured on backend
- ⚠️ Add authentication (OAuth, JWT) before production
- ⚠️ Add rate limiting on proxy
- ⚠️ Validate all inputs

### Performance Tips

- Use React Query or SWR for caching
- Debounce search input
- Paginate session list if > 50 items
- Show skeletons during loading

---

## 📚 Additional Resources

- Jules API Docs: [Link when available]
- Backend Proxy Template: See `server.js` above
- Type Definitions: `/lib/jules-api-types.ts`
- Integration Examples: This guide

---

**Questions?** Check `/JULES_API_AUDIT.md` for feature compatibility details.
