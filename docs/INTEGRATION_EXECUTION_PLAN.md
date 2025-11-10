# Jules Control Room - UI Integration Execution Plan

**Status:** Phase 1 Complete, Ready for Phase 2 Implementation
**Last Updated:** 2025-11-10
**For:** Future Claude Code instances and development team

---

## 🎯 Executive Summary

This document provides a detailed execution plan for integrating the Jules Control Room UI with the backend. Phase 1 (planning and analysis) is complete. This plan covers Phase 2 (implementation) through Phase 3 (production readiness).

**Current State:**
- ✅ All strategic documentation merged
- ✅ Type mismatch analysis complete
- ✅ Unified roadmap created
- ✅ Backend is production-ready
- ✅ UI is complete but runs on 100% mock data
- ❌ Zero integration exists (backend/public/ is empty)

**Goal:** Working integrated application with UI displaying real backend data, real-time updates via WebSocket, and automated build pipeline.

**Timeline:** 20-36 hours for complete integration

---

## 📋 Prerequisites & Context

### Required Reading (CRITICAL - Read These First)

**Before starting ANY implementation work, you MUST read:**

1. **`docs/UI_INTEGRATION_ROADMAP.md`** - Complete integration strategy, type mismatches, risk assessment
2. **`docs/frontend-backend-reconciliation.md`** - Day 1 integration plan, known gaps, acceptance criteria
3. **`shared/types.ts`** - Backend type definitions
4. **`E:\_projectsGithub\Julescontrolroomui\src\lib\types.ts`** - UI type definitions

**Reference Documentation:**
- `docs/MCP_FRAMEWORK_ANALYSIS.md` - Future MCP strategy (Phase 3, deferred)
- `CLAUDE.md` - Backend architecture and commands
- `docs/development-guide.md` - Backend development workflow

### Repository Locations

- **Backend:** `E:\_projectsGithub\JulesMCP`
- **UI:** `E:\_projectsGithub\Julescontrolroomui`

### Environment Requirements

- Node.js 20+
- npm 9+
- Windows 11 (paths use backslashes)
- Both repositories cloned locally

---

## 🧠 THINK DEEPLY BEFORE EACH PHASE

**⚠️ CRITICAL INSTRUCTION FOR AI AGENTS:**

Before beginning each phase below, you MUST:

1. **Read all context files** listed for that phase
2. **Understand WHY** each step is needed, not just WHAT to do
3. **Identify dependencies** between steps
4. **Consider edge cases** that could break the implementation
5. **Spawn sub-agents** when indicated (marked with 🤖)
6. **Validate assumptions** before proceeding
7. **Test incrementally** - don't build everything then test

**Decision Framework:**
- If a step seems unclear → STOP and ask for clarification
- If types don't align → STOP and analyze the mismatch
- If tests fail → STOP and understand root cause before continuing
- If you're making assumptions → STOP and verify them

**Sub-agent Usage:**
- 🤖 markers indicate where sub-agents provide maximum value
- Spawn sub-agents for: comprehensive analysis, systematic testing, complex implementations
- Each sub-agent should have a clear, specific objective
- Review sub-agent output critically before acting on it

---

## Phase 2: Implementation (Steps 8-23)

### 🏗️ Phase 2A: Environment Setup (Steps 8-12)

**Objective:** Prepare development environment for integration work

**Estimated Time:** 3-4 hours

#### Step 8: Set Up UI Repository Structure

**Context:** We need to decide how to integrate the two repositories.

**🧠 Think Deeply:**
- What's the best way to connect these repos?
- Git submodule vs directory structure vs monorepo?
- How will this affect build pipelines and deployments?

**Options:**

**Option A: Git Submodule** (Recommended for production)
```bash
cd E:\_projectsGithub\JulesMCP
git submodule add E:\_projectsGithub\Julescontrolroomui frontend
git submodule update --init --recursive
```

**Pros:**
- Clean git history
- Easy to update UI independently
- Standard monorepo pattern

**Cons:**
- More git complexity
- Submodule management overhead

**Option B: Directory Reference** (Recommended for rapid development)
```bash
# No action needed - reference UI repo by absolute path
# Build scripts will copy from UI repo to backend/public/
```

**Pros:**
- Simple, no git complexity
- Can convert to submodule later
- Faster iteration during development

**Cons:**
- Manual path management
- Not standard structure

**🎯 Decision Point:** Choose based on your workflow preference. For rapid development, start with Option B. Convert to Option A before production deployment.

**Validation:**
- [ ] Can navigate to UI repository from backend project?
- [ ] Understand the path relationships between repos?

---

#### Step 9: Install UI Dependencies

**Context:** The UI repository has dependencies that need to be installed.

**Commands:**
```bash
cd E:\_projectsGithub\Julescontrolroomui
npm install
```

**🧠 Think Deeply:**
- What could go wrong during npm install on Windows?
- Are there platform-specific dependencies (node-gyp)?
- Check for security vulnerabilities in dependencies?

**Expected Output:**
- `node_modules/` directory created (will be large, ~200-300MB)
- No error messages
- All dependencies resolved

**Potential Issues & Solutions:**

| Issue | Cause | Solution |
|-------|-------|----------|
| `node-gyp` errors | Native module compilation | Install Visual Studio Build Tools |
| Network errors | Firewall/proxy | Configure npm proxy settings |
| Permission errors | Windows UAC | Run terminal as administrator |
| Peer dependency warnings | Version mismatches | Usually safe to ignore, but review |

**Validation:**
- [ ] `node_modules/` exists and is populated
- [ ] No error messages in install log
- [ ] Can run `npm run dev` (may not work yet, that's ok)

---

#### Step 10: Create Type Adapter Layer

**Context:** The UI and backend have incompatible type systems. We need a conversion layer.

**🧠 Think Deeply:**
- Review the type mismatch analysis in `UI_INTEGRATION_ROADMAP.md` section "Challenge 1"
- Understand WHY each conversion is needed
- Consider edge cases: null values, missing fields, enum mismatches

**File to Create:** `E:\_projectsGithub\Julescontrolroomui\src\lib\backend-adapter.ts`

**🤖 SPAWN SUB-AGENT CHECKPOINT:**

If the backend-adapter.ts file doesn't exist or is incomplete, spawn a sub-agent with this task:

```
"Create a production-ready type adapter for Jules Control Room UI integration.

Read these files:
- E:\_projectsGithub\JulesMCP\shared\types.ts (backend types)
- E:\_projectsGithub\Julescontrolroomui\src\lib\types.ts (UI types)
- E:\_projectsGithub\JulesMCP\docs\UI_INTEGRATION_ROADMAP.md (conversion requirements)

Create E:\_projectsGithub\Julescontrolroomui\src\lib\backend-adapter.ts with:

1. Type definitions for backend types (inline or imported)
2. backendSessionToUI() - converts JulesSession to Session
3. backendActivityToUI() - converts SessionActivity to Activity
4. backendSessionsToUI() - batch conversion for sessions
5. backendActivitiesToUI() - batch conversion for activities
6. applyDeltaToSessions() - applies WebSocket deltas to UI state
7. AdapterError class for conversion failures
8. Type guards: isBackendSession(), isBackendActivity()

Key conversion logic:
- Map planStatus + approval → single status field
- Map 'at' → 'timestamp', 'message' → 'content'
- Default 'branch' to 'main' if missing
- Extract UI fields from metadata (plan, requirePlanApproval)
- Handle null/undefined gracefully

Include comprehensive error handling and JSDoc comments.

Set thoroughness to 'very thorough' - this is critical infrastructure."
```

**Manual Implementation Alternative:**

If sub-agent fails or you prefer manual implementation, the complete adapter code is available in the conversation history (search for "backend-adapter.ts" in previous messages).

**Key Conversions to Implement:**

```typescript
// Status mapping (most complex)
pending + pending → QUEUED
pending + approved → PLANNING
in_progress + pending → AWAITING_PLAN_APPROVAL
in_progress + approved → IN_PROGRESS
succeeded → COMPLETED
failed → FAILED
rejected → CANCELLED

// Field mappings
backend.summary → ui.prompt
backend.at → ui.timestamp
backend.message → ui.content
backend.branch ?? 'main' → ui.branch
backend.metadata.plan → ui.plan
backend.metadata.requirePlanApproval → ui.requirePlanApproval
```

**Validation:**
- [ ] File exists at correct path
- [ ] Exports all required functions
- [ ] TypeScript compiles without errors
- [ ] Imports work correctly from types.ts

**Test the Adapter (Optional but Recommended):**

Create `backend-adapter.test.ts` with basic tests:

```typescript
import { backendSessionToUI, backendActivityToUI } from './backend-adapter';

// Test session conversion
const backendSession = {
  id: 'test-1',
  repo: 'user/repo',
  branch: 'main',
  planStatus: 'pending' as const,
  approval: 'pending' as const,
  summary: 'Test session',
  createdAt: '2025-11-10T10:00:00Z',
  updatedAt: '2025-11-10T10:00:00Z',
  participants: [],
  metadata: {},
};

const uiSession = backendSessionToUI(backendSession);
console.log('Converted session:', uiSession);
// Should have status: 'QUEUED', prompt: 'Test session'
```

---

#### Step 11: Configure Vite Build Output

**Context:** Vite needs to output to `build/` directory and eventually deploy to `backend/public/`.

**File to Modify:** `E:\_projectsGithub\Julescontrolroomui\vite.config.ts`

**🧠 Think Deeply:**
- Where should the build output go?
- What base path should the app use?
- How will environment variables be handled?

**Current Configuration (Verify):**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'build', // ✅ Already correct
    emptyOutDir: true,
  },
  base: '/', // ✅ Serving from root of backend
});
```

**If config doesn't exist or is incomplete, create it with the above.**

**Validation:**
- [ ] `outDir` is set to 'build'
- [ ] `base` is set to '/'
- [ ] TypeScript path alias configured if needed

---

#### Step 12: Set Up Development Proxy

**Context:** During development, UI runs on port 3000, backend on port 3001. We need Vite to proxy API calls.

**File to Modify:** `E:\_projectsGithub\Julescontrolroomui\vite.config.ts`

**Add Server Configuration:**

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
  base: '/',
});
```

**🧠 Think Deeply:**
- Why do we need `changeOrigin: true`?
- What happens if backend isn't running when UI starts?
- How will WebSocket proxy work differently than HTTP proxy?

**Create Environment File:**

Create `E:\_projectsGithub\Julescontrolroomui\.env.local`:

```bash
VITE_API_BASE=http://localhost:3001/api
VITE_LOCAL_TOKEN=your_local_token_here_must_match_backend
```

**⚠️ CRITICAL:** The `VITE_LOCAL_TOKEN` must match the `LOCAL_TOKEN` in `backend/.env`

**Validation:**
- [ ] Vite config has server.proxy section
- [ ] `.env.local` file exists with correct values
- [ ] Tokens match between UI and backend
- [ ] `.env.local` is in `.gitignore` (security)

**Test the Proxy:**

1. Start backend:
   ```bash
   cd E:\_projectsGithub\JulesMCP
   npm run dev
   ```

2. Start UI in separate terminal:
   ```bash
   cd E:\_projectsGithub\Julescontrolroomui
   npm run dev
   ```

3. Open browser to `http://localhost:3000`

4. Open browser DevTools → Network tab

5. Trigger an API call (even if it fails, we just want to see if proxy works)

Expected: Requests to `/api/*` should show in Network tab going to localhost:3000 but actually hitting backend at localhost:3001.

---

### 🔌 Phase 2B: API Integration (Steps 13-14)

**Objective:** Wire first API endpoints to prove concept

**Estimated Time:** 4-6 hours

#### Step 13: Wire GET /api/sessions to UI

**Context:** This is the FIRST real integration point. If this works, everything else will follow.

**🧠 Think Deeply:**
- What's the current data flow with mock data?
- How will we replace it with real API calls?
- What loading states are needed?
- How do we handle errors gracefully?

**Files to Modify:**

**1. Update API Client:** `E:\_projectsGithub\Julescontrolroomui\src\lib\api-client.ts`

**Current State (Verify):**
The file should have a `fetchSessions()` function. It may use the wrong conversion functions.

**Required Changes:**

```typescript
import { backendSessionToUI, backendSessionsToUI } from './backend-adapter';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api';
const LOCAL_TOKEN = import.meta.env.VITE_LOCAL_TOKEN ?? '';

export async function fetchSessions(params?: {
  status?: string;
  repo?: string;
}): Promise<Session[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.repo) queryParams.append('repo', params.repo);

  const url = `${API_BASE}/sessions${queryParams.toString() ? `?${queryParams}` : ''}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${LOCAL_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.statusText}`);
  }

  const data = await response.json();

  // Backend returns { sessions: JulesSession[] }
  // Convert to UI format
  return backendSessionsToUI(data.sessions || []);
}
```

**2. Update App.tsx:** `E:\_projectsGithub\Julescontrolroomui\src\App.tsx`

**Find and Replace:**

```typescript
// BEFORE
import { mockSessions } from './lib/mock-data';

// Line ~146
const filteredSessions = mockSessions.filter(...);

// AFTER
import { useState, useEffect } from 'react';
import { fetchSessions } from './lib/api-client';
import type { Session } from './lib/types';

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
    // Optional: Set up polling
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadSessions() {
    try {
      setIsLoadingSessions(true);
      setLoadError(null);
      const data = await fetchSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load');
      toast.error('Failed to load sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  }

  // Now filter the fetched sessions
  const filteredSessions = sessions.filter(...); // Keep existing filter logic

  // Rest of component remains the same
}
```

**🧠 Think Deeply:**
- What if backend is down when UI loads?
- Should we show empty state vs error state?
- Is 5-second polling too aggressive?
- What happens with stale data?

**Add Loading UI (if not present):**

```typescript
if (isLoadingSessions && sessions.length === 0) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Loading sessions...</p>
      </div>
    </div>
  );
}

if (loadError && sessions.length === 0) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
        <p className="text-muted-foreground mb-4">{loadError}</p>
        <button onClick={loadSessions} className="btn btn-primary">
          Retry
        </button>
      </div>
    </div>
  );
}
```

**Validation Checklist:**
- [ ] Backend is running (`npm run dev` in backend directory)
- [ ] UI dev server is running (`npm run dev` in UI directory)
- [ ] Open browser to `http://localhost:3000`
- [ ] Open DevTools → Network tab
- [ ] See request to `/api/sessions` with 200 status
- [ ] See sessions displayed in UI (or empty state if no sessions exist)
- [ ] No console errors related to type conversions
- [ ] Can filter sessions (existing UI functionality should still work)

**If No Sessions Exist:**

Create a test session using curl:

```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Authorization: Bearer <your_local_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "user/test-repo",
    "branch": "main",
    "summary": "Test session from curl",
    "metadata": {}
  }'
```

Reload UI and verify session appears.

---

#### Step 14: Wire POST /api/sessions (Create Session)

**Context:** Users need to create sessions from the UI.

**File to Modify:** `E:\_projectsGithub\Julescontrolroomui\src\pages\create-job.tsx`

**🧠 Think Deeply:**
- What happens if session creation fails?
- How do we provide feedback to user?
- Should we redirect after creation or stay on page?
- What validation is needed before sending to backend?

**Update API Client First:**

Add to `api-client.ts`:

```typescript
import { uiSessionToBackend } from './backend-adapter'; // If needed for input

export interface CreateSessionInput {
  repo: string;
  branch?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOCAL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo: input.repo,
      branch: input.branch || 'main',
      summary: input.summary,
      metadata: input.metadata || {},
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to create session');
  }

  const data = await response.json();

  // Backend returns { session: JulesSession }
  return backendSessionToUI(data.session);
}
```

**Update create-job.tsx:**

```typescript
import { createSession } from '../lib/api-client';
import { toast } from 'sonner';

// In the component
async function handleCreateJob(formData: FormData) {
  try {
    setIsCreating(true);

    const session = await createSession({
      repo: formData.repo,
      branch: formData.branch || 'main',
      summary: formData.prompt,
      metadata: {
        requirePlanApproval: formData.requireApproval,
      },
    });

    toast.success('Session created successfully!');

    // Redirect to sessions list or show session detail
    // Option 1: Close form and refresh list
    onClose?.();

    // Option 2: Navigate to session detail
    // navigate(`/sessions/${session.id}`);

  } catch (error) {
    console.error('Failed to create session:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to create session');
  } finally {
    setIsCreating(false);
  }
}
```

**Validation:**
- [ ] Can open create session form
- [ ] Can fill in repo, branch, prompt
- [ ] Click create → see POST request in Network tab
- [ ] Request returns 200 status
- [ ] New session appears in sessions list
- [ ] Toast notification shows success
- [ ] Form closes or redirects appropriately
- [ ] Error handling works (try with invalid repo format)

---

### 🔍 Phase 2C: Complete API Surface (Steps 15-17)

**Objective:** Wire remaining CRUD operations and test systematically

**Estimated Time:** 6-8 hours

#### Step 15: 🤖 SPAWN SUB-AGENT - Systematic API Testing

**🧠 Think Deeply:**
Before spawning the sub-agent, ensure steps 13-14 are working correctly. The sub-agent will build on that foundation.

**Sub-Agent Task:**

```
"Systematically test and implement all remaining Jules Control Room API endpoints.

Prerequisites (verify these work first):
- GET /api/sessions is working in UI
- POST /api/sessions (create) is working in UI
- Type adapter layer exists and functions correctly

Remaining endpoints to implement:

1. GET /api/sessions/:id (get single session)
2. GET /api/sessions/:id/activities (list activities)
3. POST /api/sessions/:id/approve (approve plan)
4. POST /api/sessions/:id/message (send message)

For each endpoint:

1. Update src/lib/api-client.ts with the function
2. Identify which UI component uses this endpoint
3. Update that component to use real API instead of mock
4. Test the endpoint with real backend
5. Verify error handling works
6. Verify type conversions work correctly

Key files:
- E:\_projectsGithub\Julescontrolroomui\src\lib\api-client.ts (add functions)
- E:\_projectsGithub\Julescontrolroomui\src\components\session-detail.tsx (uses most endpoints)
- E:\_projectsGithub\JulesMCP\backend\src\routes\sessions.ts (backend reference)

Pay special attention to:
- Session detail modal (loads session + activities)
- Approve button (calls approve endpoint)
- Message composer (sends messages, loads activities)

Test each endpoint individually before moving to next.
Document any issues or type mismatches discovered.

Set thoroughness to 'very thorough' - each endpoint must work correctly."
```

**What You Should See After Sub-Agent Completes:**

1. All API client functions implemented
2. Session detail modal loads real data
3. Can approve sessions
4. Can send messages to sessions
5. Activities display correctly
6. All mock data imports removed

**Validation:**
- [ ] Open a session detail modal
- [ ] See real activities (not mock data)
- [ ] Click approve → session status changes
- [ ] Send message → appears in activity feed
- [ ] All type conversions work without errors

---

#### Steps 16-17: Authentication & Feature Flags

These are relatively straightforward since auth is just bearer token (already in API client) and feature flags are UI-only.

**Step 16: Authentication Flow**

Currently, token is in `.env.local`. For a single-user tool, this is sufficient.

**Validation:**
- [ ] Token is correctly loaded from environment
- [ ] All API requests include Authorization header
- [ ] 401 errors handled gracefully

**Step 17: Feature Flags**

Add flags for aspirational features:

```typescript
// src/lib/feature-flags.ts
export const FEATURES = {
  GITHUB_ANALYTICS: false,
  REPO_TIMELINE: false,
  MODEL_MANAGEMENT: false,
  RAG_NOTES: false,
} as const;

// In components
import { FEATURES } from '../lib/feature-flags';

{FEATURES.GITHUB_ANALYTICS && (
  <Link to="/analytics">GitHub Analytics</Link>
)}

{!FEATURES.GITHUB_ANALYTICS && (
  <Tooltip content="Coming soon">
    <span className="opacity-50 cursor-not-allowed">
      GitHub Analytics
    </span>
  </Tooltip>
)}
```

---

### 🔴 Phase 2D: Real-Time & Production (Steps 18-23)

**Objective:** WebSocket integration, automation, and production readiness

**Estimated Time:** 8-12 hours

#### Step 18: 🤖 SPAWN SUB-AGENT - WebSocket Implementation

**🧠 Think Deeply:**
WebSocket implementation is complex. It involves:
- Connection management
- Automatic reconnection with exponential backoff
- Heartbeat/ping-pong
- Delta application
- Error recovery
- Connection status UI

This is a perfect candidate for a sub-agent.

**Sub-Agent Task:**

```
"Implement WebSocket client for real-time session updates in Jules Control Room UI.

Backend WebSocket details:
- Endpoint: ws://localhost:3001/ws
- Authentication: Sec-WebSocket-Protocol: bearer.<token>
- Message format: { id, previous, current, change } (SessionDelta)
- Sends session deltas every 5 seconds when changes occur
- Backend handles ping/pong automatically

Requirements:

1. Create src/lib/websocket.ts with SessionWebSocket class
2. Features needed:
   - Connect with bearer token authentication
   - Automatic reconnection (exponential backoff, max 5 attempts)
   - Handle session delta messages
   - Apply deltas to UI state using applyDeltaToSessions()
   - Connection status tracking
   - Graceful disconnect
   - Error handling

3. Integrate in App.tsx:
   - Connect WebSocket on mount
   - Update sessions state when deltas arrive
   - Show connection status indicator
   - Disconnect on unmount

4. Add connection status UI component:
   - Green dot: Connected
   - Yellow dot: Connecting
   - Red dot: Disconnected
   - Show in header or footer

5. Test scenarios:
   - Initial connection succeeds
   - Receives delta and updates UI
   - Reconnects after backend restart
   - Shows disconnected state when backend is down
   - No memory leaks (verify disconnect cleans up)

Reference:
- Backend ws.ts: E:\_projectsGithub\JulesMCP\backend\src\ws.ts
- Type definitions: backend-adapter.ts (SessionDelta)
- Apply deltas with: applyDeltaToSessions() function

Set thoroughness to 'very thorough' - WebSocket is critical for real-time UX."
```

**Validation After WebSocket Implementation:**
- [ ] Connection indicator shows "Connected" when backend running
- [ ] Create session in one browser tab → appears in another tab automatically
- [ ] Backend restart → UI reconnects automatically
- [ ] Stop backend → UI shows "Disconnected"
- [ ] Start backend → UI shows "Connecting" then "Connected"
- [ ] No console errors or warnings

---

#### Steps 19-23: Build Automation & Production

**Step 19: Build Script**

Add to root `package.json`:

```json
{
  "scripts": {
    "build:ui": "cd ../Julescontrolroomui && npm run build && xcopy /E /I /Y build ..\\JulesMCP\\backend\\public",
    "deploy:ui": "npm run build:ui"
  }
}
```

**Step 20: End-to-End Testing**

Test complete workflows:
- [ ] Create session → appears in list
- [ ] Open session detail → see activities
- [ ] Send message → appears in feed
- [ ] Approve plan → status changes to IN_PROGRESS
- [ ] All updates appear in real-time across browser tabs

**Step 21: Docker Integration**

Update `Dockerfile` to include UI:

```dockerfile
# Build UI
FROM node:20 AS ui-builder
WORKDIR /ui
COPY Julescontrolroomui/package*.json ./
RUN npm ci
COPY Julescontrolroomui/ ./
RUN npm run build

# Backend
FROM node:20
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production
COPY backend/ ./
COPY --from=ui-builder /ui/build ./public
CMD ["node", "dist/server.js"]
```

**Step 22-23: Documentation & Final Review**

Update docs with:
- Development workflow
- Build commands
- Deployment process
- Troubleshooting guide

---

## 🤖 When to Spawn Sub-Agents

**Explicit Sub-Agent Checkpoints:**

1. **Step 10** - Type adapter creation (if file incomplete)
2. **Step 15** - Systematic API endpoint testing and implementation
3. **Step 18** - WebSocket client implementation
4. **Step 23** - Final integration review and optimization

**General Rule:**
Spawn sub-agents for:
- Comprehensive analysis requiring reading multiple files
- Systematic testing of multiple components
- Complex implementations (WebSocket, state management)
- Final validation and optimization passes

**Do NOT spawn sub-agents for:**
- Simple file modifications
- Single-file updates
- Configuration changes
- Documentation updates

---

## ⚠️ Common Pitfalls & Troubleshooting

### Type Conversion Issues

**Problem:** `Cannot read property 'X' of undefined`

**Cause:** Backend returned data in unexpected format

**Solution:**
1. Check backend response in Network tab
2. Verify backend types match `shared/types.ts`
3. Update adapter to handle optional fields
4. Add defensive checks in adapter

### CORS Errors

**Problem:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Cause:** Backend CORS not configured for UI origin

**Solution:**
1. Check `CORS_ORIGIN` in backend `.env`
2. If using dev proxy, ensure `changeOrigin: true`
3. Verify backend server.ts has CORS middleware

### WebSocket Connection Fails

**Problem:** WebSocket shows "Disconnected" even when backend running

**Causes & Solutions:**
- Token mismatch → Verify tokens match in both `.env` files
- Wrong protocol → Use `ws://` not `wss://` for localhost
- Backend not upgraded → Check backend ws.ts is running
- Firewall → Check Windows Firewall allows WebSocket on port 3001

### Sessions Not Appearing

**Problem:** UI shows empty list but backend has sessions

**Cause:** Type conversion failing silently

**Solution:**
1. Check browser console for errors
2. Verify `backendSessionsToUI()` is called
3. Add console.log in adapter to debug conversion
4. Check backend response structure matches expectations

### Build Fails

**Problem:** `npm run build` fails in UI

**Common Causes:**
- TypeScript errors → Run `npm run typecheck` to identify
- Missing imports → Check all imports resolve correctly
- Environment variables → Ensure all `VITE_*` vars are set

---

## 📊 Progress Tracking

Use this checklist to track overall progress:

### Phase 2A: Environment Setup
- [ ] Step 8: Repository structure set up
- [ ] Step 9: Dependencies installed
- [ ] Step 10: Type adapter created and tested
- [ ] Step 11: Vite build configured
- [ ] Step 12: Development proxy configured and tested

### Phase 2B: API Integration
- [ ] Step 13: GET /sessions working
- [ ] Step 14: POST /sessions (create) working

### Phase 2C: Complete API Surface
- [ ] Step 15: All endpoints implemented and tested
- [ ] Step 16: Authentication verified
- [ ] Step 17: Feature flags implemented

### Phase 2D: Real-Time & Production
- [ ] Step 18: WebSocket implemented and tested
- [ ] Step 19: Build scripts automated
- [ ] Step 20: End-to-end testing complete
- [ ] Step 21: Docker updated
- [ ] Step 22-23: Documentation updated

---

## 🎯 Success Criteria

### Minimum Viable Integration (Phase 2 Complete)
- ✅ UI loads real session data from backend
- ✅ Can create sessions via UI form
- ✅ Can view session details with activities
- ✅ Can approve plans
- ✅ Can send messages
- ✅ WebSocket provides real-time updates
- ✅ Error handling is robust
- ✅ Loading states display correctly

### Production Ready (Phase 3)
- All above, plus:
- ✅ Automated build pipeline (`npm run build:ui`)
- ✅ Docker deployment includes UI assets
- ✅ Documentation complete
- ✅ All tests passing
- ✅ Performance acceptable
- ✅ No console errors or warnings

---

## 📚 Additional Resources

**Key Documentation:**
- `docs/UI_INTEGRATION_ROADMAP.md` - Strategic overview
- `docs/frontend-backend-reconciliation.md` - Integration details
- `docs/MCP_FRAMEWORK_ANALYSIS.md` - Future MCP strategy
- `CLAUDE.md` - Backend architecture

**Backend Reference:**
- `backend/src/routes/sessions.ts` - API endpoints
- `backend/src/ws.ts` - WebSocket implementation
- `shared/types.ts` - Type definitions

**UI Reference:**
- `src/lib/types.ts` - UI type definitions
- `src/lib/api-client.ts` - API client (update this)
- `src/App.tsx` - Main component (update this)
- `src/components/session-detail.tsx` - Session modal (update this)

---

## 🆘 Getting Help

**If you get stuck:**

1. **Read the context** - Most answers are in the documentation
2. **Check the logs** - Browser console + backend logs
3. **Think deeply** - Why is this failing? What assumptions might be wrong?
4. **Ask specific questions** - "Why is X happening?" not "It doesn't work"
5. **Spawn a sub-agent** - For complex analysis or systematic debugging

**Red Flags That Mean Stop:**
- Multiple type errors that don't make sense
- WebSocket constantly disconnecting
- Data corruption or loss
- Performance degradation
- Security warnings

When you see red flags, STOP and analyze root cause before continuing.

---

**Last Updated:** 2025-11-10
**Next Review:** After Phase 2B completion (Steps 8-14)
**Estimated Completion:** 20-36 hours of focused work
