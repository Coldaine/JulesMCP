# Documentation Index

Complete documentation for the Jules Control Room Backend - a **personal, single-user tool** for managing Jules AI coding sessions.

> **🏠 Personal Tool:** This project is designed for individual developers, not teams or enterprise deployment. Documentation reflects this scope.

## Quick Start

- **[README](../README.md)** - Project overview and quick start guide

## Core Documentation

### Development

- **[Development Guide](./development-guide.md)** - Complete development workflow, architecture, and commands
- **[Code Quality & Linting](./linting.md)** - Automated linting, ESLint rules, and best practices
- **[Personal Deployment](./deployment.md)** - Running on your local machine or home server
- **[Scope Update](./SCOPE_UPDATE.md)** - Boundaries that keep this as a solo tool

### Quick References

- **[Linting Quick Reference](./linting-quick-reference.md)** - Quick commands for linting
- **[Linting Detailed](./linting-detailed.md)** - Comprehensive linting setup and troubleshooting

### Implementation Details

- **[Implementation Notes](./implementation-notes.md)** - Backend highlights and extensibility
- **[Claude Instructions](./claude-instructions.md)** - AI assistant guidance for this codebase

### UI Documentation

- **[UI Overview](./ui-overview.md)** - Detailed overview of the Control Room UI (future frontend)

## Historical Documentation

### Planning & Analysis

- **[Codebase Survey](./plan/codebase-survey.md)** - Repository state and improvement opportunities
- **[Merge Plan](./merge/mergeplanOne.md)** - Merge strategy and planning
- **[Functionality Loss Analysis](./merge/functionalityLoss.md)** - Analysis of feature changes

### Research

- **[Executive Brief](./gemini/EXECUTIVE_BRIEF.md)** - Quick framework decision summary (start here!)
- **[Architecture Diagrams](./gemini/ARCHITECTURE_DIAGRAMS.md)** - Visual comparison of framework architectures
- **[Strategy Comparison](./gemini/STRATEGY_COMPARISON.md)** - EasyMCP vs FastMCP 2.0 quick reference
- **[Strategic Update](./gemini/strategicUpdate.md)** - FastMCP 2.0 framework analysis and revised strategy
- **[MCP Research](./gemini/MCPResearch.md)** - Model Context Protocol research
- **[Merge Analysis](./gemini/mergeAnalysis.md)** - Technical merge analysis

### Reviews

- **[Test Coverage Improvements](./reviews/test-coverage-improvements.md)** - Test suite enhancement recommendations

---

## Documentation Structure

```
docs/
├── INDEX.md                        # This file
├── development-guide.md            # Primary development docs
├── deployment.md                   # Personal deployment
├── linting.md                      # Code quality guide
├── linting-quick-reference.md      # Quick lint commands
├── linting-detailed.md             # Detailed lint setup
├── implementation-notes.md         # Backend implementation
├── claude-instructions.md          # AI assistant guide
├── ui-overview.md                  # UI documentation
├── plan/
│   └── codebase-survey.md         # Codebase analysis
├── merge/
│   ├── mergeplanOne.md            # Merge strategy
│   └── functionalityLoss.md      # Feature analysis
├── gemini/
│   ├── README.md                  # This directory guide
│   ├── EXECUTIVE_BRIEF.md         # Quick framework decision
│   ├── ARCHITECTURE_DIAGRAMS.md   # Visual comparisons
│   ├── STRATEGY_COMPARISON.md     # Framework comparison
│   ├── strategicUpdate.md         # FastMCP 2.0 strategy update
│   ├── MCPResearch.md             # MCP research
│   └── mergeAnalysis.md           # Merge analysis
└── reviews/
    └── test-coverage-improvements.md  # Test improvements
```

---

## For Personal Use

### Setting Up for the First Time?

1. Start with **[README](../README.md)** - Understand it's a personal tool
2. Read **[Development Guide](./development-guide.md)** - Architecture and setup
3. Check **[Code Quality](./linting.md)** - Auto-fix configuration
4. Run the test suite (`npm run test`) to see end-to-end flows in action

### Want to Run It Persistently?

1. **[Personal Deployment](./deployment.md)** - Docker or always-on options
2. **[Development Guide](./development-guide.md#environment-variables)** - Environment configuration

---

## For AI Assistants

**⚠️ Important Context:** This is a **personal, single-user tool**. Avoid:

- Multi-user/multi-tenant features
- Enterprise deployment patterns
- Complex scaling solutions
- Over-engineering

### Working on this Codebase?

1. **[Claude Instructions](./claude-instructions.md)** - Project context and scope
2. **[Development Guide](./development-guide.md)** - Architecture (kept simple)
3. **[Implementation Notes](./implementation-notes.md)** - Design decisions

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
- See [Development Guide](./development-guide.md) for troubleshooting
- Review [Codebase Survey](./plan/codebase-survey.md) for known issues
