# Jules Control Room - Implementation Phases

**Last Updated:** October 13, 2025
**Purpose:** Detailed technical brief for backend implementation in priority order

---

## 📋 Table of Contents

- [Phase 1: Jules Core Functionality](#phase-1-jules-core-functionality-priority) ⭐ **START HERE**
- [Phase 2: GitHub Analytics](#phase-2-github-analytics-future)
- [Phase 3: Scratch Notes](#phase-3-scratch-notes-somedaytbd)

---

# PHASE 1: Jules Core Functionality (PRIORITY)

## Overview

This phase focuses on the core Jules Control Room mechanics:
- Creating new Jules sessions
- Monitoring active/queued sessions
- Session lifecycle management (plan approval, messaging, etc.)
- Real-time status updates

**Goal:** Get Jules working end-to-end with full session management.

---

_For complete Phase 1 requirements, see the full IMPLEMENTATION_PHASES.md file in the UI repository._

_The UI prototype includes complete implementations for:_
- **Create Job Page** - Session creation form with repository, branch, prompt
- **Jobs Panel** - Session listing with search/filter
- **Session Detail Modal** - Complete session management UI with tabs
- **LLM Enhancement Dialog** - AI-powered prompt enhancement
- **Settings Dialog** - API key and preference management

---

## Backend API Endpoints Required

### Core Session Management

#### 1. List Sessions
```http
GET /api/sessions

Query Parameters:
  - status: SessionStatus (optional, filter)
  - search: string (optional, searches repo/branch/prompt)
  - limit: number (default: 50, pagination)
  - offset: number (default: 0, pagination)
  - sort: string (default: "updatedAt:desc")

Response: 200 OK
{
  "sessions": [
    {
      "id": "session_abc123",
      "status": "IN_PROGRESS" | "QUEUED" | "PLANNING" | "AWAITING_PLAN_APPROVAL" | "COMPLETED" | "FAILED",
      "repo": "acme-corp/web-app",
      "branch": "main",
      "prompt": "Fix failing tests in authentication module",
      "requirePlanApproval": true,
      "createdAt": "2025-10-13T10:00:00Z",
      "updatedAt": "2025-10-13T10:05:00Z"
    }
  ],
  "total": 42,
  "hasMore": true
}
```

#### 2. Create Session
#### 3. Get Session Details
#### 4. Approve/Reject Plan
#### 5. Send Message to Jules

_Full API specifications available in IMPLEMENTATION_PHASES.md_

---

## Data Models

### Session
```typescript
interface Session {
  id: string;                      // Unique identifier
  status: SessionStatus;           // Current status
  repo: string;                    // Full repo name (owner/repo)
  branch: string;                  // Branch name
  prompt: string;                  // User's task description
  requirePlanApproval: boolean;    // Whether plan approval is needed
  createdAt: string;               // ISO 8601 timestamp
  updatedAt: string;               // ISO 8601 timestamp
  julesSessionId?: string;         // Jules API session ID
}

type SessionStatus =
  | 'QUEUED'
  | 'PLANNING'
  | 'AWAITING_PLAN_APPROVAL'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED';
```

---

## Phase 1 Completion Criteria

### Must Have ✅
- [ ] Users can create Jules sessions from UI
- [ ] Sessions appear in jobs panel immediately
- [ ] Real-time status updates (polling or WebSocket)
- [ ] Session detail modal shows all information
- [ ] Plan approval workflow works end-to-end
- [ ] Users can send messages to Jules
- [ ] Jules' responses appear in UI
- [ ] Error handling for all failure cases
- [ ] GitHub OAuth for repository access
- [ ] Basic authentication and authorization

### Nice to Have 🎯
- [ ] Server-side prompt enhancement with LLM
- [ ] WebSocket instead of polling
- [ ] Advanced search in jobs panel
- [ ] Session export (download logs, messages)
- [ ] Keyboard shortcuts work perfectly
- [ ] Mobile responsive design
- [ ] Dark mode preference persists

### Out of Scope for Phase 1 ⛔
- GitHub Analytics page (Phase 2)
- Scratch Notes page (Phase 3)
- Multi-user collaboration
- Advanced analytics/reporting
- Custom webhooks
- Integration with other tools (Jira, Slack, etc.)

---

# PHASE 2: GitHub Analytics (FUTURE)

## Overview

Multi-repository insights, stale issue/PR tracking, and AI-powered recommendations for which issues to assign to Jules.

**Goal:** Help users identify the best issues to automate with Jules across multiple repositories.

_Full Phase 2 specifications available in IMPLEMENTATION_PHASES.md_

---

# PHASE 3: Scratch Notes (SOMEDAY/TBD)

## Overview

Personal notes workspace for user reference. Can optionally sync to user's own backend for RAG ingestion or other processing.

**Status:** Low priority, UI is complete but backend integration deferred.

---

## End of Document

**For Phase 1 implementation, focus on:**
1. Session creation and management
2. Jobs panel with real-time updates
3. Session detail modal with all tabs
4. Plan approval workflow
5. Messaging functionality

**GitHub Analytics (Phase 2) can wait until Phase 1 is stable and working.**

---

*Last updated: October 13, 2025*
