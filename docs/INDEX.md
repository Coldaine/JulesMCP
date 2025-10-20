# Documentation Index

Complete documentation for the Jules Control Room Backend project.

## Quick Start

- **[README](../README.md)** - Project overview and quick start guide

## Core Documentation

### Development

- **[Development Guide](./development-guide.md)** - Complete development workflow, architecture, and commands
- **[Code Quality & Linting](./linting.md)** - Automated linting, ESLint rules, and best practices
- **[API Examples](./api-examples.md)** - REST and WebSocket API usage examples
- **[Deployment Guide](./deployment.md)** - Production deployment, Docker, security, and monitoring

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
├── deployment.md                   # Production deployment
├── linting.md                      # Code quality guide
├── api-examples.md                 # API usage examples
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
│   ├── MCPResearch.md             # MCP research
│   └── mergeAnalysis.md           # Merge analysis
└── reviews/
    └── test-coverage-improvements.md  # Test improvements
```

---

## For Developers

### New to the Project?

1. Start with **[README](../README.md)** for project overview
2. Read **[Development Guide](./development-guide.md)** for architecture and commands
3. Check **[Code Quality](./linting.md)** for code standards
4. Try **[API Examples](./api-examples.md)** to test the API

### Setting Up Development Environment?

1. **[Development Guide](./development-guide.md)** - Setup instructions
2. **[Linting](./linting.md)** - Configure auto-fix on save
3. **[API Examples](./api-examples.md)** - Test your setup

### Deploying to Production?

1. **[Deployment Guide](./deployment.md)** - Complete deployment checklist
2. **[Development Guide](./development-guide.md#environment-variables)** - Environment configuration

---

## For AI Assistants

### Working on this Codebase?

1. **[Claude Instructions](./claude-instructions.md)** - Comprehensive project context
2. **[Development Guide](./development-guide.md)** - Architecture and patterns
3. **[Implementation Notes](./implementation-notes.md)** - Design decisions

### Making Code Changes?

- Auto-fix runs on save and commit (see [Linting](./linting.md))
- Run `npm run lint:fix` after generating code
- All tests must pass: `npm run test`
- Type checking must pass: `npm run typecheck`

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
- Use clear headings and examples
- Link between related documents

---

## Need Help?

- Check the relevant guide in this index
- Review [API Examples](./api-examples.md) for usage patterns
- See [Development Guide](./development-guide.md) for troubleshooting
- Review [Codebase Survey](./plan/codebase-survey.md) for known issues
