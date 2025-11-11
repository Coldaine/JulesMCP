---
doc_type: plan
subsystem: ui
version: 1.0.0
status: in_review
owners: UI Integration Team
last_reviewed: 2025-11-10
---

# UI Integration Roadmap

**Status:** Phase 1 Complete - Foundation Built ✅
**Last Updated:** 2025-11-10 (Implementation in progress)
**Owner:** Jules Control Room Development Team
**Progress:** 22% (4/18 commits complete)

## Executive Summary

This document provides a unified roadmap for integrating the Jules Control Room UI with the backend, combining immediate integration steps with future MCP strategy. This roadmap synthesizes:

- `frontend-backend-reconciliation.md` - Day 1 integration plan
- `MCP_FRAMEWORK_ANALYSIS.md` - Future MCP strategy (Day 2+)
- UI Repository Analysis - Technical integration details

**Implementation Update:** Phase 0 and Phase 1 foundation work is complete. Type adapter layer, development proxy, and API client updates are done and tested. Ready to wire first API endpoint.

## Current State

### Backend Status: ✅ Production Ready
- Express server with REST API under `/api/*`
- WebSocket support at `/ws` endpoint
- Bearer token authentication (REST + WS)
- Security hardening (rate limiting, IP allowlist, CORS)
- Jules API proxy with retry/backoff
- Optional SQLite persistence
- Comprehensive test coverage (8 test suites)
- Docker deployment configured

### UI Status: ⚠️ Prototype with Mock Data
- Complete React 18 + Vite frontend
- shadcn/ui components with Tailwind CSS
- Full UX design implemented (Figma Make validation)
- **Currently runs on 100% mock data**
- API client partially implemented but needs updates
- No WebSocket client yet
- Type system doesn't match backend

### Integration Status: 🟡 22% Complete (Foundation Built)
- ✅ Type conversion layer implemented (283 lines)
- ✅ Development proxy configured
- ✅ API client updated to use backend adapter
- ✅ Environment configured (tokens, dependencies)
- ⏳ UI still uses mock data (connecting in Phase 2)
- ❌ `backend/public/` is empty (Phase 6 will deploy build)

## Strategic Phases

### Phase 1: Foundation Setup (Day 1) - ✅ COMPLETE
**Goal:** Get UI displaying real backend data

**Timeline:** 1-2 days (8-16 hours)
**Status:** ✅ Foundation complete (2 hours actual)

**Tasks:**
1. ✅ Merge strategic planning branches to main
2. ✅ Analyze UI repository structure
3. ✅ Set up UI dependencies and environment (164 packages installed)
4. ✅ Create type conversion layer (283 lines - commit 665562e)
5. ✅ Update API client to use real backend (commit b5d9fa9)
6. ⏳ Replace mock data with API calls (Phase 2 - next step)

**Commits:**
- Backend: `abb1614` - Add atomic integration plan
- UI: `665562e` - Implement backend type adapter
- UI: `0718a58` - Add Vite proxy configuration
- UI: `b5d9fa9` - Update API client to use backend adapter
- UI: `c23cc53` - Add gitignore and package-lock

**Deliverables:**
- UI loads real session data from backend
- Create/approve/message workflows functional
- Polling-based updates working (3-5s interval)
- Type conversion layer handling data mismatches

### Phase 2: Real-Time & Polish (Days 2-3)
**Goal:** Production-ready integration

**Timeline:** 2-3 days (12-20 hours)
**Status:** Planned

**Tasks:**
1. Implement WebSocket client in UI
2. Add real-time session delta updates
3. Implement authentication flow
4. Add feature flags for aspirational UI sections
5. Create automated build pipeline
6. End-to-end testing
7. Docker integration
8. Documentation updates

**Deliverables:**
- WebSocket real-time updates working
- Automated build: `npm run build:ui` → `backend/public/`
- Complete user workflows tested
- Docker deployment includes UI
- Development workflow documented

### Phase 3: MCP Strategy (Day 2+ / Future)
**Goal:** Evaluate and potentially add MCP capabilities

**Timeline:** 11-15 weeks (if pursued)
**Status:** Deferred

**Decision Point:** Add MCP only when/if needed for:
- Multi-agent orchestration
- Standardized tool/resource definitions
- Cross-agent context sharing
- Integration with broader agent ecosystems

**Recommended Framework:** FastMCP 2.0 (Python/TS)
- Production-ready (vs EasyMCP beta status)
- Built-in session persistence
- Enterprise auth (Google/GitHub/Azure/Auth0)
- FastMCP Cloud deployment tools

**Architecture:** MCP as "sidecar" (no rewrite)
- Keep Express backend for UI/auth
- Run MCP server as separate process
- Bridge: Backend ↔ MCP for tool/resource access
- UI continues calling Express backend

**See:** `docs/MCP_FRAMEWORK_ANALYSIS.md` for complete MCP strategy

## Critical Integration Challenges

### Challenge 1: Type System Mismatch (HIGH PRIORITY)

**Problem:** UI and backend expect different data shapes

| Concept | UI Expects | Backend Provides | Resolution |
|---------|-----------|------------------|------------|
| Status | `status: SessionStatus` (7 states) | `planStatus: PlanStatus` + `approval: ApprovalState` | Create mapping layer |
| Prompt | `prompt: string` | `summary?: string` | Rename in adapter |
| Plan | `plan?: string` | `metadata?.plan?` | Extract from metadata |
| Activity Time | `timestamp: string` | `at: string` | Rename in adapter |
| Activity Message | `content: string` | `message?: string` | Rename in adapter |

**Solution:** Create `Julescontrolroomui/src/lib/backend-adapter.ts`

```typescript
import { JulesSession, SessionActivity } from '@backend/shared/types';
import { Session, Activity, SessionStatus } from './types';

export function backendSessionToUI(backend: JulesSession): Session {
  const status = mapToUIStatus(backend.planStatus, backend.approval);

  return {
    id: backend.id,
    repo: backend.repo,
    branch: backend.branch || 'main',
    status: status,
    prompt: backend.summary || '',
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt,
    requirePlanApproval: backend.approval !== 'pending',
    plan: backend.metadata?.plan as string | undefined,
  };
}

export function backendActivityToUI(backend: SessionActivity): Activity {
  return {
    id: backend.id,
    sessionId: backend.sessionId,
    type: backend.type as Activity['type'],
    content: backend.message || '',
    timestamp: backend.at,
    metadata: backend.metadata,
  };
}

function mapToUIStatus(planStatus: PlanStatus, approval: ApprovalState): SessionStatus {
  if (approval === 'pending' && planStatus === 'pending') return 'AWAITING_PLAN_APPROVAL';
  if (approval === 'rejected') return 'CANCELLED';

  switch (planStatus) {
    case 'pending': return 'QUEUED';
    case 'in_progress': return 'IN_PROGRESS';
    case 'succeeded': return 'COMPLETED';
    case 'failed': return 'FAILED';
    default: return 'QUEUED';
  }
}
```

### Challenge 2: Mock Data Replacement (MEDIUM PRIORITY)

**Files to modify:**
- `Julescontrolroomui/src/App.tsx` - Replace `mockSessions` import
- `Julescontrolroomui/src/components/session-detail.tsx` - Replace `mockActivities` import
- `Julescontrolroomui/src/pages/create-job.tsx` - Wire up API calls

**Strategy:**
1. Add React state for loading/error/data
2. Add `useEffect` hooks to fetch on mount
3. Replace mock imports with API client calls
4. Add loading skeletons and error UI

### Challenge 3: WebSocket Integration (MEDIUM PRIORITY)

**Current State:**
- Backend has WebSocket server at `/ws`
- Authentication via `Sec-WebSocket-Protocol: bearer.<token>`
- Broadcasts session deltas every 5s
- UI has no WebSocket client

**Solution:** Create `Julescontrolroomui/src/lib/websocket.ts`

**Features needed:**
- Automatic reconnection with exponential backoff
- Session delta handling
- Connection status indicator
- Error recovery

### Challenge 4: Build Pipeline (LOW PRIORITY)

**Current State:**
- UI builds to `build/` directory (not `dist/`)
- No automated pipeline to deploy to `backend/public/`

**Solution:** Create build script

```bash
# In root package.json
"scripts": {
  "build:ui": "cd ../Julescontrolroomui && npm run build && cp -r build/* ../JulesMCP/backend/public/"
}
```

**Vite config update needed:**
```typescript
// Julescontrolroomui/vite.config.ts
export default defineConfig({
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
  // Add base path if needed for subpath deployment
  base: '/',
});
```

## Non-Blocking Gaps (Day 2+)

These gaps are documented but won't block Day 1 integration:

1. **Cancel Session** - No backend implementation, UI button stays disabled
2. **Plan Content Location** - Plan is in activities, not session object (UI handles this)
3. **Filtering/Pagination** - Backend has limited filtering, UI does client-side
4. **Action Endpoint Style** - Currently slash-form (`/sessions/:id/approve`), may need colon-form
5. **Persistence Type Mismatch** - Persistence disabled until types align
6. **Base URL Version** - Need to confirm Jules API v1 vs v1alpha
7. **Aspirational Features** - GitHub Analytics, Repo Timeline, Model Management, RAG Notes (stub with "Coming Soon")

## Development Workflow

### Option A: Integrated Build
```bash
# 1. Start backend
cd E:\_projectsGithub\JulesMCP/backend
npm run dev

# 2. Build UI and deploy
cd E:\_projectsGithub\Julescontrolroomui
npm run build
cp -r build/* ../JulesMCP/backend/public/

# 3. Access at http://localhost:3001
```

### Option B: Separate Dev Servers (Recommended for Development)
```bash
# 1. Start backend
cd E:\_projectsGithub\JulesMCP/backend
npm run dev  # Port 3001

# 2. Start UI dev server with proxy
cd E:\_projectsGithub\Julescontrolroomui
npm run dev  # Port 3000, proxies API calls to 3001
```

**Vite proxy configuration:**
```typescript
// Julescontrolroomui/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
});
```

## Environment Configuration

### Backend Environment
```bash
# E:\_projectsGithub\JulesMCP\backend\.env
JULES_API_KEY=your_jules_api_key_here
LOCAL_TOKEN=your_secret_token_here
PORT=3001
ALLOWLIST=  # Empty = localhost only
CORS_ORIGIN=  # Unset = single-origin mode
PERSIST=  # Unset = disabled (due to type mismatches)
NOTIFY_WEBHOOK=  # Optional webhook endpoint
JULES_API_BASE=https://api.jules.ai/v1
```

### UI Environment
```bash
# E:\_projectsGithub\Julescontrolroomui\.env.local (CREATE THIS FILE)
VITE_API_BASE=http://localhost:3001/api
VITE_LOCAL_TOKEN=your_secret_token_here  # Must match backend LOCAL_TOKEN
```

**Critical:** `LOCAL_TOKEN` must be identical in both environments.

## Success Criteria

### Phase 1 Acceptance (Minimum Viable Integration)
- [ ] UI loads from browser (either `backend/public/` or dev server with proxy)
- [ ] Sessions list displays real data from backend
- [ ] Can create a new session via UI form
- [ ] Can view session details and activities
- [ ] Can approve a plan
- [ ] Can send a message to a session
- [ ] Polling updates session list every 3-5 seconds
- [ ] Error states display properly
- [ ] Loading states display properly

### Phase 2 Acceptance (Production Ready)
- [ ] WebSocket delivers real-time session updates
- [ ] Automated build script works: `npm run build:ui`
- [ ] UI assets deployed to `backend/public/`
- [ ] Docker deployment includes UI
- [ ] All core workflows tested end-to-end
- [ ] Error handling is robust
- [ ] Development workflow documented
- [ ] Feature flags implemented for aspirational sections

### Phase 3 Acceptance (MCP Capability - Future)
- [ ] MCP server running as sidecar process
- [ ] Tools exposed: `create_session`, `list_sessions`, `approve_session`, etc.
- [ ] Resources exposed: `resource:sessions/{id}`, `resource:sessions/{id}/activities`
- [ ] Local models/agents can discover and invoke tools
- [ ] MCP and REST endpoints share same backend logic (no drift)
- [ ] UI continues working via REST (no changes required)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Type conversion errors break UI | High | High | Comprehensive adapter layer with unit tests |
| Missing backend features cause UX gaps | High | Medium | Feature flags + "Coming Soon" badges |
| WebSocket complexity delays launch | Medium | Medium | Start with polling, add WS incrementally |
| Mock data behaviors don't match real API | High | Medium | Incremental replacement with testing |
| Build pipeline issues | Low | Low | Manual copy works, automation is optional |
| CORS/auth issues in development | Medium | Low | Vite proxy handles this automatically |

## Timeline Estimates

**Phase 1 (Minimum Viable):** 1-2 days (8-16 hours)
- Setup & environment: 1 hour
- Type conversion layer: 3-4 hours
- API client updates: 2-3 hours
- Mock data replacement: 3-4 hours
- Testing & debugging: 3-4 hours

**Phase 2 (Production Ready):** 2-3 days (12-20 hours)
- WebSocket implementation: 4-6 hours
- Feature flags: 2 hours
- Build automation: 2 hours
- End-to-end testing: 3-4 hours
- Docker integration: 2 hours
- Documentation: 2-3 hours

**Phase 3 (MCP Capability):** 11-15 weeks (if pursued)
- See `docs/MCP_FRAMEWORK_ANALYSIS.md` for detailed breakdown

**Total for Phases 1-2:** 3-5 days (20-36 hours)

## Next Steps (Immediate)

1. **Complete Phase 1 Setup**
   - [ ] Navigate to UI repository: `cd E:\_projectsGithub\Julescontrolroomui`
   - [ ] Install dependencies: `npm install`
   - [ ] Create `.env.local` with API base and token
   - [ ] Test dev server: `npm run dev`

2. **Implement Type Conversion**
   - [ ] Create `src/lib/backend-adapter.ts`
   - [ ] Implement conversion functions
   - [ ] Write unit tests for conversions

3. **Wire First Endpoint**
   - [ ] Update `src/lib/api-client.ts` to use adapter
   - [ ] Modify `src/App.tsx` to fetch real sessions
   - [ ] Test sessions list display

4. **Iterate Through Remaining Endpoints**
   - [ ] Session creation
   - [ ] Session details
   - [ ] Activities list
   - [ ] Approve plan
   - [ ] Send message

## Related Documentation

- **`frontend-backend-reconciliation.md`** - Detailed Day 1 integration plan and type gaps
- **`MCP_FRAMEWORK_ANALYSIS.md`** - Complete MCP strategy for Phase 3
- **`gemini/EXECUTIVE_BRIEF.md`** - 5-minute MCP framework overview
- **`gemini/STRATEGY_COMPARISON.md`** - EasyMCP vs FastMCP 2.0 analysis
- **`CLAUDE.md`** - Backend architecture and development commands
- **`development-guide.md`** - Backend development workflow

## Contact & Support

**Repository:** `E:\_projectsGithub\JulesMCP`
**UI Repository:** `E:\_projectsGithub\Julescontrolroomui`
**Backend API:** `http://localhost:3001/api` (default)
**UI Dev Server:** `http://localhost:3000` (default)

For questions or issues, refer to the comprehensive documentation in `docs/` directory.

---

**Last Updated:** 2025-11-10
**Status:** Phase 1 in progress - Ready to execute
**Next Review:** After Phase 1 completion
