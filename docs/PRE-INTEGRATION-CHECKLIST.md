---
doc_type: reference
subsystem: ui
version: 1.0.0
status: approved
owners: UI Integration Team
last_reviewed: 2025-11-10
---

# Pre-Integration Checklist

**Purpose:** Ensure all prerequisites are met before starting UI integration

**Target Audience:** Future Claude Code instances, development teams, project reviewers

**Last Updated:** 2025-11-10

---

## 📋 Overview

This checklist must be completed before beginning Phase 2A (Environment Setup) of the [Integration Execution Plan](./INTEGRATION_EXECUTION_PLAN.md).

**Estimated Time:** 30-60 minutes

**Goal:** Validate that both repositories, dependencies, environment, and documentation are ready for integration work.

---

## ✅ Repository Status

### Backend Repository

- [ ] **Repository Location Verified**
  - Path: `E:\_projectsGithub\JulesMCP`
  - Git status: Clean or with only tracked changes
  - Branch: `main`

- [ ] **Latest Code Pulled**
  ```bash
  cd E:\_projectsGithub\JulesMCP
  git pull origin main
  ```

- [ ] **All Documentation Present**
  - [ ] `docs/INTEGRATION_EXECUTION_PLAN.md` exists (updated 2025-11-10)
  - [ ] `docs/UI_INTEGRATION_ROADMAP.md` exists
  - [ ] `docs/frontend-backend-reconciliation.md` exists
  - [ ] `docs/ui/` folder exists with 6 files (README.md, ARCHITECTURE.md, etc.)
  - [ ] `docs/INDEX.md` updated with UI integration section

- [ ] **Backend Dependencies**
  - [ ] `node_modules/` exists and is populated
  - [ ] Run `npm install` if missing dependencies
  - [ ] No security vulnerabilities: `npm audit`

- [ ] **Backend Tests Pass**
  ```bash
  npm run test
  # All 8 test suites should pass
  ```

- [ ] **Backend Environment**
  - [ ] `backend/.env` file exists
  - [ ] `JULES_API_KEY` is set (obtain from Google)
  - [ ] `LOCAL_TOKEN` is set (generate 32+ char random string)
  - [ ] Optional: `ALLOWLIST`, `CORS_ORIGIN`, `PERSIST`, `NOTIFY_WEBHOOK` configured if needed

### UI Repository

- [ ] **Repository Location Verified**
  - Path: `E:\_projectsGithub\Julescontrolroomui`
  - Separate git repository (not a submodule)
  - Git remote: https://github.com/Coldaine/Julescontrolroomui.git

- [ ] **Latest Code Pulled**
  ```bash
  cd E:\_projectsGithub\Julescontrolroomui
  git pull origin main
  ```

- [ ] **UI Dependencies**
  - [ ] `node_modules/` exists and is populated (~300MB)
  - [ ] Run `npm install` if missing dependencies
  - [ ] No security vulnerabilities: `npm audit`

- [ ] **UI Files Status Check**
  - [ ] `src/lib/types.ts` exists (UI type definitions)
  - [ ] `src/lib/api-client.ts` exists (partially implemented)
  - [ ] `src/lib/backend-adapter.ts` exists BUT IS EMPTY (needs implementation)
  - [ ] `src/lib/mock-data.ts` exists (currently used, will be removed)
  - [ ] `src/App.tsx` exists (uses mock data, will be updated)
  - [ ] `vite.config.ts` exists (will need proxy section added)

- [ ] **UI Environment**
  - [ ] Create `.env.local` if it doesn't exist:
    ```bash
    cd E:\_projectsGithub\Julescontrolroomui
    echo VITE_API_BASE=http://localhost:3001/api > .env.local
    echo VITE_LOCAL_TOKEN=<same_as_backend_LOCAL_TOKEN> >> .env.local
    ```
  - [ ] `VITE_LOCAL_TOKEN` MATCHES `LOCAL_TOKEN` in backend/.env (CRITICAL!)

---

## 🛠️ Development Environment

### Node.js & npm

- [ ] **Node.js Version**
  ```bash
  node --version
  # Should be v20.x or higher
  ```

- [ ] **npm Version**
  ```bash
  npm --version
  # Should be 9.x or higher
  ```

### Platform & Tools

- [ ] **Windows 11 Confirmed**
  - Commands use Windows path format (`\` not `/`)
  - PowerShell available for build scripts
  - Windows Terminal or similar terminal emulator

- [ ] **Git Installed**
  ```bash
  git --version
  # Any recent version
  ```

- [ ] **Text Editor/IDE**
  - VS Code, WebStorm, or preferred editor installed
  - TypeScript language support enabled

---

## 📖 Documentation Review

### Required Reading (MUST READ BEFORE STARTING)

- [ ] **[INTEGRATION_EXECUTION_PLAN.md](./INTEGRATION_EXECUTION_PLAN.md)** (45 min read)
  - Complete 23-step execution guide
  - Phase 0: Environment Validation added
  - Critical corrections for Windows, repository structure, type adapter

- [ ] **[UI_INTEGRATION_ROADMAP.md](./UI_INTEGRATION_ROADMAP.md)** (20 min read)
  - Strategic overview of integration phases
  - Timeline estimates (20-36 hours)
  - Type mismatch analysis
  - Risk assessment

- [ ] **[frontend-backend-reconciliation.md](./frontend-backend-reconciliation.md)** (15 min read)
  - Known type gaps between UI and backend
  - Day 1 integration acceptance criteria
  - Compatibility matrix

### Reference Documentation (Read as Needed)

- [ ] **[docs/ui/README.md](./ui/README.md)** - Index of UI documentation
- [ ] **[docs/ui/BACKEND_BRIEF.md](./ui/BACKEND_BRIEF.md)** - Executive summary for backend teams
- [ ] **[docs/ui/ARCHITECTURE.md](./ui/ARCHITECTURE.md)** - System architecture and data flow
- [ ] **[docs/ui/INTEGRATION_GUIDE.md](./ui/INTEGRATION_GUIDE.md)** - Step-by-step API integration
- [ ] **[docs/ui/JULES_API_AUDIT.md](./ui/JULES_API_AUDIT.md)** - Feature compatibility matrix
- [ ] **[CLAUDE.md](../CLAUDE.md)** - Backend architecture and commands
- [ ] **[docs/development-guide.md](./development-guide.md)** - Backend development workflow

---

## 🧪 Validation Tests

### Backend Validation

- [ ] **Server Starts Successfully**
  ```bash
  cd E:\_projectsGithub\JulesMCP
  npm run dev
  # Should see: "Server listening on port 3001"
  # Press Ctrl+C to stop
  ```

- [ ] **Health Check Responds**
  ```bash
  curl http://localhost:3001/healthz
  # Should return: {"status":"ok"}
  ```

- [ ] **API Endpoints Accessible**
  ```bash
  curl http://localhost:3001/api/sessions \
    -H "Authorization: Bearer <your_LOCAL_TOKEN>"
  # Should return JSON with sessions array (likely empty)
  ```

### UI Validation

- [ ] **UI Dev Server Starts**
  ```bash
  cd E:\_projectsGithub\Julescontrolroomui
  npm run dev
  # Should see: "Local: http://localhost:3000"
  # Press Ctrl+C to stop
  ```

- [ ] **UI Loads in Browser**
  - Open `http://localhost:3000`
  - Should see Jules Control Room with mock data
  - No console errors (mock data expected)
  - UI should be fully functional with mock interactions

### Type System Check

- [ ] **Backend Types Available**
  ```bash
  cd E:\_projectsGithub\JulesMCP
  ls shared/types.ts
  # File should exist and contain JulesSession, SessionActivity, etc.
  ```

- [ ] **UI Types Available**
  ```bash
  cd E:\_projectsGithub\Julescontrolroomui
  ls src/lib/types.ts
  # File should exist and contain Session, Activity, SessionStatus, etc.
  ```

- [ ] **Type Adapter Empty (Expected)**
  ```bash
  cd E:\_projectsGithub\Julescontrolroomui
  wc -l src/lib/backend-adapter.ts
  # Should show 2 lines (empty file, needs implementation in Step 10)
  ```

---

## 📝 Known Issues & Warnings

### Expected State

✅ **These are NORMAL and EXPECTED:**
- Backend `backend/public/` is empty (will be populated after UI build)
- UI `backend-adapter.ts` is empty (implementation is Step 10)
- UI `App.tsx` uses mock data (will be replaced in Step 13)
- UI `.env.local` may not exist (will be created in Phase 0)
- Backend tests may show "no node_modules" if not installed yet

### Critical Warnings

⚠️ **These will BLOCK integration:**
- ❌ Tokens not matching between backend and UI
- ❌ Node.js version < 20
- ❌ Backend tests failing
- ❌ Missing required documentation files
- ❌ UI dependencies not installed
- ❌ Backend dependencies not installed

### Windows-Specific Considerations

🪟 **Windows-specific items to verify:**
- [ ] PowerShell available (for build scripts)
- [ ] Windows paths use backslashes (`\`) not forward slashes
- [ ] File paths are absolute, not relative
- [ ] `xcopy` or `robocopy` available for build deployment
- [ ] Windows Firewall allows Node.js on ports 3000 and 3001
- [ ] No permission issues with file operations

---

## 🎯 Decision Points

Before starting integration, answer these questions:

### Integration Strategy

- [ ] **Repository Structure Decision**
  - Using separate repos with build copy (recommended for rapid dev)
  - OR Converting to git submodule (for production)
  - Decision documented in project notes

- [ ] **Real-Time Updates Strategy**
  - Start with polling (simpler, Phase 2B)
  - OR Implement WebSocket immediately (better UX, Phase 2D)
  - Decision documented

- [ ] **Authentication Approach**
  - Single bearer token (simple, personal use)
  - OR OAuth/JWT (multi-user, future)
  - Decision documented

### Feature Scope

- [ ] **Phase 1 Features Confirmed**
  - Session CRUD (create, read, list, update)
  - Plan approval workflow
  - Message sending
  - Activity stream
  - Status updates (polling or WebSocket)

- [ ] **Deferred Features Acknowledged**
  - GitHub Analytics (Phase 2)
  - RAG Notes (Phase 3)
  - MCP Integration (Phase 3+)
  - Auto PR creation (not supported by backend)

---

## 📊 Completion Criteria

**✅ Ready to Start Integration When:**

1. All checkboxes above are checked
2. Both repos are at latest code
3. All dependencies installed
4. Backend tests pass
5. Both servers start without errors
6. Environment files configured correctly
7. Required documentation read and understood
8. Type system verified
9. No blocking issues present
10. Decisions documented

**Time Investment So Far:** ~30-60 minutes

**Next Step:** Begin [Phase 0: Environment Validation](./INTEGRATION_EXECUTION_PLAN.md#phase-0-environment-validation-30-minutes) in the Integration Execution Plan

---

## 🔄 Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-10 | 1.0 | Initial checklist creation |

---

## 📞 Support

If any checklist item fails:

1. **Check troubleshooting sections** in Integration Execution Plan
2. **Review error messages** carefully
3. **Verify paths** are correct for Windows
4. **Check documentation** for similar issues
5. **Ask for help** with specific error details

---

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

Mark your progress: __________

**Completed By:** __________

**Date:** __________

**Time Taken:** __________ minutes

**Ready to Proceed:** ⬜ Yes | ⬜ No (resolve issues above)

---

**Next Document:** [Integration Execution Plan - Phase 0](./INTEGRATION_EXECUTION_PLAN.md#phase-0-environment-validation-30-minutes)
