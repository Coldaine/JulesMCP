# Jules Control Room - Backend Integration Brief

## Executive Summary

This is a **complete React prototype** of a mission control dashboard for managing Jules (Google's AI coding agent) sessions. The prototype was built using modern React patterns and is **100% functional with mock data** for UX validation.

**What this prototype does:**
- Demonstrates the complete user experience for creating and monitoring Jules coding sessions
- Uses realistic mock data that matches expected backend API response shapes
- Shows all UI states, interactions, and workflows
- Validates the information architecture before building production infrastructure

**What happens next:**
- Backend team builds API proxy for Jules API
- Replace mock data with real API client
- Add real-time updates (WebSocket or polling)
- Deploy as integrated full-stack application

---

## Architecture Overview

### Frontend Stack (What We Built)
```
React 18 + TypeScript
Tailwind CSS v4 (with custom design tokens)
shadcn/ui component library
Lucide React icons
date-fns for time formatting
```

### Current State: Prototype
- ✅ Complete UI/UX implementation
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Light/dark themes
- ✅ Mock data simulating backend API responses
- ✅ All interaction patterns defined
- ❌ No real API calls (uses mock data)
- ❌ No authentication
- ❌ No WebSocket connections
- ❌ No server-side logic

---

## Data Model

### Session States (TypeScript Enum)
```typescript
type SessionStatus =
  | 'QUEUED'           // Job is waiting to start
  | 'PLANNING'         // Jules is analyzing and creating a plan
  | 'AWAITING_PLAN_APPROVAL'  // Waiting for user to approve/reject plan
  | 'IN_PROGRESS'      // Jules is executing the plan
  | 'COMPLETED'        // Session finished successfully
  | 'FAILED'           // Session encountered an error
  | 'CANCELLED'        // User cancelled the session
```

### Core Data Types

**Session Object** (`/lib/types.ts`)
```typescript
interface Session {
  id: string;                    // Format: "ses_a7k9m2p4"
  repo: string;                  // "org/repo-name"
  branch: string;                // "main" or feature branch
  status: SessionStatus;         // Current state
  prompt: string;                // User's original request
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  requirePlanApproval: boolean;  // Whether to pause for approval
  autoCreatePR: boolean;         // Auto-create PR when complete
  prUrl?: string;                // GitHub PR URL (when created)
  plan?: string;                 // Jules' execution plan (markdown/text)
}
```

**Activity Object** (`/lib/types.ts`)
```typescript
interface Activity {
  id: string;                    // Format: "act_1"
  sessionId: string;             // Parent session ID
  type: ActivityType;            // See below
  content: string;               // Message/description
  timestamp: string;             // ISO 8601 timestamp
  metadata?: {
    fileName?: string;           // For ARTIFACT type
    diffUrl?: string;            // Link to diff/PR
    progress?: number;           // 0-100 for PROGRESS type
  };
}

type ActivityType =
  | 'AGENT_MESSAGE'    // Jules sending a message
  | 'PLAN'             // Jules created an execution plan
  | 'ARTIFACT'         // Jules created/modified a file
  | 'PROGRESS'         // Progress update (with percentage)
  | 'USER_MESSAGE'     // User sent a message to Jules
  | 'APPROVAL'         // User approved a plan
  | 'REJECTION'        // User rejected a plan
```

---

## API Endpoints Needed

### 1. List Sessions
```
GET /api/sessions
Query params:
  - status?: SessionStatus[]  (filter by status)
  - repo?: string             (filter by repository)
  - search?: string           (search across all text fields)
  - limit?: number
  - offset?: number

Response: Session[]
```

### 2. Create Session
```
POST /api/sessions
Body: {
  repo: string;
  branch: string;
  prompt: string;
  requirePlanApproval: boolean;
  autoCreatePR: boolean;
}

Response: Session
```

### 3. Get Session Details
```
GET /api/sessions/:id

Response: Session
```

### 4. Get Activity Stream
```
GET /api/sessions/:id/activities
Query params:
  - type?: ActivityType[]  (filter by activity type)
  - limit?: number
  - offset?: number

Response: Activity[]
```

### 5. Send Message to Jules
```
POST /api/sessions/:id/message
Body: {
  content: string;
}

Response: Activity (the USER_MESSAGE activity created)
```

### 6. Approve Plan
```
POST /api/sessions/:id/approve
Body: {
  note?: string;  (optional approval comment)
}

Response: Session (with updated status)
```

### 7. Reject/Cancel Session
```
POST /api/sessions/:id/reject
Body: {
  reason?: string;
}

Response: Session (with status = CANCELLED)
```

---

## UI Workflows & State Management

### Workflow 1: Creating a New Session

**User Actions:**
1. Selects repository from dropdown
2. Enters branch name (default: "main")
3. Writes task prompt OR selects a template
4. Toggles options (require approval, auto-create PR)
5. Clicks "Create Session"

**What the UI does:**
```javascript
// App.tsx line ~125
const handleCreateJob = () => {
  if (!repo || !prompt.trim()) {
    toast.error('Please fill in repository and prompt');
    return;
  }

  // TODO: Replace with actual API call
  // POST /api/sessions with { repo, branch, prompt, requireApproval, autoCreatePR }

  toast.success('Session created successfully!');
  setRepo('');
  setBranch('main');
  setPrompt('');
}
```

**What backend needs to do:**
1. Validate input (repo exists, branch exists, prompt not empty)
2. Call Jules API to create a coding session
3. Store session in database with status "QUEUED"
4. Return session object to frontend
5. Start polling Jules for status updates (or use webhooks)

---

### Workflow 2: Monitoring a Running Session

**User Actions:**
1. Opens jobs panel (left sidebar)
2. Clicks on a session
3. Modal opens showing activity stream

**What the UI needs:**
- Initial session data (from /api/sessions/:id)
- Activity stream (from /api/sessions/:id/activities)
- **Real-time updates** as Jules works

**Real-time Update Strategy (Production):**

Option A: **Server-Sent Events (SSE)** - Recommended
```
GET /api/sessions/:id/stream
Content-Type: text/event-stream

Client keeps connection open, server pushes updates:
event: activity
data: {"type": "PROGRESS", "content": "...", ...}

event: status_change
data: {"status": "IN_PROGRESS"}
```

Option B: **WebSocket**
```
ws://api/sessions/:id
Bidirectional connection for messages and updates
```

Option C: **Polling** (Simplest but not ideal)
```
Frontend polls /api/sessions/:id every 2-5 seconds
```

---

### Workflow 3: Approving a Plan

**User Actions:**
1. Sees session in "AWAITING_PLAN_APPROVAL" state
2. Reviews plan in "Plan" tab
3. Clicks "Approve" or "Reject"

**What the UI does:**
```javascript
// session-detail.tsx line ~25
const handleApprove = () => {
  // TODO: POST /api/sessions/:id/approve
  toast.success('Plan approved! Jules is now executing.');
}

const handleReject = () => {
  // TODO: POST /api/sessions/:id/reject
  toast.error('Plan rejected. Session cancelled.');
}
```

**What backend needs to do:**
1. Update session status to IN_PROGRESS (approve) or CANCELLED (reject)
2. Create APPROVAL or REJECTION activity entry
3. Tell Jules API to proceed (approve) or cancel (reject)
4. Return updated session

---

### Workflow 4: Sending Messages to Jules

**User Actions:**
1. In session detail modal, switches to "Messages" tab
2. Types message in composer
3. Presses Cmd+Enter or clicks Send

**What the UI does:**
```javascript
// message-composer.tsx line ~13
const handleSend = () => {
  if (message.trim()) {
    onSend(message);  // Calls parent handler
    setMessage('');
  }
}

// session-detail.tsx line ~34
const handleSendMessage = (message: string) => {
  // TODO: POST /api/sessions/:id/message with { content: message }
  toast.success('Message sent to Jules');
}
```

**What backend needs to do:**
1. Create USER_MESSAGE activity
2. Send message to Jules API
3. Return activity to frontend
4. Stream Jules' response back as AGENT_MESSAGE activities

---

## UI Components Map

### Core Custom Components

| Component | File | Purpose |
|-----------|------|---------|
| **StatusLight** | `/components/status-light.tsx` | Colored dot indicator for session status |
| **JobRow** | `/components/job-row.tsx` | List item in jobs panel (not currently used) |
| **ActivityCard** | `/components/activity-card.tsx` | Single activity in timeline |
| **MessageComposer** | `/components/message-composer.tsx` | Chat input with send button |
| **SessionDetail** | `/components/session-detail.tsx` | Modal with tabbed session info |
| **NewJobWizard** | `/components/new-job-wizard.tsx` | Standalone wizard (not used in current design) |

### Layout Structure

```
App.tsx
├── Header (top bar)
│   ├── Toggle button (open/close jobs panel)
│   ├── App title + logo
│   └── Theme switcher
│
├── Jobs Panel (left sidebar, collapsible)
│   ├── Search bar with inline clear
│   ├── Status filter icons (All, Queued, Planning, etc.)
│   └── Scrollable job list
│       └── Each job shows: status dot, status text, repo badge, prompt snippet, time
│
├── Main Content (right side)
│   └── New Job Form
│       ├── Repository & branch selection
│       ├── Task prompt textarea
│       ├── Quick templates
│       ├── Session options (toggles)
│       └── Create Session button
│
└── Session Detail Modal (overlay when job clicked)
    ├── Header with session info
    ├── Action buttons (approve/reject/send/etc.)
    └── Tabs
        ├── Activity (timeline of all events)
        ├── Messages (chat view)
        ├── Plan (execution plan)
        └── Original Prompt
```

---

## Theming & Design Tokens

### Color System

All status colors are defined in `/styles/globals.css`:

```css
/* Light Mode */
--status-queued: #6B7280;       /* Gray */
--status-planning: #3B82F6;     /* Blue */
--status-awaiting: #F59E0B;     /* Amber */
--status-in-progress: #3B82F6;  /* Blue */
--status-completed: #22C55E;    /* Green */
--status-failed: #EF4444;       /* Red */

/* Dark Mode - slightly adjusted for contrast */
--status-planning: #60A5FA;
--status-awaiting: #D97706;
--status-completed: #16A34A;
--status-failed: #DC2626;
```

These are applied via Tailwind classes like `bg-status-queued`, `text-status-planning`, etc.

---

## Integration Checklist

### Phase 1: Basic API Integration
- [ ] Set up Node.js backend with Express/Fastify
- [ ] Create `/api/sessions` endpoints (CRUD operations)
- [ ] Store API keys securely (environment variables)
- [ ] Proxy Jules API calls through your backend
- [ ] Replace mock data imports with `fetch()` calls
- [ ] Add error handling and loading states

### Phase 2: Real-time Updates
- [ ] Choose update strategy (SSE/WebSocket/polling)
- [ ] Implement activity stream updates
- [ ] Add connection status indicator in UI
- [ ] Handle reconnection logic

### Phase 3: Authentication
- [ ] Add user authentication (OAuth, email/password)
- [ ] Protect API endpoints
- [ ] Add user context to session creation
- [ ] Multi-user support (if needed)

### Phase 4: Production Hardening
- [ ] Rate limiting
- [ ] Input validation and sanitization
- [ ] Logging and monitoring
- [ ] Error tracking (Sentry, etc.)
- [ ] Database setup (PostgreSQL, MongoDB)
- [ ] Deploy to production (Vercel, Railway, etc.)

---

## Code to Extract & Reuse

### Keep These Files As-Is:
```
/components/status-light.tsx
/components/activity-card.tsx
/components/message-composer.tsx
/components/session-detail.tsx
/components/ui/* (entire shadcn component library)
/lib/types.ts (TypeScript definitions)
/styles/globals.css (design system)
```

### Modify These Files:
```
/App.tsx
  - Replace mock data with API calls
  - Add loading/error states
  - Add WebSocket connection logic

/lib/mock-data.ts
  - Delete this file (replace with API client)
```

### Create New Files:
```
/lib/api.ts           - API client functions
/lib/websocket.ts     - Real-time connection logic
/hooks/useSessions.ts - React Query hooks for data fetching
```

---

## Questions for Backend Team

1. **Jules API Access**: Do we have API keys and documentation for Jules?
2. **Rate Limits**: What are Jules' rate limits? Do we need request queuing?
3. **Webhooks**: Does Jules support webhooks for status updates, or do we need to poll?
4. **Authentication**: What auth system should we use? (OAuth, Auth0, Clerk, custom?)
5. **Database**: Do we need to persist sessions, or can we query Jules API on demand?
6. **File Storage**: Where do we store artifacts/diffs? (S3, GitHub, inline in DB?)
7. **Multi-tenancy**: Is this for a single team or multiple orgs?

---

## Next Steps

1. **Review this prototype** with stakeholders to validate UX
2. **Backend team**: Set up API infrastructure and Jules integration
3. **Frontend team**: Extract components and wire up API calls
4. **Together**: Test end-to-end flows with real Jules API
5. **Deploy**: Launch to production

---

## Contact & Resources

- **Prototype Repository**: [Link to Julescontrolroomui repository]
- **Jules API Docs**: [Google Jules documentation]
- **Design System**: See `/styles/globals.css` for all tokens
- **Mock Data**: See `/lib/mock-data.ts` for example API responses

---

*This prototype provides a complete UX foundation ready for backend integration.*
