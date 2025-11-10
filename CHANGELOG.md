# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Master Documentation Playbook for standardized documentation
- Comprehensive architecture documentation
- Project roadmap with future phases
- AI assistant guidance (agents.md)
- Task tracking system (todo.md)
- Documentation revision log

### Changed
- Documentation structure refactored per playbook standards
- All markdown files now include required metadata headers

## [0.1.0] - 2025-11-09

### Added
- UI integration documentation
  - Integration execution plan (23 steps)
  - UI integration roadmap
  - Frontend-backend reconciliation guide
  - Pre-integration checklist
  - Complete UI architecture documentation
- Framework analysis documentation
  - MCP framework selection (FastMCP 2.0)
  - Architecture diagrams
  - Strategy comparison
  - Executive brief

### Changed
- Documentation reorganization
  - Created docs/INDEX.md as navigation hub
  - Consolidated overlapping documentation
  - Improved logical grouping
  - Reduced duplication

## [0.0.1] - 2025-10-19

### Added
- Initial backend implementation
  - Express server with TypeScript ESM
  - REST API with Zod validation
  - WebSocket delta broadcasting
  - Dual authentication (REST + WebSocket)
  - Security hardening (IP allowlist, rate limiting)
  - Jules API client with retry logic
  - Optional SQLite persistence
  - Optional webhook notifications
  - Comprehensive test suite (Vitest)
  - Structured logging (Pino)
  - Health probes
  - Docker containerization

### Documentation
- Development guide
- Deployment guide
- Implementation notes
- Testing documentation
- Type system documentation

---

## Release Notes Format

### User-Visible Changes
Per the [Documentation Standards](docs/standards.md), changelog entries should follow this rubric:

**Include in changelog:**
- New features visible to users
- Breaking changes
- API changes
- Security fixes
- Performance improvements
- Bug fixes affecting functionality

**Exclude from changelog:**
- Internal refactoring (unless performance impact)
- Documentation updates (unless user-facing docs)
- Test improvements
- Build system changes
- Dependency updates (unless security-related)

---

[Unreleased]: https://github.com/yourusername/jules-control-room/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/jules-control-room/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/yourusername/jules-control-room/releases/tag/v0.0.1
