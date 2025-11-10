---
doc_type: index
subsystem: general
version: 1.0.0
status: approved
owners: Documentation Team
last_reviewed: 2025-11-10
---

# Documentation Index

Complete documentation for the Jules Control Room Backend - a **personal, single-user tool** for managing Jules AI coding sessions.

> **🏠 Personal Tool:** This project is designed for individual developers, not teams or enterprise deployment. Documentation reflects this scope.

## Quick Start

- **[README](../README.md)** - Project overview and quick start guide

## Core Documentation

### Development

- **[Development Guide](./reference/development-guide.md)** - Complete development workflow, architecture, and commands
- **[Code Quality & Linting](./linting.md)** - Automated linting, ESLint rules, and best practices
- **[Personal Deployment](./reference/deployment.md)** - Running on your local machine or home server
- **[Scope Update](./SCOPE_UPDATE.md)** - Boundaries that keep this as a solo tool

### Quick References

- **[Linting Quick Reference](./linting-quick-reference.md)** - Quick commands for linting
- **[Linting Detailed](./linting-detailed.md)** - Comprehensive linting setup and troubleshooting

### Implementation Details

- **[MCP Framework Analysis](./MCP_FRAMEWORK_ANALYSIS.md)** - Strategic framework selection summary
- **[Implementation Notes](./reference/implementation-notes.md)** - Backend highlights and extensibility
- **[Claude Instructions](./claude-instructions.md)** - AI assistant guidance for this codebase

### UI Integration Documentation

> **🎨 UI Integration:** Complete documentation for integrating the Jules Control Room UI with the backend.

- **[UI Integration Roadmap](./plans/ui-integration-roadmap.md)** - Strategic phases and timelines
- **[Integration Execution Plan](./plans/integration-execution-plan.md)** - 23-step detailed execution guide (START HERE for integration)
- **[Frontend-Backend Reconciliation](./reference/frontend-backend-reconciliation.md)** - Type gaps and Day 1 plan
- **[UI Documentation Folder](./domains/ui/)** - Comprehensive UI architecture and integration guides

### UI Quick Links

For detailed UI documentation, see the **[UI Documentation Folder](./domains/ui/README.md)** which includes:

- **[UI Architecture](./domains/ui/ui-architecture.md)** - System architecture, data flow, component hierarchy
- **[Integration Guide](./domains/ui/ui-integration-guide.md)** - Step-by-step API integration instructions
- **[Backend Brief](./domains/ui/ui-backend-brief.md)** - Executive summary for backend teams
- **[Implementation Phases](./domains/ui/ui-implementation-phases.md)** - Phased implementation plan
- **[Jules API Audit](./domains/ui/ui-jules-api-audit.md)** - Feature compatibility matrix

**Legacy UI Overview:**
- **[UI Overview](./domains/ui/ui-overview-legacy.md)** - Original UI overview (see docs/domains/ui/ for complete documentation)

## Historical Documentation

### Planning & Analysis

- **[Codebase Survey](./plan/codebase-survey.md)** - Repository state and improvement opportunities
- **[Merge Plan](./research/historical/merge/merge-plan-one.md)** - Merge strategy and planning
- **[Functionality Loss Analysis](./research/historical/merge/functionality-loss.md)** - Analysis of feature changes

### Research

- **[Executive Brief](./research/gemini/executive-brief.md)** - Quick framework decision summary (start here!)
- **[Architecture Diagrams](./research/gemini/architecture-diagrams.md)** - Visual comparison of framework architectures
- **[Strategy Comparison](./research/gemini/strategy-comparison.md)** - EasyMCP vs FastMCP 2.0 quick reference
- **[Strategic Update](./research/gemini/strategic-update.md)** - FastMCP 2.0 framework analysis and revised strategy
- **[MCP Research](./research/gemini/mcp-research.md)** - Model Context Protocol research
- **[Merge Analysis](./research/gemini/merge-analysis.md)** - Technical merge analysis

### Reviews

- **[Test Coverage Improvements](./reviews/test-coverage-improvements.md)** - Test suite enhancement recommendations

---

## Documentation Structure

```
docs/
├── INDEX.md                            # This file
├── Core Documentation
│   ├── reference/
│   │   ├── development-guide.md        # Primary development docs
│   │   ├── deployment.md               # Personal deployment
│   │   ├── implementation-notes.md     # Backend implementation
│   │   ├── frontend-backend-reconciliation.md  # Type reconciliation
│   │   └── pre-integration-checklist.md # Pre-integration checks
│   ├── linting.md                      # Code quality guide
│   └── MCP_FRAMEWORK_ANALYSIS.md       # Framework selection
│
├── UI Integration Documentation
│   ├── plans/
│   │   ├── ui-integration-roadmap.md   # Strategic roadmap
│   │   ├── integration-execution-plan.md # 23-step execution plan
│   │   └── atomic-integration-plan.md  # Atomic integration steps
│   └── domains/ui/                     # Complete UI documentation
│       ├── README.md                   # UI docs index
│       ├── ui-architecture.md          # System architecture
│       ├── ui-integration-guide.md     # Integration instructions
│       ├── ui-backend-brief.md         # Backend team brief
│       ├── ui-implementation-phases.md # Phased implementation
│       ├── ui-jules-api-audit.md       # API compatibility
│       ├── ui-overview-legacy.md       # Legacy UI overview
│       └── ui-readme-original.md       # Original UI README
│
├── Quick References
│   ├── linting-quick-reference.md      # Quick lint commands
│   ├── linting-detailed.md             # Detailed lint setup
│   └── claude-instructions.md          # AI assistant guide
│
└── Historical/Planning
    ├── plan/
    │   └── codebase-survey.md          # Codebase analysis
    ├── research/
    │   ├── gemini/
    │   │   ├── executive-brief.md      # Framework decision summary
    │   │   ├── architecture-diagrams.md # Visual comparisons
    │   │   ├── strategy-comparison.md  # Strategy reference
    │   │   ├── strategic-update.md     # Framework analysis
    │   │   ├── mcp-research.md         # MCP research
    │   │   └── merge-analysis.md       # Technical merge analysis
    │   └── historical/
    │       ├── reorganization.md       # Reorganization history
    │       └── merge/
    │           ├── merge-plan-one.md   # Merge strategy
    │           └── functionality-loss.md # Feature analysis
    └── reviews/
        └── test-coverage-improvements.md
```

---

## For Personal Use

### Setting Up for the First Time?

1. Start with **[README](../README.md)** - Understand it's a personal tool
2. Read **[Development Guide](./reference/development-guide.md)** - Architecture and setup
3. Check **[Code Quality](./linting.md)** - Auto-fix configuration
4. Run the test suite (`npm run test`) to see end-to-end flows in action

### Want to Integrate the UI?

1. **[Integration Execution Plan](./plans/integration-execution-plan.md)** - Complete 23-step guide (START HERE)
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

1. **[Claude Instructions](./claude-instructions.md)** - Project context and scope
2. **[Development Guide](./reference/development-guide.md)** - Architecture (kept simple)
3. **[Implementation Notes](./reference/implementation-notes.md)** - Design decisions

### Integrating the UI?

1. **[Integration Execution Plan](./plans/integration-execution-plan.md)** - Detailed step-by-step guide
2. **[UI Documentation Folder](./domains/ui/)** - Complete UI architecture reference
3. **[Backend Brief](./domains/ui/ui-backend-brief.md)** - What backend teams need to know

### Making Code Changes?

- Keep solutions simple and pragmatic
- Auto-fix runs on save and commit (see [Linting](./linting.md))
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
- For **UI integration**: Start with [Integration Execution Plan](./plans/integration-execution-plan.md)
- For **backend development**: See [Development Guide](./reference/development-guide.md)
- For **troubleshooting**: Review [Codebase Survey](./plan/codebase-survey.md) for known issues

---

**Last Updated:** 2025-11-10
