---
doc_type: plan
subsystem: general
version: 1.0.0
status: draft
owners: Documentation Working Group
last_reviewed: 2025-11-10
---

# Documentation Refactoring Plan

## Executive Summary

This plan outlines the comprehensive refactoring of the Jules Control Room Backend documentation to comply with the Master Documentation Playbook (v1.0.1) located at `docs/playbooks/organizational/documentation_playbook.md`. The refactoring will standardize structure, add required metadata, implement proper lifecycle management, and establish domain-oriented organization.

**Timeline:** Estimated 3-4 hours for complete refactoring
**Impact:** All documentation files will be reorganized and updated with metadata headers

---

## Current State Analysis

### Existing Structure

```
docs/
├── INDEX.md                           # Navigation hub (needs metadata)
├── REORGANIZATION.md                  # Historical doc (needs metadata)
├── deployment.md                      # Deployment guide (needs metadata)
├── development-guide.md               # Dev guide (needs metadata)
├── implementation-notes.md            # Implementation details (needs metadata)
├── frontend-backend-reconciliation.md # Technical analysis (needs metadata)
├── MCP_FRAMEWORK_ANALYSIS.md          # Framework decision (needs metadata)
├── PRE-INTEGRATION-CHECKLIST.md       # Checklist (needs metadata)
├── UI_INTEGRATION_ROADMAP.md          # Roadmap (needs metadata)
├── INTEGRATION_EXECUTION_PLAN.md      # Execution plan (needs metadata)
├── ui-overview.md                     # UI overview (needs metadata)
├── gemini/                            # Research docs (6 files, all need metadata)
│   ├── ARCHITECTURE_DIAGRAMS.md
│   ├── EXECUTIVE_BRIEF.md
│   ├── MCPResearch.md
│   ├── mergeAnalysis.md
│   ├── README.md
│   ├── strategicUpdate.md
│   └── STRATEGY_COMPARISON.md
├── merge/                             # Planning docs (2 files, need metadata)
│   ├── functionalityLoss.md
│   └── mergeplanOne.md
├── plans/                             # Active plans (1 file, needs metadata)
│   └── ATOMIC_INTEGRATION_PLAN.md
├── ui/                                # UI docs (6 files, all need metadata)
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── BACKEND_BRIEF.md
│   ├── IMPLEMENTATION_PHASES.md
│   ├── INTEGRATION_GUIDE.md
│   └── JULES_API_AUDIT.md
└── playbooks/
    └── organizational/
        └── documentation_playbook.md  # ✓ Already has metadata
```

### Critical Gaps

1. **No metadata headers** on any existing files (28 files need headers)
2. **Missing required files:**
   - `docs/architecture.md` (required)
   - `docs/standards.md` (required)
   - `docs/todo.md` (required)
   - `docs/agents.md` (required, mirror of CLAUDE.md)
   - `docs/architecture/roadmap.md` (required)
3. **No domain structure** - needs `docs/domains/` with subdomains
4. **No research structure** - needs `docs/research/` for ephemeral docs
5. **No tasks structure** - needs `docs/tasks/` for task breakdowns
6. **No revision log** - needs `docs/revision_log.csv`
7. **No validation scripts** - needs pre-push hooks for metadata validation

### Root-Level Files

- `README.md` ✓ (approved exception)
- `CLAUDE.md` ✓ (approved exception, needs to mirror docs/agents.md)
- No CHANGELOG.md (should be created)

---

## Identified Domains

Based on the project architecture (backend Express server), the following domains should be created:

1. **api** (domain_code: `api`) - REST API, routes, sessions
2. **websocket** (domain_code: `ws`) - WebSocket functionality, real-time updates
3. **auth** (domain_code: `auth`) - Authentication and security
4. **jules-integration** (domain_code: `ji`) - Jules API client wrapper
5. **persistence** (domain_code: `per`) - Storage and notifications
6. **ui** (domain_code: `ui`) - UI integration (existing structure to be reorganized)

---

## Target Structure

```
docs/
├── architecture.md                    # NEW: High-level system overview
├── architecture/
│   ├── roadmap.md                     # NEW: Project roadmap
│   └── adr-0001-mcp-framework.md      # NEW: ADR from MCP_FRAMEWORK_ANALYSIS.md
├── standards.md                       # NEW: Documentation standards
├── agents.md                          # NEW: Mirror of CLAUDE.md
├── todo.md                            # NEW: Task tracking source of truth
├── revision_log.csv                   # NEW: File change log
│
├── domains/
│   ├── api/
│   │   ├── api-overview.md            # NEW: REST API overview
│   │   ├── api-routes.md              # NEW: Route documentation
│   │   └── api-error-handling.md      # NEW: Error handling patterns
│   ├── websocket/
│   │   ├── ws-overview.md             # NEW: WebSocket overview
│   │   ├── ws-delta-broadcasting.md   # NEW: Delta broadcast mechanism
│   │   └── ws-heartbeat.md            # NEW: Heartbeat & health monitoring
│   ├── auth/
│   │   ├── auth-overview.md           # NEW: Auth system overview
│   │   └── auth-security.md           # NEW: Security patterns (IP allowlist, rate limiting)
│   ├── jules-integration/
│   │   ├── ji-overview.md             # NEW: Jules API integration overview
│   │   └── ji-retry-logic.md          # NEW: Retry and backoff patterns
│   ├── persistence/
│   │   ├── per-overview.md            # NEW: Persistence overview
│   │   ├── per-sqlite.md              # NEW: SQLite storage
│   │   └── per-webhooks.md            # NEW: Webhook notifications
│   └── ui/
│       ├── ui-overview.md             # MOVED from ui-overview.md
│       ├── ui-architecture.md         # MOVED from ui/ARCHITECTURE.md
│       ├── ui-backend-brief.md        # MOVED from ui/BACKEND_BRIEF.md
│       ├── ui-implementation-phases.md # MOVED from ui/IMPLEMENTATION_PHASES.md
│       ├── ui-integration-guide.md    # MOVED from ui/INTEGRATION_GUIDE.md
│       └── ui-jules-api-audit.md      # MOVED from ui/JULES_API_AUDIT.md
│
├── plans/
│   ├── atomic-integration.md          # MOVED from plans/ATOMIC_INTEGRATION_PLAN.md
│   ├── ui-integration-roadmap.md      # MOVED from UI_INTEGRATION_ROADMAP.md
│   └── integration-execution.md       # MOVED from INTEGRATION_EXECUTION_PLAN.md
│
├── reference/
│   ├── deployment.md                  # MOVED from deployment.md
│   ├── development-guide.md           # MOVED from development-guide.md
│   ├── implementation-notes.md        # MOVED from implementation-notes.md
│   ├── frontend-backend-reconciliation.md # MOVED from frontend-backend-reconciliation.md
│   └── pre-integration-checklist.md   # MOVED from PRE-INTEGRATION-CHECKLIST.md
│
├── research/
│   ├── pr-reports/                    # NEW: For future PR reports
│   ├── checkpoints/                   # NEW: For validation checkpoints
│   ├── logs/                          # NEW: For investigation logs
│   ├── gemini/                        # MOVED from gemini/
│   │   ├── README.md
│   │   ├── architecture-diagrams.md
│   │   ├── executive-brief.md
│   │   ├── mcp-research.md
│   │   ├── merge-analysis.md
│   │   ├── strategic-update.md
│   │   └── strategy-comparison.md
│   └── historical/
│       ├── reorganization.md          # MOVED from REORGANIZATION.md
│       └── merge/                     # MOVED from merge/
│           ├── functionality-loss.md
│           └── merge-plan-one.md
│
├── playbooks/
│   └── organizational/
│       ├── documentation_playbook.md  # EXISTS: Master playbook (already created)
│       ├── pr_playbook.md             # NEW: PR policies
│       └── ci_cd_playbook.md          # NEW: CI/CD conventions
│
├── tasks/                             # NEW: Task breakdown materials
└── INDEX.md                           # UPDATED: Add metadata, update structure
```

---

## Refactoring Phases

### Phase 1: Foundation (Priority 1)
**Estimated time: 1-1.5 hours**

#### 1.1 Create Required Files

- [ ] Create `docs/architecture.md` with metadata
  - High-level system overview
  - Link to architecture/roadmap.md and ADRs
  - Describe Express backend architecture
- [ ] Create `docs/architecture/roadmap.md` with metadata
  - Current state: Phase 0 & 1 complete (per git status)
  - Future phases and milestones
- [ ] Create `docs/standards.md` with metadata
  - Reference Master Documentation Playbook
  - Metadata schema documentation
  - Changelog rubric
  - Exceptions list
- [ ] Create `docs/agents.md` with metadata
  - Mirror full contents of CLAUDE.md
  - Add links to playbook and standards
  - Keep synchronized with CLAUDE.md
- [ ] Create `docs/todo.md` with metadata
  - Initial task list structure
  - Link to this refactoring plan
- [ ] Create `docs/revision_log.csv`
  - CSV header: `timestamp,actor,path,action,summary`
  - Initial entry for this refactoring
- [ ] Create `CHANGELOG.md` at root
  - Initial version entry
  - Release notes format

#### 1.2 Create Additional Playbooks

- [ ] Create `docs/playbooks/organizational/pr_playbook.md`
  - PR template requirements
  - Merge policy (rebase and merge)
  - Review requirements
  - Documentation update requirements
- [ ] Create `docs/playbooks/organizational/ci_cd_playbook.md`
  - CI validation rules
  - Metadata header enforcement
  - Mermaid diagram linting
  - Documentation structure visualizations

**Note:** The Master Documentation Playbook already exists at `docs/playbooks/organizational/documentation_playbook.md`.

#### 1.3 Update Root Files

- [ ] Update `CLAUDE.md` to reference docs/agents.md
  - Add note about synchronization requirement
  - Link to documentation playbook
- [ ] Update `README.md`
  - Add Contributing section referencing todo.md
  - Link to standards.md

---

### Phase 2: Add Metadata Headers (Priority 1)
**Estimated time: 1 hour**

Add required metadata headers to ALL existing markdown files (28 files).

#### 2.1 Core Documentation Files

- [ ] `docs/INDEX.md`
  - doc_type: index
  - subsystem: general
  - status: approved
- [ ] `docs/deployment.md`
  - doc_type: reference
  - subsystem: general
  - status: approved
- [ ] `docs/development-guide.md`
  - doc_type: reference
  - subsystem: general
  - status: approved
- [ ] `docs/implementation-notes.md`
  - doc_type: reference
  - subsystem: general
  - status: approved

#### 2.2 UI Documentation Files (6 files)

- [ ] `docs/ui/README.md` → doc_type: index, subsystem: ui
- [ ] `docs/ui/ARCHITECTURE.md` → doc_type: architecture, subsystem: ui
- [ ] `docs/ui/BACKEND_BRIEF.md` → doc_type: reference, subsystem: ui
- [ ] `docs/ui/IMPLEMENTATION_PHASES.md` → doc_type: plan, subsystem: ui
- [ ] `docs/ui/INTEGRATION_GUIDE.md` → doc_type: reference, subsystem: ui
- [ ] `docs/ui/JULES_API_AUDIT.md` → doc_type: reference, subsystem: ui

#### 2.3 Planning Documents

- [ ] `docs/plans/ATOMIC_INTEGRATION_PLAN.md` → doc_type: plan, subsystem: ui
- [ ] `docs/UI_INTEGRATION_ROADMAP.md` → doc_type: plan, subsystem: ui
- [ ] `docs/INTEGRATION_EXECUTION_PLAN.md` → doc_type: plan, subsystem: ui
- [ ] `docs/PRE-INTEGRATION-CHECKLIST.md` → doc_type: reference, subsystem: ui

#### 2.4 Research Documents (8 files)

**Gemini folder (6 files):**
- [ ] `docs/gemini/README.md` → doc_type: index, subsystem: general
- [ ] `docs/gemini/ARCHITECTURE_DIAGRAMS.md` → doc_type: research, subsystem: general
- [ ] `docs/gemini/EXECUTIVE_BRIEF.md` → doc_type: research, subsystem: general
- [ ] `docs/gemini/MCPResearch.md` → doc_type: research, subsystem: general
- [ ] `docs/gemini/mergeAnalysis.md` → doc_type: research, subsystem: general
- [ ] `docs/gemini/strategicUpdate.md` → doc_type: research, subsystem: general
- [ ] `docs/gemini/STRATEGY_COMPARISON.md` → doc_type: research, subsystem: general

**Merge folder (2 files):**
- [ ] `docs/merge/functionalityLoss.md` → doc_type: research, subsystem: general
- [ ] `docs/merge/mergeplanOne.md` → doc_type: research, subsystem: general

#### 2.5 Other Documents

- [ ] `docs/REORGANIZATION.md` → doc_type: research, subsystem: general
- [ ] `docs/frontend-backend-reconciliation.md` → doc_type: reference, subsystem: ui
- [ ] `docs/MCP_FRAMEWORK_ANALYSIS.md` → doc_type: architecture, subsystem: general
- [ ] `docs/ui-overview.md` → doc_type: reference, subsystem: ui

---

### Phase 3: Reorganize Structure (Priority 2)
**Estimated time: 1 hour**

#### 3.1 Create Domain Structure

**Create directories:**
```bash
mkdir -p docs/domains/{api,websocket,auth,jules-integration,persistence,ui}
mkdir -p docs/research/{pr-reports,checkpoints,logs,historical}
mkdir -p docs/tasks
```

#### 3.2 Create Domain Overview Documents

Each domain MUST have an overview document with domain_code in frontmatter:

- [ ] `docs/domains/api/api-overview.md` (domain_code: api)
- [ ] `docs/domains/websocket/ws-overview.md` (domain_code: ws)
- [ ] `docs/domains/auth/auth-overview.md` (domain_code: auth)
- [ ] `docs/domains/jules-integration/ji-overview.md` (domain_code: ji)
- [ ] `docs/domains/persistence/per-overview.md` (domain_code: per)
- [ ] `docs/domains/ui/ui-overview.md` (domain_code: ui)

#### 3.3 Move and Rename Files

**UI domain files (use domain code prefix):**
```bash
# Move ui/ folder contents to domains/ui/ with proper naming
mv docs/ui/ARCHITECTURE.md → docs/domains/ui/ui-architecture.md
mv docs/ui/BACKEND_BRIEF.md → docs/domains/ui/ui-backend-brief.md
mv docs/ui/IMPLEMENTATION_PHASES.md → docs/domains/ui/ui-implementation-phases.md
mv docs/ui/INTEGRATION_GUIDE.md → docs/domains/ui/ui-integration-guide.md
mv docs/ui/JULES_API_AUDIT.md → docs/domains/ui/ui-jules-api-audit.md
mv docs/ui-overview.md → docs/domains/ui/ui-overview-legacy.md
```

**Plans folder (kebab-case):**
```bash
mv docs/plans/ATOMIC_INTEGRATION_PLAN.md → docs/plans/atomic-integration-plan.md
mv docs/UI_INTEGRATION_ROADMAP.md → docs/plans/ui-integration-roadmap.md
mv docs/INTEGRATION_EXECUTION_PLAN.md → docs/plans/integration-execution-plan.md
```

**Reference folder:**
```bash
# Keep current files but move to reference/
mv docs/deployment.md → docs/reference/deployment.md
mv docs/development-guide.md → docs/reference/development-guide.md
mv docs/implementation-notes.md → docs/reference/implementation-notes.md
mv docs/frontend-backend-reconciliation.md → docs/reference/frontend-backend-reconciliation.md
mv docs/PRE-INTEGRATION-CHECKLIST.md → docs/reference/pre-integration-checklist.md
```

**Research folder (kebab-case):**
```bash
# Move gemini/ to research/gemini/ with renames
mv docs/gemini/ARCHITECTURE_DIAGRAMS.md → docs/research/gemini/architecture-diagrams.md
mv docs/gemini/EXECUTIVE_BRIEF.md → docs/research/gemini/executive-brief.md
mv docs/gemini/MCPResearch.md → docs/research/gemini/mcp-research.md
mv docs/gemini/mergeAnalysis.md → docs/research/gemini/merge-analysis.md
mv docs/gemini/strategicUpdate.md → docs/research/gemini/strategic-update.md
mv docs/gemini/STRATEGY_COMPARISON.md → docs/research/gemini/strategy-comparison.md
mv docs/gemini/README.md → docs/research/gemini/README.md

# Move merge/ to research/historical/merge/ with renames
mv docs/merge/functionalityLoss.md → docs/research/historical/merge/functionality-loss.md
mv docs/merge/mergeplanOne.md → docs/research/historical/merge/merge-plan-one.md

# Move REORGANIZATION.md to research/historical/
mv docs/REORGANIZATION.md → docs/research/historical/reorganization.md
```

**Architecture folder:**
```bash
# Create ADR from MCP_FRAMEWORK_ANALYSIS
# This needs manual transformation, not just a move
# Create docs/architecture/adr-0001-mcp-framework-selection.md
# Reference from docs/architecture.md
```

#### 3.4 Update Internal Links

After moving files, update all internal documentation links:

- [ ] Update links in INDEX.md
- [ ] Update links in README.md
- [ ] Update links in CLAUDE.md / agents.md
- [ ] Update cross-references in all moved files
- [ ] Validate all links work (can use markdown link checker)

#### 3.5 Create Redirect Stubs (Optional)

For heavily-referenced files, create redirect stubs at old locations:

```markdown
---
redirect: ../../domains/ui/ui-architecture.md
doc_type: reference
subsystem: ui
version: 1.0.0
status: deprecated
owners: Documentation Team
last_reviewed: 2025-11-10
---

# Redirected

This file has been moved to: [domains/ui/ui-architecture.md](../../domains/ui/ui-architecture.md)
```

---

### Phase 4: Create Domain Documentation (Priority 3)
**Estimated time: 2-3 hours**

This phase involves writing NEW documentation for each domain based on existing content in CLAUDE.md, development-guide.md, and implementation-notes.md.

#### 4.1 API Domain (domain_code: api)

- [ ] `docs/domains/api/api-overview.md`
  - REST API architecture
  - Express middleware chain
  - Zod validation approach
  - Link to all other api docs
- [ ] `docs/domains/api/api-routes.md`
  - Route documentation (GET/POST /sessions, etc.)
  - Request/response schemas
  - Error responses
- [ ] `docs/domains/api/api-error-handling.md`
  - Error mapping patterns
  - Zod validation error handling
  - Jules API error propagation

#### 4.2 WebSocket Domain (domain_code: ws)

- [ ] `docs/domains/websocket/ws-overview.md`
  - WebSocket architecture
  - Delta broadcasting mechanism
  - Link to all other ws docs
- [ ] `docs/domains/websocket/ws-delta-broadcasting.md`
  - Background poller (5s interval)
  - Session diffing algorithm
  - Broadcast protocol
- [ ] `docs/domains/websocket/ws-heartbeat.md`
  - Heartbeat ping/pong (30s)
  - Dead connection detection
  - Backpressure protection (1MB limit)

#### 4.3 Auth Domain (domain_code: auth)

- [ ] `docs/domains/auth/auth-overview.md`
  - Dual auth system (REST + WebSocket)
  - Single-user security model
  - Link to auth-security.md
- [ ] `docs/domains/auth/auth-security.md`
  - IP allowlist (CIDR prefixes)
  - Rate limiting (60 req/min)
  - Token filtering in logs
  - LAN exposure considerations

#### 4.4 Jules Integration Domain (domain_code: ji)

- [ ] `docs/domains/jules-integration/ji-overview.md`
  - Jules API wrapper architecture
  - Custom JulesHttpError
  - Link to retry-logic.md
- [ ] `docs/domains/jules-integration/ji-retry-logic.md`
  - 10s timeout with AbortController
  - Exponential backoff (4 attempts)
  - 429/5xx retry strategy
  - Secret-safe logging

#### 4.5 Persistence Domain (domain_code: per)

- [ ] `docs/domains/persistence/per-overview.md`
  - Optional persistence features
  - PERSIST=1 flag
  - NOTIFY_WEBHOOK configuration
  - Link to sqlite and webhooks docs
- [ ] `docs/domains/persistence/per-sqlite.md`
  - sql.js in-memory database
  - File snapshots to data/sessions.sqlite
  - Session delta storage
- [ ] `docs/domains/persistence/per-webhooks.md`
  - Webhook notification mechanism
  - POST session deltas to HTTPS endpoint
  - Secret redaction in webhooks

#### 4.6 UI Domain (domain_code: ui)

Already has 6 documents that were moved and renamed. Create:

- [ ] Update `docs/domains/ui/ui-overview.md` to be the domain overview
  - Add domain_code: ui to frontmatter
  - Link to all other ui docs
  - Reference the legacy ui-overview-legacy.md if needed

---

### Phase 5: Validation & Enforcement (Priority 2)
**Estimated time: 1 hour**

#### 5.1 Create Validation Scripts

- [ ] Create `scripts/validate_metadata_headers.py`
  - Check all docs/*.md files have required frontmatter
  - Validate field types (doc_type enum, semver version, date format)
  - Exit with error code if validation fails
- [ ] Create `scripts/validate_domain_docs_naming.py`
  - Check docs/domains/<domain>/ files include domain code
  - Check domain_code is declared in overview frontmatter
  - Exit with error code if validation fails
- [ ] Create `scripts/validate_links.py`
  - Check all internal markdown links resolve
  - Report broken links
  - Exit with error code if broken links found

#### 5.2 Create Pre-Push Hook

- [ ] Create `.husky/pre-push` hook (or update existing)
  - Run `scripts/validate_metadata_headers.py`
  - Run `scripts/validate_domain_docs_naming.py`
  - Run `scripts/validate_links.py`
  - Block push if validation fails

#### 5.3 Create GitHub Actions CI (Optional)

- [ ] Create `.github/workflows/docs-validation.yml`
  - Run on PR to main
  - Validate metadata headers
  - Validate domain naming
  - Validate internal links
  - Check for docs outside /docs (except approved exceptions)

---

### Phase 6: Documentation & Cleanup (Priority 3)
**Estimated time: 30 min**

#### 6.1 Update INDEX.md

- [ ] Rewrite INDEX.md to reflect new structure
  - Link to architecture.md as primary entry
  - Link to domains/ overview
  - Link to playbooks/
  - Link to standards.md
  - Maintain clear navigation

#### 6.2 Update Root README.md

- [ ] Add Contributing section
  - Reference docs/todo.md for task tracking
  - Reference docs/standards.md for standards
  - Reference docs/playbooks/ for process
- [ ] Update documentation links
  - Point to new structure
  - Highlight key entry points

#### 6.3 Repository Overrides Section

- [ ] Add "Repository Overrides" section to docs/README.md (or docs/standards.md)
  - Note: This is a JavaScript/TypeScript backend project (not Rust)
  - No crates/ directory (replace with backend/ or modules/)
  - Domains reflect Express backend architecture
  - Link back to Master Documentation Playbook

#### 6.4 Clean Up Old Structure

- [ ] Remove empty directories (after file moves)
  - `docs/ui/` (if empty)
  - `docs/gemini/` (if empty)
  - `docs/merge/` (if empty)
- [ ] Verify all files have been accounted for
- [ ] Test navigation from INDEX.md

---

## Migration Checklist

### Pre-Flight Checks

- [ ] Commit all current work (clean working directory)
- [ ] Create new branch: `git checkout -b docs/refactor-to-playbook`
- [ ] Back up current docs/ folder externally (just in case)

### During Refactoring

- [ ] Work phase by phase (Phase 1 → Phase 6)
- [ ] Commit after each major section within a phase
- [ ] Use descriptive commit messages (reference phase/task)
- [ ] Test links after each file move

### Post-Refactoring

- [ ] Run full validation suite:
  ```bash
  python scripts/validate_metadata_headers.py
  python scripts/validate_domain_docs_naming.py
  python scripts/validate_links.py
  ```
- [ ] Manual navigation test (click through INDEX.md links)
- [ ] Update docs/revision_log.csv with refactoring entry
- [ ] Create PR with comprehensive description
- [ ] Request review from Documentation Working Group

---

## Risk Assessment

### High Risk

1. **Broken internal links** after file moves
   - Mitigation: Link validation script, thorough testing
2. **Loss of git history** for moved files
   - Mitigation: Use `git mv` where possible, document renames
3. **Incomplete migration** leaving orphaned files
   - Mitigation: Systematic phase-by-phase approach, checklists

### Medium Risk

1. **Metadata inconsistency** across files
   - Mitigation: Validation scripts, clear examples
2. **Domain code conflicts** or ambiguity
   - Mitigation: Clear domain code registry in standards.md
3. **Over-engineering** the domain structure
   - Mitigation: Start simple, expand as needed

### Low Risk

1. **CI/CD hook false positives**
   - Mitigation: Test hooks thoroughly before enabling
2. **Developer confusion** during transition
   - Mitigation: Clear communication, updated README, INDEX.md

---

## Success Criteria

✅ All markdown files in docs/ have required metadata headers
✅ All domains have overview documents with domain_code
✅ All internal links resolve correctly
✅ Pre-push validation hooks pass
✅ docs/todo.md exists and is referenced in standards
✅ docs/agents.md mirrors CLAUDE.md
✅ docs/architecture.md and architecture/roadmap.md exist
✅ Documentation structure matches playbook recommendations
✅ No files exist outside /docs (except approved exceptions)
✅ INDEX.md provides clear navigation to all sections

---

## Timeline

| Phase | Estimated Time | Priority |
|-------|---------------|----------|
| Phase 1: Foundation | 1-1.5 hours | P1 |
| Phase 2: Add Metadata | 1 hour | P1 |
| Phase 3: Reorganize | 1 hour | P2 |
| Phase 4: Domain Docs | 2-3 hours | P3 |
| Phase 5: Validation | 1 hour | P2 |
| Phase 6: Cleanup | 30 min | P3 |
| **Total** | **6.5-8 hours** | |

**Recommended approach:** Execute P1+P2 first (core compliance), then P3+P5 (structure + validation), then P4+P6 (enhancement).

---

## Next Actions

1. **Review this plan** with stakeholders/maintainers
2. **Prioritize phases** based on immediate needs
3. **Execute Phase 1** (Foundation) to establish core structure
4. **Execute Phase 2** (Metadata) to achieve basic compliance
5. **Execute remaining phases** iteratively

---

## Appendix A: File Mapping

Complete mapping of current → target locations:

| Current Location | Target Location | Action | Notes |
|------------------|-----------------|--------|-------|
| `docs/INDEX.md` | `docs/INDEX.md` | UPDATE | Add metadata, update structure |
| `docs/deployment.md` | `docs/reference/deployment.md` | MOVE | Add metadata |
| `docs/development-guide.md` | `docs/reference/development-guide.md` | MOVE | Add metadata |
| `docs/implementation-notes.md` | `docs/reference/implementation-notes.md` | MOVE | Add metadata |
| `docs/ui-overview.md` | `docs/domains/ui/ui-overview-legacy.md` | MOVE+RENAME | Add metadata, domain code |
| `docs/frontend-backend-reconciliation.md` | `docs/reference/frontend-backend-reconciliation.md` | MOVE | Add metadata |
| `docs/MCP_FRAMEWORK_ANALYSIS.md` | `docs/architecture/adr-0001-mcp-framework.md` | TRANSFORM | Convert to ADR format |
| `docs/PRE-INTEGRATION-CHECKLIST.md` | `docs/reference/pre-integration-checklist.md` | MOVE+RENAME | Add metadata |
| `docs/UI_INTEGRATION_ROADMAP.md` | `docs/plans/ui-integration-roadmap.md` | MOVE+RENAME | Add metadata |
| `docs/INTEGRATION_EXECUTION_PLAN.md` | `docs/plans/integration-execution-plan.md` | MOVE+RENAME | Add metadata |
| `docs/REORGANIZATION.md` | `docs/research/historical/reorganization.md` | MOVE+RENAME | Add metadata |
| `docs/gemini/*.md` (7 files) | `docs/research/gemini/*.md` | MOVE+RENAME | Kebab-case names, metadata |
| `docs/merge/*.md` (2 files) | `docs/research/historical/merge/*.md` | MOVE+RENAME | Kebab-case names, metadata |
| `docs/plans/ATOMIC_INTEGRATION_PLAN.md` | `docs/plans/atomic-integration-plan.md` | RENAME | Add metadata |
| `docs/ui/*.md` (6 files) | `docs/domains/ui/ui-*.md` | MOVE+RENAME | Domain code prefix, metadata |

---

## Appendix B: Metadata Templates

### Index Document Template

```yaml
---
doc_type: index
subsystem: general
version: 1.0.0
status: approved
owners: Documentation Team
last_reviewed: 2025-11-10
---
```

### Domain Overview Template

```yaml
---
doc_type: reference
subsystem: <domain-name>
domain_code: <code>
version: 1.0.0
status: draft
owners: <Domain Team>
last_reviewed: 2025-11-10
---
```

### Research Document Template

```yaml
---
doc_type: research
subsystem: general
version: 0.1.0
status: draft
owners: Research Team
last_reviewed: 2025-11-10
---
```

### Plan Document Template

```yaml
---
doc_type: plan
subsystem: <domain-name>
version: 1.0.0
status: draft
owners: Planning Team
last_reviewed: 2025-11-10
---
```

---

## Appendix C: Domain Code Registry

| Domain | Code | Description |
|--------|------|-------------|
| api | `api` | REST API, routes, sessions |
| websocket | `ws` | WebSocket functionality, real-time |
| auth | `auth` | Authentication and security |
| jules-integration | `ji` | Jules API client wrapper |
| persistence | `per` | Storage and notifications |
| ui | `ui` | UI integration |

---

**End of Refactoring Plan**
