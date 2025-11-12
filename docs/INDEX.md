---
doc_type: index
subsystem: general
version: 2.0.0
status: approved
owners: Documentation Team
last_reviewed: 2025-11-11
---

# Documentation Index

Complete documentation for the Jules Control Room Backend - a **personal, single-user tool** for managing Jules AI coding sessions.

> **🏠 Personal Tool:** This project is designed for individual developers, not teams or enterprise deployment. Documentation reflects this scope.

## Quick Start

- **[README](../README.md)** - Project overview and quick start guide

## Core Documentation

### Development

- **[Development Guide](./reference/development-guide.md)** - Complete development workflow, architecture, and commands
- **[Personal Deployment](./reference/deployment.md)** - Running on your local machine or home server
- **[Architecture Overview](./architecture.md)** - High-level system architecture
- **[Architecture Roadmap](./architecture/roadmap.md)** - Project roadmap and milestones

### Reference Documentation

- **[Implementation Notes](./reference/implementation-notes.md)** - Backend highlights and extensibility
- **[Standards](./standards.md)** - Documentation and coding standards
- **[Agents Guide](./agents.md)** - AI assistant guidance for this codebase
- **[TODO](./todo.md)** - Current tasks and project tracking

### UI Integration Documentation

> **🎨 UI Integration:** Complete documentation for integrating the Jules Control Room UI with the backend.

- **[UI Integration Roadmap](./plans/ui-integration-roadmap.md)** - Strategic phases and timelines
- **[Integration Execution Plan](./plans/integration-execution.md)** - 23-step detailed execution guide (START HERE for integration)
- **[Atomic Integration Plan](./plans/atomic-integration.md)** - Incremental integration steps
- **[Frontend-Backend Reconciliation](./reference/frontend-backend-reconciliation.md)** - Type gaps and Day 1 plan
- **[Pre-Integration Checklist](./reference/pre-integration-checklist.md)** - Prerequisites verification

### UI Domain Documentation

For detailed UI documentation, see the **[UI Domain Folder](./domains/ui/README.md)** which includes:

- **[UI Overview](./domains/ui/ui-overview.md)** - Complete UI overview and purpose
- **[UI Architecture](./domains/ui/ui-architecture.md)** - System architecture, data flow, component hierarchy
- **[Integration Guide](./domains/ui/ui-integration-guide.md)** - Step-by-step API integration instructions
- **[Backend Brief](./domains/ui/ui-backend-brief.md)** - Executive summary for backend teams
- **[Implementation Phases](./domains/ui/ui-implementation-phases.md)** - Phased implementation plan
- **[Jules API Audit](./domains/ui/ui-jules-api-audit.md)** - Feature compatibility matrix

## Architecture Documentation

### Architecture Decision Records (ADRs)

- **[ADR-0001: MCP Framework](./architecture/adr-0001-mcp-framework.md)** - Strategic framework selection analysis

## Planning Documentation

- **[Documentation Refactoring Plan](./plans/documentation-refactoring.md)** - Documentation reorganization plan

## Research Documentation

### MCP Framework Research

- **[Executive Brief](./research/gemini/executive-brief.md)** - Quick framework decision summary (start here!)
- **[Architecture Diagrams](./research/gemini/architecture-diagrams.md)** - Visual comparison of framework architectures
- **[Strategy Comparison](./research/gemini/strategy-comparison.md)** - EasyMCP vs FastMCP 2.0 quick reference
- **[Strategic Update](./research/gemini/strategic-update.md)** - FastMCP 2.0 framework analysis and revised strategy
- **[MCP Research](./research/gemini/mcp-research.md)** - Model Context Protocol research
- **[Merge Analysis](./research/gemini/merge-analysis.md)** - Technical merge analysis

### Historical Documentation

- **[Reorganization](./research/historical/reorganization.md)** - Documentation reorganization history
- **[Merge Plan](./research/historical/merge/merge-plan-one.md)** - Merge strategy and planning
- **[Functionality Loss Analysis](./research/historical/merge/functionality-loss.md)** - Analysis of feature changes

---

## Documentation Structure

```
docs/
├── INDEX.md                            # This file
├── architecture.md                     # High-level system architecture
├── standards.md                        # Documentation and coding standards
├── agents.md                           # AI assistant guidance
├── todo.md                             # Current tasks and tracking
├── revision_log.csv                    # File change log
│
├── architecture/                       # Architecture documentation
│   ├── roadmap.md                      # Project roadmap
│   └── adr-0001-mcp-framework.md       # MCP framework ADR
│
├── domains/                            # Domain-specific documentation
│   ├── api/                            # REST API domain (future)
│   ├── websocket/                      # WebSocket domain (future)
│   ├── auth/                           # Authentication domain (future)
│   ├── jules-integration/              # Jules API integration (future)
│   ├── persistence/                    # Data persistence domain (future)
│   └── ui/                             # UI integration domain
│       ├── README.md                   # UI docs index
│       ├── ui-overview.md              # UI overview
│       ├── ui-architecture.md          # UI architecture
│       ├── ui-integration-guide.md     # Integration guide
│       ├── ui-backend-brief.md         # Backend team brief
│       ├── ui-implementation-phases.md # Implementation phases
│       └── ui-jules-api-audit.md       # API audit
│
├── plans/                              # Planning documentation
│   ├── ui-integration-roadmap.md       # UI integration roadmap
│   ├── integration-execution.md        # Integration execution plan
│   ├── atomic-integration.md           # Atomic integration plan
│   └── documentation-refactoring.md    # Docs refactoring plan
│
├── reference/                          # Reference documentation
│   ├── development-guide.md            # Development workflow
│   ├── deployment.md                   # Deployment guide
│   ├── implementation-notes.md         # Implementation notes
│   ├── frontend-backend-reconciliation.md  # Type reconciliation
│   └── pre-integration-checklist.md    # Pre-integration checks
│
├── research/                           # Research documentation
│   ├── gemini/                         # MCP framework research
│   │   ├── README.md
│   │   ├── executive-brief.md
│   │   ├── architecture-diagrams.md
│   │   ├── strategy-comparison.md
│   │   ├── strategic-update.md
│   │   ├── mcp-research.md
│   │   └── merge-analysis.md
│   ├── historical/                     # Historical documentation
│   │   ├── reorganization.md
│   │   └── merge/
│   │       ├── merge-plan-one.md
│   │       └── functionality-loss.md
│   ├── pr-reports/                     # PR reports (future)
│   ├── checkpoints/                    # Validation checkpoints (future)
│   └── logs/                           # Investigation logs (future)
│
├── playbooks/                          # Operational playbooks
│   └── organizational/
│       └── documentation_playbook.md   # Master documentation playbook
│
└── tasks/                              # Task breakdown materials (future)
```

---

## For Personal Use

### Setting Up for the First Time?

1. Start with **[README](../README.md)** - Understand it's a personal tool
2. Read **[Development Guide](./reference/development-guide.md)** - Architecture and setup
3. Check **[Architecture Overview](./architecture.md)** - System architecture
4. Run the test suite (`npm run test`) to see end-to-end flows in action

### Want to Integrate the UI?

1. **[Integration Execution Plan](./plans/integration-execution.md)** - Complete 23-step guide (START HERE)
2. **[UI Integration Roadmap](./plans/ui-integration-roadmap.md)** - Strategic overview
3. **[UI Documentation](./domains/ui/README.md)** - Detailed UI architecture and integration guides
4. **[Frontend-Backend Reconciliation](./reference/frontend-backend-reconciliation.md)** - Known gaps and solutions

### Want to Run It Persistently?

1. **[Personal Deployment](./reference/deployment.md)** - Docker or always-on options
2. **[Development Guide](./reference/development-guide.md#environment-variables)** - Environment configuration

---

## For AI Assistants

**⚠️ Important Context:** This is a **personal, single-user tool**. Avoid:

- Multi-user/multi-tenant features
- Enterprise deployment patterns
- Complex scaling solutions
- Over-engineering

### Working on this Codebase?

1. **[Agents Guide](./agents.md)** - Project context and scope
2. **[Development Guide](./reference/development-guide.md)** - Architecture (kept simple)
3. **[Implementation Notes](./reference/implementation-notes.md)** - Design decisions
4. **[Standards](./standards.md)** - Documentation and coding standards

### Integrating the UI?

1. **[Integration Execution Plan](./plans/integration-execution.md)** - Detailed step-by-step guide
2. **[UI Documentation Folder](./domains/ui/)** - Complete UI architecture reference
3. **[Backend Brief](./domains/ui/ui-backend-brief.md)** - What backend teams need to know

### Making Code Changes?

- Keep solutions simple and pragmatic
- Follow [Standards](./standards.md) for documentation and code
- Run `npm run lint:fix` after generating code
- All tests must pass: `npm run test`

---

## Contributing

### Code Quality Standards

All code must pass:

- ✅ Linting: `npm run lint`
- ✅ Type checking: `npm run typecheck`
- ✅ Tests: `npm run test`

Auto-fix is enabled for linting (see [Linting Guide](./linting.md)).

### Documentation Standards

- Keep README minimal (overview + quick start only)
- Detailed docs go in `/docs/`
- Use clear headings and concise explanations
- Link between related documents

---

## Need Help?

- Check the relevant guide in this index
- For **UI integration**: Start with [Integration Execution Plan](./plans/integration-execution.md)
- For **backend development**: See [Development Guide](./reference/development-guide.md)
- For **project tracking**: Check [TODO](./todo.md) for current tasks

---

**Last Updated:** 2025-11-11
