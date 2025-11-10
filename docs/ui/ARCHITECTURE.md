# Jules Control Room - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Jules Control Room UI (React)                 │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐    │  │
│  │  │ Jobs Panel   │  │  New Job     │  │   Session   │    │  │
│  │  │ (Search/List)│  │  Form        │  │   Detail    │    │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘    │  │
│  │                                                            │  │
│  │  Currently: Mock data in /lib/mock-data.ts                │  │
│  │  Production: Calls API client (/lib/api-client.ts)        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ fetch() HTTP requests
                              │ (Cannot go directly to Jules - API key would leak!)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR BACKEND PROXY                           │
│                   (Node.js/Express Server)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  GET  /api/sessions          → List all sessions         │  │
│  │  POST /api/sessions          → Create new session        │  │
│  │  GET  /api/sessions/:id      → Get session details       │  │
│  │  GET  /api/sessions/:id/activities → Get activity list   │  │
│  │  POST /api/sessions/:id/approve → Approve plan           │  │
│  │  POST /api/sessions/:id/message → Send message           │  │
│  │                                                            │  │
│  │  • Adds X-Goog-Api-Key header (from env var)             │  │
│  │  • Forwards requests to Jules API                         │  │
│  │  • Returns responses to frontend                          │  │
│  │  • Handles errors                                         │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS with API key
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GOOGLE JULES API (v1alpha)                      │
│          https://generativelanguage.googleapis.com               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  POST /v1alpha/sessions                                   │  │
│  │  GET  /v1alpha/sessions                                   │  │
│  │  GET  /v1alpha/sessions/{id}                              │  │
│  │  GET  /v1alpha/sessions/{id}/activities                   │  │
│  │  POST /v1alpha/sessions/{id}:approve                      │  │
│  │  POST /v1alpha/sessions/{id}:sendMessage                  │  │
│  │                                                            │  │
│  │  • Requires X-Goog-Api-Key header                         │  │
│  │  • Manages coding sessions                                │  │
│  │  • Returns structured JSON responses                      │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Example: Creating a Session

### Step 1: User Fills Form
```
User in browser:
┌─────────────────────────┐
│ Repository: web-app     │
│ Branch: main            │
│ Prompt: Add auth...     │
│ [✓] Require Approval    │
│                         │
│    [Create Session]     │
└─────────────────────────┘
```

### Step 2: Frontend Calls Backend
```javascript
// /lib/api-client.ts
const response = await fetch('http://localhost:3001/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Add authentication...",
    sourceContext: {
      repo: "acme-corp/web-app",
      branch: "main"
    },
    requirePlanApproval: true
  })
});
```

### Step 3: Backend Forwards to Jules
```javascript
// Backend proxy server.js
app.post('/api/sessions', async (req, res) => {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1alpha/sessions',
    {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': process.env.JULES_API_KEY,  // Secret!
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    }
  );
  const data = await response.json();
  res.json(data);
});
```

### Step 4: Jules API Response
```json
{
  "name": "sessions/abc123",
  "state": "QUEUED",
  "createTime": "2025-10-13T10:00:00Z",
  "updateTime": "2025-10-13T10:00:00Z",
  "sourceContext": {
    "repo": "acme-corp/web-app",
    "branch": "main"
  },
  "prompt": "Add authentication...",
  "requirePlanApproval": true
}
```

### Step 5: Frontend Transforms & Displays
```typescript
// /lib/jules-api-types.ts
function julesSessionToSession(julesSession) {
  return {
    id: julesSession.name.split('/')[1],  // Extract "abc123"
    repo: julesSession.sourceContext.repo,
    branch: julesSession.sourceContext.branch,
    status: julesSession.state,
    prompt: julesSession.prompt,
    createdAt: julesSession.createTime,
    updatedAt: julesSession.updateTime,
    requirePlanApproval: julesSession.requirePlanApproval
  };
}
```

### Step 6: UI Updates
```
Jobs Panel:
┌──────────────────────────┐
│ [•] Queued              │
│ abc123                   │
│ web-app / main          │
│ Add authentication...    │
│ Just now                 │
└──────────────────────────┘
```

---

## Real-time Updates Flow

Since Jules doesn't provide WebSockets, we poll:

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Session Detail Modal)                             │
│                                                              │
│  useEffect(() => {                                          │
│    const interval = setInterval(async () => {              │
│      // 1. Poll session status                             │
│      const session = await fetchSession(id);               │
│      updateSessionState(session);                           │
│                                                              │
│      // 2. Poll activities                                 │
│      const activities = await fetchActivities(id);         │
│      updateActivityList(activities);                        │
│    }, 3000);  // Every 3 seconds                           │
│                                                              │
│    return () => clearInterval(interval);                   │
│  }, [sessionId]);                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ Every 3s
                    ▼
         ┌──────────────────┐
         │ Backend Proxy    │
         └──────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │ Jules API        │
         │                  │
         │ state: PLANNING  │
         │   ↓              │
         │ state: AWAITING  │
         │   ↓              │
         │ state: PROGRESS  │
         │   ↓              │
         │ state: COMPLETED │
         └──────────────────┘
```

**Stop Polling When:**
- Session state = COMPLETED
- Session state = FAILED
- Session state = CANCELLED
- User closes the session detail modal

---

## Component Hierarchy

```
App
├── TooltipProvider (global)
├── Toaster (notifications)
├── Header
│   ├── Toggle Jobs Panel Button
│   ├── App Title + Logo
│   └── Theme Switcher
│
├── Jobs Panel (slide-out)
│   ├── Search Input
│   ├── Status Filter Buttons (All, Queued, Planning, etc.)
│   └── Job List (scrollable)
│       └── Job Items (status, repo, prompt snippet)
│
├── Main Content
│   └── New Job Form
│       ├── Repository Select
│       ├── Branch Input
│       ├── Prompt Textarea
│       ├── Quick Templates (buttons)
│       ├── Session Options (Require Approval toggle)
│       └── Create Session Button
│
└── Session Detail Modal (when job selected)
    ├── Header
    │   ├── Badges (repo, branch, status)
    │   ├── Session ID + Copy Button
    │   └── Action Buttons (Approve, Cancel, Refresh)
    │
    └── Tabs
        ├── Activity Tab
        │   └── Activity Cards (timeline)
        ├── Messages Tab
        │   ├── Message List
        │   └── Message Composer
        ├── Plan Tab
        │   └── Plan Text + Approve Button
        └── Prompt Tab
            └── Original Prompt Display
```

---

## State Management

### App.tsx State
```typescript
// Theme
const [theme, setTheme] = useState<'light' | 'dark'>('light');

// UI State
const [jobsPanelOpen, setJobsPanelOpen] = useState(false);
const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

// Filtering
const [searchQuery, setSearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState<SessionStatus[]>([]);

// Form State
const [repo, setRepo] = useState('');
const [branch, setBranch] = useState('main');
const [prompt, setPrompt] = useState('');
const [requireApproval, setRequireApproval] = useState(true);

// Data (Currently mock, will be from API)
const [sessions, setSessions] = useState<Session[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### SessionDetail.tsx State
```typescript
const [activities, setActivities] = useState<Activity[]>([]);
const [loading, setLoading] = useState(true);
```

**No global state management library needed** - React's built-in state is sufficient for this application.

---

## File Organization

```
jules-control-room/
│
├── Frontend (This Figma Make Project)
│   ├── /components/
│   │   ├── status-light.tsx
│   │   ├── activity-card.tsx
│   │   ├── message-composer.tsx
│   │   ├── session-detail.tsx
│   │   └── /ui/              (shadcn components)
│   │
│   ├── /lib/
│   │   ├── types.ts          (Internal data types)
│   │   ├── jules-api-types.ts (Jules API response types)
│   │   ├── mock-data.ts      (DELETE in production)
│   │   └── api-client.ts     (CREATE for production)
│   │
│   ├── /styles/
│   │   └── globals.css       (Design system)
│   │
│   └── App.tsx               (Main entry point)
│
└── Backend (To Be Created)
    ├── server.js             (Express server)
    ├── .env                  (API keys)
    ├── package.json
    └── /routes/
        └── sessions.js       (Session endpoints)
```

---

## API Endpoint Mapping

| Frontend Action | Frontend Calls | Backend Proxies To | Jules API Endpoint |
|----------------|----------------|--------------------|--------------------|
| Create Session | `POST /api/sessions` | → | `POST /v1alpha/sessions` |
| List Sessions | `GET /api/sessions` | → | `GET /v1alpha/sessions` |
| View Details | `GET /api/sessions/:id` | → | `GET /v1alpha/sessions/{id}` |
| View Activity | `GET /api/sessions/:id/activities` | → | `GET /v1alpha/sessions/{id}/activities` |
| Approve Plan | `POST /api/sessions/:id/approve` | → | `POST /v1alpha/sessions/{id}:approve` |
| Send Message | `POST /api/sessions/:id/message` | → | `POST /v1alpha/sessions/{id}:sendMessage` |

---

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Browser                                        │
│ • No API keys stored                                    │
│ • Only makes requests to YOUR backend                  │
│ • CORS protected                                        │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Your Backend Proxy                            │
│ • API key stored in environment variable               │
│ • Rate limiting                                         │
│ • Request validation                                    │
│ • Authentication (OAuth, JWT)                          │
│ • Logging & monitoring                                 │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Jules API                                     │
│ • Validates API key                                     │
│ • Processes coding tasks                               │
│ • Returns structured responses                         │
└─────────────────────────────────────────────────────────┘
```

---

## Error Handling Strategy

### Frontend
```typescript
try {
  const session = await createSession(repo, branch, prompt, requireApproval);
  setSessions([session, ...sessions]);
  toast.success('Session created!');
} catch (error) {
  if (error.message.includes('401')) {
    toast.error('Authentication failed. Please check API key.');
  } else if (error.message.includes('429')) {
    toast.error('Rate limit exceeded. Please try again later.');
  } else {
    toast.error('Failed to create session. Please try again.');
  }
  console.error('Create session error:', error);
}
```

### Backend
```javascript
app.post('/api/sessions', async (req, res) => {
  try {
    // Validate input
    if (!req.body.prompt || !req.body.sourceContext) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Call Jules API
    const response = await fetch(JULES_API + '/sessions', {
      method: 'POST',
      headers: { 'X-Goog-Api-Key': API_KEY, ... },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json(error);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Jules API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## Performance Considerations

### Polling Strategy
```typescript
// Only poll active sessions
const POLL_INTERVAL = 3000; // 3 seconds

// Stop polling for terminal states
const TERMINAL_STATES = ['COMPLETED', 'FAILED', 'CANCELLED'];

useEffect(() => {
  if (!selectedSession) return;
  if (TERMINAL_STATES.includes(selectedSession.status)) return;

  const interval = setInterval(pollSession, POLL_INTERVAL);
  return () => clearInterval(interval);
}, [selectedSession]);
```

### Caching (Future Enhancement)
```typescript
// Use React Query or SWR for caching
import { useQuery } from '@tanstack/react-query';

const { data: sessions } = useQuery({
  queryKey: ['sessions'],
  queryFn: fetchSessions,
  refetchInterval: 5000,  // Auto-refresh every 5s
  staleTime: 2000,        // Consider data stale after 2s
});
```

---

## Deployment Architecture

### Option 1: Separate Deployments
```
Frontend: Vercel/Netlify
  ↓
Backend: Railway/Render
  ↓
Jules API: Google Cloud
```

### Option 2: Monorepo
```
Single deployment: Vercel (Next.js)
├── /app (Frontend)
└── /api (Backend routes)
  ↓
Jules API: Google Cloud
```

---

## Next Steps for Backend Team

1. **Get Jules API Access**
   - Obtain API key from Google
   - Read official Jules API documentation
   - Test endpoints with curl/Postman

2. **Set Up Local Development**
   - Create Express server with endpoints
   - Test with frontend mock data first
   - Gradually replace with real API calls

3. **Deploy Backend**
   - Choose hosting (Railway, Render, Fly.io)
   - Set up environment variables
   - Configure CORS for frontend domain

4. **Connect Frontend**
   - Frontend team updates API_BASE URL
   - Test all workflows end-to-end
   - Monitor errors and performance

5. **Production Hardening**
   - Add authentication
   - Set up logging (Datadog, LogRocket)
   - Configure rate limiting
   - Set up error tracking (Sentry)

---

**Questions?** See `/INTEGRATION_GUIDE.md` for step-by-step implementation details.
