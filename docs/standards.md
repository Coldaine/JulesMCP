---
doc_type: standard
subsystem: general
version: 1.0.0
status: approved
owners: Documentation Working Group
last_reviewed: 2025-11-10
---

# Documentation Standards

This document defines the documentation standards for the Jules Control Room Backend repository. All documentation MUST adhere to the [Master Documentation Playbook](playbooks/organizational/documentation_playbook.md).

## Quick Reference

**For AI Agents:** See [agents.md](agents.md) for assistant-specific guidance.
**For Contributors:** All docs must include metadata headers and follow structure below.
**For Reviewers:** Use validation scripts (when implemented) to check compliance.

## Required Metadata Header

Every Markdown file under `/docs` MUST begin with this YAML front matter:

```yaml
---
doc_type: [architecture|standard|playbook|reference|research|plan|troubleshooting|index]
subsystem: [domain-name|general]
version: [semver, e.g., 1.2.3]
status: [draft|review|approved|deprecated]
owners: [team or individual]
last_reviewed: [YYYY-MM-DD]
---
```

### Field Descriptions

| Field | Required | Format | Description |
|-------|----------|--------|-------------|
| `doc_type` | Yes | Enum | Type of document (see types below) |
| `subsystem` | Yes | String | Domain or "general" |
| `version` | Yes | Semver | Document version (e.g., 1.0.0) |
| `status` | Yes | Enum | Review status (draft/review/approved/deprecated) |
| `owners` | Yes | String | Team or individual responsible |
| `last_reviewed` | Yes | Date | ISO 8601 date (YYYY-MM-DD) |

### Document Types (`doc_type`)

- **architecture**: System design, high-level overviews, ADRs
- **standard**: Standards, conventions, schemas (like this doc)
- **playbook**: Process documentation, runbooks
- **reference**: API docs, guides, how-tos
- **research**: Investigation logs, analysis, experimental docs
- **plan**: Project plans, roadmaps, execution plans
- **troubleshooting**: Problem diagnosis and solutions
- **index**: Navigation pages linking to other docs

### Subsystem Values

For domain-specific docs, use the domain name:
- `api` - REST API domain
- `ws` - WebSocket domain
- `auth` - Authentication domain
- `ji` - Jules Integration domain
- `per` - Persistence domain
- `ui` - UI domain

For general docs, use `general`.

### Status Values

- **draft**: Work in progress, not ready for review
- **review**: Ready for peer review
- **approved**: Reviewed and accepted
- **deprecated**: Superseded or no longer relevant

## File Naming Conventions

### General Rules
1. Use **kebab-case** for all filenames: `my-document-name.md`
2. Use `.md` extension for Markdown files
3. Keep names descriptive but concise (2-5 words)

### Domain Files

Files in `docs/domains/<domain>/` MUST include the domain code as a prefix:

**Format:** `<domain-code>-<topic>.md`

**Examples:**
- `api-overview.md` (API domain overview)
- `api-routes.md` (API routes documentation)
- `ws-delta-broadcasting.md` (WebSocket delta mechanism)
- `auth-security.md` (Auth security patterns)

### Domain Codes

| Domain | Code | Example |
|--------|------|---------|
| API | `api` | `api-routes.md` |
| WebSocket | `ws` | `ws-heartbeat.md` |
| Auth | `auth` | `auth-overview.md` |
| Jules Integration | `ji` | `ji-retry-logic.md` |
| Persistence | `per` | `per-sqlite.md` |
| UI | `ui` | `ui-architecture.md` |

## Directory Structure

See [Master Documentation Playbook](playbooks/organizational/documentation_playbook.md) for canonical structure.

**Key directories:**

- `/docs/architecture/` - ADRs, system design
- `/docs/domains/` - Domain-specific technical docs
- `/docs/plans/` - One-off plans, active work
- `/docs/reference/` - Guides, API docs, how-tos
- `/docs/research/` - Investigation logs, experimental docs
- `/docs/playbooks/organizational/` - Process documentation
- `/docs/tasks/` - Task breakdowns, specs

## Changelog Rubric

When determining if a change should be documented in `CHANGELOG.md`, follow this rubric:

### Include in Changelog

✅ **User-Visible Changes:**
- New features (API endpoints, WebSocket events)
- Breaking changes (API contract changes, removed features)
- Security fixes
- Performance improvements (>10% improvement)
- Bug fixes affecting functionality
- Dependency upgrades (if security-related)

✅ **Configuration Changes:**
- New environment variables
- Changed default values
- Deployment requirement changes

### Exclude from Changelog

❌ **Internal Changes:**
- Code refactoring (unless performance impact)
- Internal architecture changes
- Test improvements
- Build system changes
- Non-security dependency updates
- Documentation updates (unless user-facing guides)
- Linting/formatting changes

## Task Tracking Requirements

**Critical:** `docs/todo.md` is the SINGLE source of truth for tasks.

### Requirements

1. **All actionable tasks** MUST be recorded in `docs/todo.md`
2. **Supporting materials** (breakdowns, specs) MUST be in `docs/tasks/` AND linked from `todo.md`
3. **PR checklist** MUST include confirmation that `todo.md` was updated
4. **AI assistants** MUST update `todo.md` when adding/completing/modifying tasks

### Task Format

```markdown
## Current Sprint

### Feature: Authentication System
- [ ] Implement IP allowlist (backend/src/security.ts)
- [ ] Add rate limiting middleware
- [ ] Write integration tests
- [ ] Update documentation

Supporting docs: [docs/tasks/auth-implementation.md](tasks/auth-implementation.md)
```

## Approved Exceptions (non-/docs)

The following files MAY exist outside `/docs`:

1. **Root README.md** - Project overview and quick start
2. **Root CHANGELOG.md** - Release notes
3. **Root CLAUDE.md** - AI assistant guidance (mirrors docs/agents.md)
4. **.vscode/** - Editor settings
5. **.gitignore** - Git ignore rules

Any additional exceptions require Documentation Working Group approval.

## Lifecycle & Retention

### Ephemeral Documentation

#### PR Reports
- **Location**: `docs/research/pr-reports/PR-<number>-<slug>.md`
- **Retention**: Delete within 14 days after merge unless promoted
- **Promotion**: Extract insights to playbooks or domain docs

#### Investigation Logs
- **Location**: `docs/research/logs/<YYYY-MM-DD>-<topic>.md`
- **Retention**: 30 days unless promoted to standards/playbooks

#### One-off Plans
- **Location**: `docs/plans/<topic>.md`
- **After completion**: Fold outcomes into architecture/domain docs OR move to `docs/research/plans/`

### Persistent Documentation

All docs in `/docs/architecture/`, `/docs/domains/`, `/docs/reference/`, and `/docs/playbooks/` are considered persistent and should NOT be deleted without review.

## Validation

### Pre-Push Hooks (To Be Implemented)

Validation scripts MUST check:
1. All markdown files in `/docs` have required metadata headers
2. All domain files include declared domain code in filename
3. No markdown files exist outside `/docs` (except approved exceptions)
4. Internal links resolve correctly

### CI Validation (To Be Implemented)

GitHub Actions MUST:
1. Run metadata validation on PR
2. Run domain naming validation on PR
3. Lint Mermaid diagrams (syntax only)
4. Validate internal links

## Markdown Style Guide

### Headers

```markdown
# H1 - Document Title (once per file)
## H2 - Major Section
### H3 - Subsection
#### H4 - Minor Subsection (avoid deeper nesting)
```

### Code Blocks

Use fenced code blocks with language specifiers:

```markdown
\```typescript
const example: string = "hello";
\```
```

### Links

- **Internal links**: Use relative paths: `[Architecture](architecture.md)`
- **External links**: Use full URLs: `[Jules API](https://api.jules.ai/v1/docs)`
- **Code references**: Include line numbers when relevant: `backend/src/server.ts:42`

### Tables

Use pipes for alignment:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
```

### Lists

- **Unordered**: Use `-` for bullets
- **Ordered**: Use `1.`, `2.`, etc.
- **Nested**: Indent 2 spaces

### Emphasis

- **Bold**: `**important**`
- *Italic*: `*emphasis*`
- `Code`: Use backticks for inline code

## Repository-Specific Overrides

### JavaScript/TypeScript (Not Rust)

This repository uses JavaScript/TypeScript with Node.js, NOT Rust:

- **No `crates/` directory** - Use `backend/` and `shared/` instead
- **No Cargo** - Use `npm` and `package.json`
- **Module references** - Reference TypeScript modules, not Rust crates

### Personal Tool Scope

This is a **personal, single-user tool**:

- **No multi-user documentation** - Skip enterprise auth, scaling, etc.
- **Localhost-first** - Deployment docs focus on local/home server
- **Simple and pragmatic** - Avoid over-engineering in docs and code

## Related Documentation

- **[Master Documentation Playbook](playbooks/organizational/documentation_playbook.md)** - Canonical documentation rules
- **[Architecture](architecture.md)** - System architecture overview
- **[TODO](todo.md)** - Task tracking source of truth
- **[Agents Guide](agents.md)** - AI assistant-specific guidance

## Questions?

For documentation questions or exceptions:
1. Review the [Master Documentation Playbook](playbooks/organizational/documentation_playbook.md)
2. Check existing docs for examples
3. Propose exceptions via PR with clear rationale

---

**Last Updated:** 2025-11-10
**Maintained by:** Documentation Working Group
