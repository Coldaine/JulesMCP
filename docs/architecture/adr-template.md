---
doc_type: architecture
subsystem: general
version: 1.0.0
status: template
owners: Architecture Team
last_reviewed: 2025-11-10
---

# ADR-XXXX: [Short Title in Title Case]

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** YYYY-MM-DD
**Decision Makers:** [Team or role names]
**Supersedes:** [ADR number if applicable, or N/A]
**Superseded by:** [ADR number if this is deprecated, or N/A]

## Context

### Problem Statement

[Describe the problem or situation that requires a decision. Be specific about:
- What challenge are we facing?
- Why do we need to make this decision now?
- What are the constraints?
- What assumptions are we making?]

### Current State

[Describe the current architecture, implementation, or approach if applicable]

```
[Optional: Include diagrams, code snippets, or architectural drawings]
```

### Background

[Provide additional context that helps understand the decision:
- Historical context
- Related systems or dependencies
- Technical constraints
- Business requirements
- User needs]

## Decision

**We will [state the decision clearly and concisely].**

### Detailed Description

[Explain the decision in detail:
- What exactly are we doing?
- How will it work?
- What are the key components?
- Include architecture diagrams if helpful]

```
[Optional: Include implementation details, diagrams, or examples]
```

### Key Characteristics

**What this solution IS:**
- ✅ [Specific capability or feature]
- ✅ [Another key aspect]
- ✅ [Another characteristic]

**What this solution is NOT:**
- ❌ [Something it explicitly doesn't do]
- ❌ [Common misconception to avoid]
- ❌ [Out of scope item]

### API/Interface Design (if applicable)

[If the decision involves interfaces, APIs, or contracts, define them here]

```typescript
// Example interface or API definition
```

### Configuration (if applicable)

[Document any configuration, environment variables, or setup required]

```yaml
# Example configuration
```

### Implementation Approach

[Break down how this will be implemented:
- Phase 1: Description
- Phase 2: Description
- Phase 3: Description]

## Consequences

### Positive Consequences

1. **[Benefit category]**
   - Specific advantage
   - Measurable improvement
   - Value delivered

2. **[Another benefit]**
   - Details
   - Impact

### Negative Consequences

1. **[Drawback or cost]**
   - Specific disadvantage
   - **Mitigation:** How we'll address this

2. **[Another drawback]**
   - Details
   - **Mitigation:** Strategy

### Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| [Risk description] | High/Medium/Low | High/Medium/Low | [How we'll mitigate] |
| [Another risk] | High/Medium/Low | High/Medium/Low | [Mitigation strategy] |

## Alternatives Considered

### Alternative 1: [Name]
**Approach:** [Brief description]

**Pros:**
- Advantage 1
- Advantage 2

**Cons:**
- Disadvantage 1
- Disadvantage 2

**Verdict:** ❌ Rejected - [Reason]

### Alternative 2: [Name]
**Approach:** [Brief description]

**Pros:**
- Advantage 1
- Advantage 2

**Cons:**
- Disadvantage 1
- Disadvantage 2

**Verdict:** ❌ Rejected - [Reason]

### Alternative 3: [Name]
**Approach:** [Brief description]

**Pros:**
- Advantage 1
- Advantage 2

**Cons:**
- Disadvantage 1
- Disadvantage 2

**Verdict:** ⏸️ Deferred - [Reason and conditions for reconsidering]

## Decision Rationale

[Explain WHY this decision was chosen over the alternatives:
1. Key factor that led to this choice
2. Another important consideration
3. Trade-offs we're comfortable making
4. Alignment with project goals or constraints]

## Related Decisions

- **ADR-XXXX**: [Title] - [How it relates]
- **Future ADR**: [Topic that will need a decision later]

## References

- [Link to relevant documentation]
- [Link to research or analysis]
- [Link to external resources]
- [Link to prototypes or experiments]

## Review Schedule

- **Next Review:** YYYY-MM-DD ([timeframe] after implementation)
- **Trigger for Earlier Review:** [Conditions that would require revisiting this decision]

---

## Notes for Using This Template

### When to Create an ADR

Create an ADR when:
- Making significant architectural decisions
- Choosing between multiple approaches with trade-offs
- Introducing new patterns, frameworks, or tools
- Changing existing architectural patterns
- Making decisions that affect multiple teams or systems
- Documenting important technical constraints or standards

### How to Use This Template

1. **Copy this template** to a new file: `adr-XXXX-short-title.md`
   - Use sequential numbering (check existing ADRs)
   - Use kebab-case for the filename

2. **Fill in all sections** - Don't delete sections, mark as N/A if not applicable

3. **Start with Status: Proposed** - Change to Accepted after approval

4. **Get review** from relevant stakeholders before marking as Accepted

5. **Update related documents**:
   - Add to ADR list in `docs/architecture.md`
   - Add to decision log in `docs/architecture/roadmap.md`
   - Reference in CHANGELOG.md if user-impacting

6. **Keep it concise** but complete - aim for clarity over length

### ADR Lifecycle

```
Proposed → Accepted → [Implemented]
                  ↓
              Deprecated → Superseded
```

- **Proposed**: Under discussion, not yet approved
- **Accepted**: Approved and ready for implementation
- **Deprecated**: No longer recommended, but may still be in use
- **Superseded**: Replaced by a newer ADR (note which ADR replaces it)

### Best Practices

- **Be specific**: Avoid vague language, use concrete examples
- **Show your work**: Document the alternatives you considered
- **Focus on "why"**: The decision is less important than the reasoning
- **Include diagrams**: Visual aids help explain complex decisions
- **Think long-term**: Consider maintenance, scaling, and evolution
- **Date everything**: Decisions should have clear timestamps
- **Link liberally**: Reference related ADRs and documentation

---

**Status:** Template
**Last Updated:** 2025-11-10
**Template Version:** 1.0.0
