---
doc_type: architecture
subsystem: general
version: 1.0.0
status: approved
owners: Architecture Team
last_reviewed: 2025-11-10
---

# ADR-0001: MCP Framework Selection for Jules Control Room

**Date:** October 2025
**Status:** Accepted
**Deciders:** Architecture Team
**Related Documents:** [MCP_FRAMEWORK_ANALYSIS.md](../MCP_FRAMEWORK_ANALYSIS.md), [docs/research/gemini/](../research/gemini/)

## Context

The Jules Control Room project currently implements a custom Express-based backend for managing Jules AI coding sessions. The system requires:

- Real-time session management with WebSocket support
- Persistent session storage and recovery
- Enterprise-grade authentication (GitHub OAuth, Google SSO, etc.)
- Jules API integration with retry/backoff logic
- Low-latency bidirectional communication for session deltas
- Production-ready deployment with monitoring

The custom implementation has successfully validated the concept, but maintaining custom protocol handling, WebSocket management, and enterprise features adds significant development overhead. We evaluated adopting the Model Context Protocol (MCP) standard to leverage existing frameworks and reduce maintenance burden.

### Problem Statement

**Key challenges with current custom implementation:**
1. Custom WebSocket protocol requires ongoing maintenance
2. Session persistence is basic (optional SQLite with manual snapshots)
3. Enterprise authentication requires custom OAuth flows
4. Jules API retry logic is hand-implemented
5. Real-time broadcasting requires custom diffing and delta calculation
6. Deployment and monitoring infrastructure is custom-built

**Evaluation criteria:**
- **Production readiness:** Mature, tested in production environments
- **Enterprise features:** Built-in authentication, session persistence, monitoring
- **Developer experience:** Clear APIs, good documentation, active community
- **Migration effort:** Reasonable investment vs long-term maintenance savings
- **Performance:** Low-latency WebSocket support for real-time updates
- **Flexibility:** Ability to customize business logic and integrate with Jules API

### Framework Candidates Evaluated

1. **Official MCP SDK** (Anthropic)
   - ✅ Canonical implementation
   - ❌ Low-level, requires significant custom code
   - ❌ No built-in enterprise features
   - ❌ Higher development effort

2. **EasyMCP**
   - ✅ Express-like API, developer-friendly
   - ✅ Low initial migration effort
   - ⚠️ Still in beta (limited production deployments)
   - ❌ No built-in session persistence
   - ❌ No enterprise authentication support
   - ❌ Requires custom WebSocket extensions
   - ⏳ 9-13 weeks + ongoing maintenance

3. **FastMCP 2.0** (recommended)
   - ✅ Production-tested with enterprise deployments
   - ✅ Built-in Redis/database session persistence
   - ✅ Enterprise SSO (Google, GitHub, Azure, Auth0, WorkOS)
   - ✅ WebSocket extensions for bidirectional communication
   - ✅ Server composition and tool transformation pipelines
   - ✅ FastMCP Cloud deployment tooling
   - ✅ Comprehensive testing frameworks
   - ⚠️ Medium migration effort (framework-specific patterns)
   - ⏳ 11-15 weeks including production hardening

## Decision

**We will adopt FastMCP 2.0 as the MCP framework for Jules Control Room.**

### Rationale

1. **Production Readiness**
   - FastMCP 2.0 is battle-tested with enterprise deployments
   - Built-in features reduce custom code by 20-30%
   - Faster path to production (2-3 weeks vs 4-6 weeks for custom features)

2. **Enterprise Features**
   - Session persistence with Redis/database backends (eliminates custom SQLite snapshots)
   - GitHub/Google OAuth built-in (removes custom authentication code)
   - Monitoring hooks and observability tooling included

3. **WebSocket Support**
   - Native WebSocket extensions for real-time bidirectional communication
   - Handles heartbeat, backpressure, and connection management automatically
   - Reduces custom WebSocket protocol code

4. **Long-term Maintenance**
   - Active community with regular updates
   - Comprehensive documentation and examples
   - Lower maintenance burden compared to custom implementation or EasyMCP beta

5. **Migration Path**
   - Clear migration strategy from Express to FastMCP server composition
   - TypeScript client SDK for frontend integration
   - Incremental migration possible with feature flags

### Trade-offs Accepted

1. **Higher Initial Effort** - 11-15 weeks vs 9-13 weeks for EasyMCP
   - Offset by lower long-term maintenance (20-30% time savings)
   - Faster production deployment once migrated

2. **Framework-Specific Patterns** - Need to learn FastMCP patterns
   - Mitigated by comprehensive documentation and examples
   - Community support available

3. **Framework Lock-in** - Some coupling to FastMCP architecture
   - Mitigated by using standard MCP interfaces where possible
   - Abstract business logic from framework specifics
   - Migration path to Official SDK exists if needed

## Consequences

### Positive

1. **Reduced Maintenance Burden**
   - 20-30% developer time savings on protocol and infrastructure code
   - Built-in features eliminate custom authentication, persistence, monitoring
   - WebSocket management handled by framework

2. **Faster Feature Development**
   - Focus on Jules AI business logic, not protocol implementation
   - Server composition enables modular architecture
   - Tool transformation pipelines for data processing

3. **Production Confidence**
   - Enterprise-grade features out of the box
   - Battle-tested in production environments
   - Monitoring and observability built-in

4. **Better Frontend Integration**
   - TypeScript client SDK with type safety
   - Automatic reconnection and state recovery
   - Real-time WebSocket hooks for UI updates

### Negative

1. **Migration Effort**
   - 11-15 weeks for complete migration including hardening
   - Team needs to learn FastMCP patterns and idioms
   - Requires thorough testing at each phase

2. **Framework Dependency**
   - Some coupling to FastMCP architecture
   - Risk if framework becomes unmaintained (low probability)
   - May require upstream contributions for edge cases

3. **Architectural Adjustments**
   - Express patterns need translation to FastMCP server composition
   - Current custom features require adaptation to framework patterns
   - WebSocket broadcasting needs refactoring for FastMCP extensions

### Neutral

1. **Jules API Integration** - Still requires custom business logic
2. **UI Components** - Frontend needs update but framework provides client SDK
3. **Deployment** - FastMCP Cloud tooling available but optional

## Implementation Plan

### Phase 1: Proof of Concept (Weeks 1-3)
- Review FastMCP 2.0 documentation and examples
- Prototype core session management with persistence
- Test enterprise authentication integration (GitHub OAuth)
- Validate WebSocket real-time capabilities
- Benchmark against current custom implementation

**Decision Point:** Approve full migration if POC validates capabilities

### Phase 2: Backend Migration (Weeks 4-7)
- Replace Express routes with FastMCP server composition
- Migrate WebSocket logic to FastMCP extensions
- Implement FastMCP session persistence backend (Redis)
- Integrate GitHub OAuth authentication
- Port Jules business logic to FastMCP context

### Phase 3: Frontend Integration (Weeks 8-12)
- Install FastMCP TypeScript client SDK
- Replace manual fetch/WebSocket with client methods
- Integrate real-time WebSocket hooks
- Update UI components to use MCP data models
- Implement automatic reconnection and state recovery

### Phase 4: Production Hardening (Weeks 13-15)
- Deploy with FastMCP Cloud tooling (or manual Kubernetes)
- Configure monitoring and observability
- Load testing and performance optimization
- Security audit of authentication flow
- Documentation and runbook creation

## Risk Mitigation

### Framework Lock-in Risk
**Mitigation:**
- Use standard MCP interfaces where possible
- Abstract business logic from framework specifics
- Design data models independently
- Maintain ability to migrate to Official SDK if needed

### Framework Maturity Risk
**Mitigation:**
- Thorough POC before full commitment (Phase 1)
- Evaluate community activity and maintainer responsiveness
- Budget time for upstream contributions if needed
- Document all framework-specific customizations

### Migration Disruption Risk
**Mitigation:**
- Incremental migration with feature flags
- Maintain current system in parallel during transition (Weeks 4-8)
- Comprehensive testing at each phase
- Rollback plan if critical issues emerge

## References

- [MCP Framework Strategic Analysis](../MCP_FRAMEWORK_ANALYSIS.md)
- [Executive Brief](../research/gemini/executive-brief.md) - 5-minute decision summary
- [Architecture Diagrams](../research/gemini/architecture-diagrams.md) - Visual comparisons
- [Strategy Comparison](../research/gemini/strategy-comparison.md) - Feature matrix and cost-benefit
- [Strategic Update](../research/gemini/strategic-update.md) - Complete analysis with detailed roadmap
- [FastMCP 2.0 Documentation](https://github.com/jlowin/fastmcp) - Official framework docs

## Decision History

- **October 2025:** Initial EasyMCP recommendation based on developer experience
- **October 2025:** Updated recommendation to FastMCP 2.0 after comprehensive research revealed production-readiness and enterprise features
- **November 2025:** Decision accepted, POC phase approved

---

**Next Review Date:** After Phase 1 POC completion (Week 3)
**Review Trigger:** If POC reveals critical FastMCP 2.0 limitations
