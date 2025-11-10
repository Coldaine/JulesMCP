# Atomic Integration Plan - Jules Control Room UI → Backend

**Created:** 2025-11-10
**Status:** In Progress
**Approach:** Incremental, testable, committable steps

---

## Executive Summary

This plan breaks down the UI integration into **18 atomic commits**, each representing a testable, working state. Every commit can be verified before moving to the next step.

**Total Estimated Time:** 20-36 hours
**Current Progress:** 0/18 commits (Planning phase complete)

---

## Critical Success Factors

### 1. Atomic Commits
- Each commit represents ONE logical change
- Each commit should be testable
- Each commit message follows convention: `type(scope): description`
- Never commit broken code

### 2. Testing Strategy
**After each commit, verify:**
- ✅ Backend tests pass: `npm run test` (in JulesMCP)
- ✅ TypeScript compiles: `npm run typecheck` (both repos)
- ✅ Servers start without errors
- ✅ Browser console has no errors
- ✅ Manual smoke test of affected features

### 3. Rollback Strategy
- Each commit is self-contained
- Can `git revert` any commit if issues arise
- Can test any intermediate state

---

## Dependency Graph

```
Phase 0 (Environment)
└── Phase 1 (Foundation)
    └── Phase 2 (First Integration)
        └── Phase 3 (Write Operations)
            └── Phase 4 (Details & Actions)
                └── Phase 5 (Real-time)
                    └── Phase 6 (Production)
```

Each phase depends on the previous phase being complete and tested.

---

## Phase 0: Environment Preparation (Commits 1-3)

**Goal:** Get both repos ready to communicate
**Time Estimate:** 30-45 minutes
**Current Status:** Not Started

### Commit 1: Install UI dependencies

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\package-lock.json` (created)
- `E:\_projectsGithub\Julescontrolroomui\node_modules\` (created)

**Actions:**
```bash
cd E:\_projectsGithub\Julescontrolroomui
npm install
```

**Verification:**
- [ ] `node_modules/` directory exists and is ~300MB
- [ ] No error messages during install
- [ ] `npm run dev` starts (Ctrl+C to stop)

**Commit Message:**
```
chore(ui): install dependencies

Install all UI dependencies required for development.
Verifies package.json and package-lock.json are valid.
```

**Why This First:** Can't do anything without dependencies installed.

---

### Commit 2: Create environment configuration files

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\.env.local` (created)
- `E:\_projectsGithub\JulesMCP\backend\.env` (verify exists)

**Actions:**
1. Check backend token:
   ```bash
   cd E:\_projectsGithub\JulesMCP\backend
   cat .env | grep LOCAL_TOKEN
   # If not set, generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Create UI environment file:
   ```bash
   cd E:\_projectsGithub\Julescontrolroomui
   cat > .env.local << 'EOF'
   VITE_API_BASE=http://localhost:3001/api
   VITE_LOCAL_TOKEN=<COPY_FROM_BACKEND_ENV>
   EOF
   ```

**Critical:** Tokens MUST match exactly between backend/.env and UI/.env.local

**Verification:**
- [ ] Backend `.env` has `LOCAL_TOKEN` set
- [ ] UI `.env.local` exists with both variables
- [ ] Tokens match exactly (compare manually)
- [ ] `.env.local` is in `.gitignore` (don't commit secrets!)

**Commit Message:**
```
chore(ui): add environment configuration

Create .env.local with API base URL and authentication token.
Tokens must match backend/.env LOCAL_TOKEN for auth to work.

Note: .env.local is gitignored and must be created manually in each environment.
```

**Why This Second:** Need configuration before we can make API calls.

---

### Commit 3: Verify both servers start

**Files Changed:** None (this is just verification)

**Actions:**
```bash
# Terminal 1 - Start backend
cd E:\_projectsGithub\JulesMCP
npm run dev
# Should see: "Server listening on port 3001"

# Terminal 2 - Start UI
cd E:\_projectsGithub\Julescontrolroomui
npm run dev
# Should see: "Local: http://localhost:3000"
```

**Verification:**
- [ ] Backend starts on port 3001
- [ ] UI starts on port 3000
- [ ] http://localhost:3001/healthz returns {"status":"ok"}
- [ ] http://localhost:3000 shows UI (with mock data)
- [ ] No errors in either terminal
- [ ] No browser console errors

**No Commit:** This is verification only, no code changes.

**Why This Third:** Confirms environment is ready before we start integration.

---

## Phase 1: Foundation (Commits 4-6)

**Goal:** Create the conversion layer between backend and UI types
**Time Estimate:** 3-4 hours
**Dependencies:** Phase 0 complete

### Commit 4: Implement backend type adapter

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\src\lib\backend-adapter.ts` (implement)

**Current State:** File exists but only has 2 lines (empty)

**Critical Implementation Details:**

**Backend Types (from `shared/types.ts`):**
```typescript
interface JulesSession {
  id: string
  repo: string
  branch: string
  planStatus: 'pending' | 'in_progress' | 'succeeded' | 'failed'
  approval: 'pending' | 'approved' | 'rejected'
  summary?: string
  createdAt: string  // ISO timestamp
  updatedAt: string  // ISO timestamp
  participants: Participant[]
  metadata?: Record<string, unknown>
}

interface SessionActivity {
  at: string  // ISO timestamp
  author: string
  message: string
  type: string
}
```

**UI Types (from `src/lib/types.ts`):**
```typescript
interface Session {
  id: string
  repo: string
  branch: string
  status: SessionStatus  // Combined from planStatus + approval
  prompt: string         // From summary
  createdAt: string
  updatedAt: string
  requirePlanApproval?: boolean  // From metadata
  plan?: string                   // From metadata
}

type SessionStatus =
  | 'QUEUED'
  | 'PLANNING'
  | 'AWAITING_PLAN_APPROVAL'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

interface Activity {
  timestamp: string  // From 'at'
  author: string
  content: string    // From 'message'
  type: ActivityType
}
```

**Status Mapping Logic (CRITICAL):**
```typescript
function mapStatus(planStatus: string, approval: string): SessionStatus {
  // Rejection always means cancelled
  if (approval === 'rejected') return 'CANCELLED';

  // Success always means completed
  if (planStatus === 'succeeded') return 'COMPLETED';

  // Failure always means failed
  if (planStatus === 'failed') return 'FAILED';

  // Pending plan
  if (planStatus === 'pending') {
    if (approval === 'pending') return 'QUEUED';
    if (approval === 'approved') return 'PLANNING';
  }

  // In progress plan
  if (planStatus === 'in_progress') {
    if (approval === 'pending') return 'AWAITING_PLAN_APPROVAL';
    if (approval === 'approved') return 'IN_PROGRESS';
  }

  // Fallback
  return 'QUEUED';
}
```

**Functions to Implement:**
1. `backendSessionToUI(session: JulesSession): Session`
2. `backendActivityToUI(activity: SessionActivity): Activity`
3. `backendSessionsToUI(sessions: JulesSession[]): Session[]`
4. `backendActivitiesToUI(activities: SessionActivity[]): Activity[]`
5. `applyDeltaToSessions(sessions: Session[], delta: SessionDelta): Session[]`

**Verification:**
- [ ] TypeScript compiles: `npm run typecheck` in UI repo
- [ ] All functions exported
- [ ] JSDoc comments on all functions
- [ ] Error handling for null/undefined
- [ ] Unit test (optional but recommended)

**Commit Message:**
```
feat(ui): implement backend type adapter

Create conversion layer between backend JulesSession format and UI Session format.

Key conversions:
- Combine planStatus + approval into single status field
- Map 'summary' to 'prompt', 'at' to 'timestamp', 'message' to 'content'
- Extract metadata fields (plan, requirePlanApproval)
- Handle WebSocket delta updates

This adapter is critical infrastructure for all API integration.
```

**Why This Fourth:** Everything else depends on type conversion working correctly.

---

### Commit 5: Add Vite development proxy configuration

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\vite.config.ts` (modify)

**Current State:** Has basic config, missing `server.proxy` section

**Changes:**
```typescript
export default defineConfig({
  // ... existing config ...
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,              // CRITICAL for WebSocket
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

**Why Proxy Needed:**
- During development, UI runs on port 3000, backend on 3001
- Without proxy, CORS blocks API calls
- Vite proxy rewrites requests: `http://localhost:3000/api/sessions` → `http://localhost:3001/api/sessions`

**Verification:**
- [ ] Vite config compiles
- [ ] UI dev server starts: `npm run dev`
- [ ] Check browser DevTools → Network tab
- [ ] Make test request: `fetch('/api/sessions')` in console
- [ ] Should see request go to localhost:3000 but proxy to 3001

**Commit Message:**
```
feat(ui): add vite proxy for backend API

Configure Vite dev server to proxy /api and /ws requests to backend.
This prevents CORS issues during development.

- HTTP API: /api/* → http://localhost:3001/api/*
- WebSocket: /ws → ws://localhost:3001/ws
```

**Why This Fifth:** Need proxy working before we can test API calls.

---

### Commit 6: Update API client to use backend adapter

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\src\lib\api-client.ts` (modify imports)

**Current State:** Imports from `jules-api-types.ts` (WRONG for backend integration)

**Changes:**
```typescript
// BEFORE
import { julesActivityToActivity, julesSessionToSession } from './jules-api-types';

// AFTER
import { backendSessionToUI, backendActivityToUI, backendSessionsToUI, backendActivitiesToUI } from './backend-adapter';
import type { Activity, Session } from './types';
```

**Update function signatures:**
- Keep existing `request()` helper function
- Update `fetchSessions()` to use `backendSessionsToUI()`
- Update `fetchActivities()` to use `backendActivitiesToUI()`
- Add error handling for adapter failures

**Verification:**
- [ ] TypeScript compiles
- [ ] No import errors
- [ ] Run type check: `npm run typecheck`

**Commit Message:**
```
refactor(ui): update API client to use backend adapter

Switch from jules-api-types (Jules API v1alpha format) to backend-adapter
(our backend's format). This is critical for integration to work.

All API client functions now use correct type converters.
```

**Why This Sixth:** Completes the foundation - type system is now aligned.

---

## Phase 2: First Integration (Commits 7-8)

**Goal:** Get real data showing in UI
**Time Estimate:** 2-3 hours
**Dependencies:** Phase 1 complete (type adapter working)

### Commit 7: Wire GET /sessions endpoint to UI

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\src\App.tsx` (major refactor)

**Current State:** Uses `mockSessions` from `mock-data.ts`

**Changes:**

1. Add state and effects:
```typescript
const [sessions, setSessions] = useState<Session[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  loadSessions();
  // Poll every 5 seconds
  const interval = setInterval(loadSessions, 5000);
  return () => clearInterval(interval);
}, []);

async function loadSessions() {
  try {
    setIsLoading(true);
    setError(null);
    const data = await fetchSessions();
    setSessions(data);
  } catch (err) {
    console.error('Failed to load sessions:', err);
    setError(err instanceof Error ? err.message : 'Failed to load sessions');
    toast.error('Failed to load sessions');
  } finally {
    setIsLoading(false);
  }
}
```

2. Remove mock data import:
```typescript
// DELETE THIS LINE
import { mockSessions } from './lib/mock-data';
```

3. Update render to use `sessions` state instead of `mockSessions`

4. Add loading state:
```typescript
if (isLoading && sessions.length === 0) {
  return <div>Loading sessions...</div>;
}

if (error && sessions.length === 0) {
  return <div>Error: {error}</div>;
}
```

**Verification:**
- [ ] Both servers running (backend on 3001, UI on 3000)
- [ ] Open http://localhost:3000
- [ ] Open browser DevTools → Network tab
- [ ] See request to `/api/sessions` (proxied to backend)
- [ ] If no sessions exist, see empty state (not error)
- [ ] No console errors
- [ ] Type conversions work without errors

**Create Test Session:**
```bash
# Create a test session via backend API
curl -X POST http://localhost:3001/api/sessions \
  -H "Authorization: Bearer <YOUR_LOCAL_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "user/test-repo",
    "branch": "main",
    "summary": "Test integration session",
    "metadata": {}
  }'
```

After creating, refresh UI - session should appear!

**Commit Message:**
```
feat(ui): wire GET /sessions to real backend API

Replace mock data with real API calls to backend.

Changes:
- Add state management for sessions, loading, error
- Implement loadSessions() with error handling
- Add polling every 5 seconds for updates
- Remove mock data import
- Add loading and error states

BREAKING: UI now requires backend to be running on port 3001.

Test: Create session via curl, verify it appears in UI.
```

**Why This Seventh:** This is the PROOF OF CONCEPT. If this works, everything else will work.

---

### Commit 8: Add loading skeleton and error states

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\src\App.tsx` (enhance UX)

**Changes:**
- Improve loading state with skeleton component
- Enhance error state with retry button
- Add connection status indicator
- Better empty state messaging

**Verification:**
- [ ] Loading skeleton shows on initial load
- [ ] Error state shows when backend is down (stop backend to test)
- [ ] Retry button works
- [ ] Empty state shows when no sessions exist

**Commit Message:**
```
feat(ui): enhance loading and error states for session list

Add proper UX for loading, error, and empty states.

- Loading skeleton during initial fetch
- Error state with retry button
- Clear empty state when no sessions exist
- Maintains existing sessions during background refresh
```

---

## Phase 3: Write Operations (Commits 9-10)

**Goal:** Enable creating sessions from UI
**Time Estimate:** 2-3 hours
**Dependencies:** Phase 2 complete (can read sessions)

### Commit 9: Wire POST /sessions (create session)

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\src\lib\api-client.ts` (add createSession)
- `E:\_projectsGithub\Julescontrolroomui\src\components\new-job-wizard.tsx` (or similar component)

**API Client Addition:**
```typescript
export interface CreateSessionInput {
  repo: string;
  branch?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  const response = await request<{ session: unknown }>('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      repo: input.repo,
      branch: input.branch || 'main',
      summary: input.summary,
      metadata: input.metadata || {},
    }),
  });

  // Backend returns { session: JulesSession }
  return backendSessionToUI(response.session as JulesSession);
}
```

**Component Update:**
- Find the create session form component
- Replace any mock creation with `await createSession(...)`
- Add loading state during creation
- Add error handling
- Show success toast
- Refresh session list or navigate to new session

**Verification:**
- [ ] Can open create session dialog/form
- [ ] Fill in repo, branch, prompt
- [ ] Click create button
- [ ] See loading indicator
- [ ] See success toast
- [ ] New session appears in list immediately
- [ ] Check Network tab - POST to `/api/sessions` with 200 status

**Commit Message:**
```
feat(ui): wire POST /sessions for creating new sessions

Enable creating sessions from UI form.

Changes:
- Add createSession() to api-client.ts
- Update new job wizard to use real API
- Add loading and error states
- Show success feedback
- Auto-refresh session list after creation

Test: Fill form, create session, verify it appears and can be opened.
```

---

### Commit 10: Test end-to-end create → list workflow

**Files Changed:** None (testing/documentation)

**Actions:**
1. Manual E2E test:
   - Open UI
   - Create new session
   - Verify appears in list
   - Open session detail
   - Verify data is correct

2. Document any issues found

**No Commit:** Testing phase only.

---

## Phase 4: Details & Actions (Commits 11-14)

**Goal:** Complete all API endpoints
**Time Estimate:** 4-6 hours
**Dependencies:** Phase 3 complete (basic CRUD works)

### Commit 11: Wire GET /sessions/:id (session details)

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\src\lib\api-client.ts` (add fetchSession)
- `E:\_projectsGithub\Julescontrolroomui\src\components\session-detail.tsx` (use real API)

**API Client:**
```typescript
export async function fetchSession(id: string): Promise<Session> {
  const response = await request<{ session: unknown }>(`/sessions/${id}`);
  return backendSessionToUI(response.session as JulesSession);
}
```

**Component Update:**
- Replace mock data fetch with `await fetchSession(id)`
- Add loading state
- Add error handling

**Verification:**
- [ ] Click on session in list
- [ ] Session detail modal opens
- [ ] Shows correct data
- [ ] Network tab shows GET `/api/sessions/:id`

**Commit Message:**
```
feat(ui): wire GET /sessions/:id for session details

Load individual session details from backend.

- Add fetchSession(id) to API client
- Update session detail component to use real API
- Add loading and error states
```

---

### Commit 12: Wire GET /sessions/:id/activities

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\src\lib\api-client.ts` (add fetchActivities)
- `E:\_projectsGithub\Julescontrolroomui\src\components\session-detail.tsx` (load activities)

**API Client:**
```typescript
export async function fetchActivities(sessionId: string): Promise<Activity[]> {
  const response = await request<{ activities: unknown[] }>(`/sessions/${sessionId}/activities`);
  return backendActivitiesToUI(response.activities as SessionActivity[]);
}
```

**Verification:**
- [ ] Open session detail
- [ ] See activity feed
- [ ] Activities display correctly
- [ ] Timestamps are formatted properly

**Commit Message:**
```
feat(ui): wire GET /sessions/:id/activities for activity feed

Load session activities from backend.

- Add fetchActivities(sessionId) to API client
- Update session detail to show real activity history
- Apply backend-adapter conversions
```

---

### Commit 13: Wire POST /sessions/:id/approve

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\src\lib\api-client.ts` (add approveSession)
- `E:\_projectsGithub\Julescontrolroomui\src\components\session-detail.tsx` (approve button)

**API Client:**
```typescript
export async function approveSession(sessionId: string): Promise<Session> {
  const response = await request<{ session: unknown }>(`/sessions/${sessionId}/approve`, {
    method: 'POST',
  });
  return backendSessionToUI(response.session as JulesSession);
}
```

**Component:**
- Add click handler to approve button
- Show loading state during approval
- Update session state after approval
- Show success toast

**Verification:**
- [ ] Create session that needs approval
- [ ] Click approve button
- [ ] Status changes to IN_PROGRESS or appropriate state
- [ ] Activity feed shows approval event

**Commit Message:**
```
feat(ui): wire POST /sessions/:id/approve for plan approval

Enable approving session plans from UI.

- Add approveSession(id) to API client
- Wire approve button to real API
- Update session state after approval
- Show loading and success feedback
```

---

### Commit 14: Wire POST /sessions/:id/message

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\src\lib\api-client.ts` (add sendMessage)
- `E:\_projectsGithub\Julescontrolroomui\src\components\message-composer.tsx` (send button)

**API Client:**
```typescript
export async function sendMessage(sessionId: string, message: string): Promise<void> {
  await request(`/sessions/${sessionId}/message`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
```

**Component:**
- Wire send button to `sendMessage()`
- Clear input after send
- Show sending indicator
- Refresh activities after send

**Verification:**
- [ ] Type message in composer
- [ ] Click send
- [ ] Message appears in activity feed
- [ ] Input clears

**Commit Message:**
```
feat(ui): wire POST /sessions/:id/message for sending messages

Enable sending messages to Jules from UI.

- Add sendMessage(id, message) to API client
- Wire message composer to real API
- Clear input after successful send
- Refresh activity feed to show new message
```

---

## Phase 5: Real-time Updates (Commits 15-16)

**Goal:** WebSocket real-time updates
**Time Estimate:** 4-6 hours
**Dependencies:** Phase 4 complete (all endpoints work)

### Commit 15: Implement WebSocket client

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\src\lib\websocket.ts` (create new file)

**Implementation:**
```typescript
export class SessionWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // ms

  constructor(
    private url: string,
    private token: string,
    private onDelta: (delta: SessionDelta) => void,
    private onStatusChange: (status: 'connected' | 'connecting' | 'disconnected') => void
  ) {}

  connect() {
    // Implementation with:
    // - Bearer token in Sec-WebSocket-Protocol header
    // - Message handler calling onDelta
    // - Automatic reconnection with exponential backoff
    // - Connection status tracking
  }

  disconnect() {
    // Clean disconnect
  }
}
```

**Verification:**
- [ ] TypeScript compiles
- [ ] No syntax errors
- [ ] Exports SessionWebSocket class

**Commit Message:**
```
feat(ui): implement WebSocket client for real-time updates

Create WebSocket client with:
- Bearer token authentication
- Automatic reconnection (exponential backoff)
- Delta message handling
- Connection status tracking
- Clean disconnect

Does not yet integrate with UI - that's next commit.
```

---

### Commit 16: Connect WebSocket to UI state

**Files Changed:**
- `E:\_projectsGithub\Julescontrolroomui\src\App.tsx` (integrate WebSocket)
- `E:\_projectsGithub\Julescontrolroomui\src\components\connection-status.tsx` (new component)

**Changes:**

1. Add WebSocket connection:
```typescript
const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

useEffect(() => {
  const ws = new SessionWebSocket(
    'ws://localhost:3001/ws',
    import.meta.env.VITE_LOCAL_TOKEN,
    (delta) => {
      setSessions(prev => applyDeltaToSessions(prev, delta));
    },
    (status) => {
      setWsStatus(status);
    }
  );

  ws.connect();

  return () => ws.disconnect();
}, []);
```

2. Create connection status indicator component

3. Remove or reduce polling interval (WebSocket provides updates)

**Verification:**
- [ ] Connection indicator shows "Connected" when backend running
- [ ] Create session in one browser tab
- [ ] See it appear immediately in another tab (WebSocket update)
- [ ] Stop backend → indicator shows "Disconnected"
- [ ] Start backend → indicator shows "Connected" (auto-reconnect works)

**Commit Message:**
```
feat(ui): integrate WebSocket for real-time session updates

Connect WebSocket client to UI state management.

Changes:
- Add WebSocket connection in App.tsx
- Apply deltas to sessions state automatically
- Add connection status indicator
- Reduce polling interval (WebSocket provides updates)
- Auto-reconnect on disconnect

Test: Open two browser tabs, create session in one, see it appear in other immediately.
```

---

## Phase 6: Production Ready (Commits 17-18)

**Goal:** Automated build and deployment
**Time Estimate:** 2-3 hours
**Dependencies:** Phase 5 complete (fully functional)

### Commit 17: Create build automation script

**Files Changed:**
- `E:\_projectsGithub\JulesMCP\package.json` (add scripts)
- `E:\_projectsGithub\JulesMCP\scripts\build-ui.ps1` (create new file)

**PowerShell Script:**
```powershell
#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

Write-Host "Building Jules Control Room UI..." -ForegroundColor Cyan

# Navigate to UI repo
Push-Location "..\Julescontrolroomui"

# Install deps if needed
if (!(Test-Path "node_modules")) {
    Write-Host "Installing UI dependencies..." -ForegroundColor Yellow
    npm install
}

# Build UI
Write-Host "Building UI..." -ForegroundColor Cyan
npm run build

Pop-Location

# Clean public directory
Write-Host "Cleaning backend/public..." -ForegroundColor Cyan
if (Test-Path "backend\public\*") {
    Remove-Item -Path "backend\public\*" -Recurse -Force -Exclude ".gitkeep"
}

# Copy build to public
Write-Host "Deploying to backend/public..." -ForegroundColor Cyan
Copy-Item -Path "..\Julescontrolroomui\build\*" -Destination "backend\public\" -Recurse -Force

Write-Host "✅ UI deployed successfully!" -ForegroundColor Green
Write-Host "Start backend with: npm run start" -ForegroundColor Cyan
```

**Package.json Scripts:**
```json
{
  "scripts": {
    "build:ui": "pwsh -ExecutionPolicy Bypass -File scripts/build-ui.ps1",
    "deploy": "npm run build && npm run build:ui"
  }
}
```

**Verification:**
- [ ] Run `npm run build:ui` in backend repo
- [ ] Check `backend/public/` has UI files
- [ ] Start backend: `npm run start`
- [ ] Open http://localhost:3001
- [ ] UI loads and works correctly
- [ ] All features functional

**Commit Message:**
```
feat(backend): add UI build automation script

Create PowerShell script to build UI and deploy to backend/public.

New scripts:
- npm run build:ui - Build UI and copy to backend/public
- npm run deploy - Build backend + UI together

Windows-compatible automation using PowerShell.
Maintains .gitkeep in public directory.

Usage:
  npm run build:ui
  npm run start
  Open http://localhost:3001
```

---

### Commit 18: Update documentation for integration

**Files Changed:**
- `E:\_projectsGithub\JulesMCP\README.md` (update with integration info)
- `E:\_projectsGithub\JulesMCP\docs\INTEGRATION_EXECUTION_PLAN.md` (mark completed)
- `E:\_projectsGithub\JulesMCP\docs\INDEX.md` (update status)

**Changes:**
- Update README with UI integration status
- Add development workflow instructions
- Add production build instructions
- Document environment setup
- Mark integration plan steps as complete

**Commit Message:**
```
docs: update documentation for completed UI integration

Update all documentation to reflect completed integration.

- README: Add UI integration section
- Development guide: Add UI workflow
- Integration plan: Mark Phase 2 complete
- Index: Update project status

Integration is now complete and production-ready.
```

---

## Testing Checklist (After All Commits)

### Manual E2E Test Flow

**Test 1: Create and Approve Session**
- [ ] Open UI at http://localhost:3001
- [ ] Click "New Session"
- [ ] Fill: repo="test/repo", branch="main", prompt="Test session"
- [ ] Click Create
- [ ] Session appears in list
- [ ] Click session to open detail
- [ ] Click Approve button
- [ ] Status changes to IN_PROGRESS
- [ ] Activity feed shows approval event

**Test 2: Send Message**
- [ ] Open any session detail
- [ ] Type message: "Hello Jules"
- [ ] Click Send
- [ ] Message appears in activity feed
- [ ] Input clears

**Test 3: Real-time Updates**
- [ ] Open UI in two browser tabs
- [ ] In Tab 1: Create new session
- [ ] In Tab 2: Session appears automatically (no refresh)
- [ ] In Tab 1: Approve session
- [ ] In Tab 2: Status updates automatically

**Test 4: Error Handling**
- [ ] Stop backend server
- [ ] UI shows "Disconnected" status
- [ ] Try to create session → shows error message
- [ ] Start backend server
- [ ] UI reconnects automatically
- [ ] Create session → works again

**Test 5: Production Build**
- [ ] Run `npm run build:ui` in backend repo
- [ ] Run `npm run start` (production mode)
- [ ] Open http://localhost:3001
- [ ] All features work correctly
- [ ] No console errors
- [ ] WebSocket connects
- [ ] Can create/approve/message sessions

### Backend Tests

```bash
cd E:\_projectsGithub\JulesMCP
npm run test
# All 8 test suites should pass
```

### TypeScript Checks

```bash
# Backend
cd E:\_projectsGithub\JulesMCP
npm run typecheck

# UI
cd E:\_projectsGithub\Julescontrolroomui
npm run typecheck
```

---

## Rollback Plan

If any commit breaks functionality:

```bash
# Identify the bad commit
git log --oneline

# Revert the commit
git revert <commit-hash>

# Or reset to previous commit (DESTRUCTIVE)
git reset --hard HEAD~1
```

**Best Practice:** Test thoroughly before each commit to avoid rollbacks.

---

## Success Criteria

**Integration is complete when:**
- ✅ All 18 commits made and tested
- ✅ UI loads real data from backend
- ✅ Can create sessions from UI
- ✅ Can approve plans from UI
- ✅ Can send messages from UI
- ✅ Real-time updates work via WebSocket
- ✅ Connection status indicator works
- ✅ Production build deploys to backend/public
- ✅ Backend serves UI correctly
- ✅ All backend tests pass
- ✅ No TypeScript errors
- ✅ No browser console errors
- ✅ Documentation updated

---

## Current Status

- [x] Phase 0: Planning Complete
- [ ] Phase 0: Environment (Commits 1-3)
- [ ] Phase 1: Foundation (Commits 4-6)
- [ ] Phase 2: First Integration (Commits 7-8)
- [ ] Phase 3: Write Operations (Commits 9-10)
- [ ] Phase 4: Details & Actions (Commits 11-14)
- [ ] Phase 5: Real-time (Commits 15-16)
- [ ] Phase 6: Production (Commits 17-18)

**Next Action:** Begin Phase 0, Commit 1 - Install UI dependencies

---

## Notes

- Each phase builds on the previous
- Never skip verification steps
- Commit early, commit often
- Test before committing
- Write clear commit messages
- Document any issues encountered
- Keep both repos in sync

---

**Last Updated:** 2025-11-10
**Status:** Ready to begin implementation
