---
doc_type: reference
subsystem: general
version: 1.0.0
status: approved
owners: Architecture Team
last_reviewed: 2025-11-10
---

# Architecture Decision Record (ADR) Process

This document defines how Architecture Decision Records (ADRs) are created, reviewed, approved, and maintained in this project.

## Overview

ADRs are lightweight documents that capture important architectural decisions along with their context and consequences. They help teams understand:
- **What** decisions were made
- **Why** those decisions were made
- **What alternatives** were considered
- **What consequences** (positive and negative) resulted

## When to Create an ADR

### Required for:

- ✅ **Framework or library selection** (e.g., FastMCP vs EasyMCP)
- ✅ **Architectural patterns** (e.g., centralized LLM router)
- ✅ **Data storage decisions** (e.g., SQLite vs PostgreSQL)
- ✅ **Security or authentication approaches**
- ✅ **API design patterns**
- ✅ **Deployment architecture changes**
- ✅ **Significant refactoring decisions**

### Optional for:

- ⚠️ **Minor tool or utility choices** (can be documented in commit messages)
- ⚠️ **Temporary workarounds** (unless they become permanent)
- ⚠️ **Implementation details** (save for code comments or design docs)

### Not Needed for:

- ❌ Bug fixes
- ❌ Code style preferences (use linters/prettier)
- ❌ Documentation updates
- ❌ Test improvements
- ❌ Dependency updates (unless changing strategy)

## ADR Creation Process

### Step 1: Identify the Need

When facing an architectural decision:

1. **Confirm it requires an ADR** (see "When to Create an ADR" above)
2. **Check existing ADRs** to ensure you're not duplicating
3. **Gather context** about the problem and constraints

### Step 2: Research & Propose

1. **Copy the template**: `docs/architecture/adr-template.md`
2. **Name the file**: `adr-XXXX-short-descriptive-title.md`
   - Use next sequential number (check existing ADRs)
   - Use kebab-case for filename
   - Example: `adr-0003-database-selection.md`

3. **Fill out the template**:
   - **Context**: Describe the problem clearly
   - **Alternatives**: Research at least 2-3 viable options
   - **Analysis**: Compare alternatives objectively
   - **Recommendation**: Propose the best choice with rationale

4. **Set Status to "Proposed"**

### Step 3: Review & Discussion

**For Personal Projects (this project):**

Since this is a personal tool (single developer), the review process is lightweight:

1. **Self-review checklist**:
   - [ ] Have I considered at least 2 alternatives?
   - [ ] Is the rationale clear and well-documented?
   - [ ] Are risks identified with mitigation strategies?
   - [ ] Does this align with project goals?
   - [ ] Will future-me understand why I made this decision?

2. **Optional external review**:
   - Share with trusted colleagues or communities (Discord, Reddit, etc.)
   - Incorporate feedback if valuable
   - Not required, but recommended for major decisions

3. **Approval**: Once satisfied, change Status to "Accepted"

**For Team Projects:**

If this project grows to include multiple contributors:

1. **Create a PR** with the ADR
2. **Tag relevant reviewers**:
   - Backend changes: Backend team
   - Infrastructure: DevOps/Platform team
   - Security-related: Security team (if exists)
3. **Discussion period**: Allow 3-5 days for feedback
4. **Address comments**: Incorporate feedback or explain why not
5. **Approval**: Requires approval from at least one maintainer
6. **Merge**: Change Status to "Accepted" before merging

### Step 4: Implementation

1. **Reference the ADR** in implementation PRs:
   ```
   Implements ADR-0003 database selection

   This PR adds PostgreSQL as the primary datastore
   per ADR-0003 decision to use relational database.
   ```

2. **Update ADR if needed**:
   - If implementation reveals new information
   - Add an "Amendments" section with date
   - Don't rewrite history - document changes transparently

3. **Track progress**:
   - Add implementation tasks to `docs/todo.md`
   - Reference ADR in related commits

### Step 5: Maintenance

After implementation:

1. **Schedule review** (add to ADR):
   - 3 months after implementation
   - Or when triggered by specific conditions

2. **Update documentation**:
   - Add ADR to `docs/architecture.md` ADR list
   - Add to `docs/architecture/roadmap.md` Decision Log
   - Update CHANGELOG.md if user-impacting

3. **Monitor assumptions**:
   - Track if assumptions in ADR remain valid
   - Note if consequences differ from predictions

## ADR Lifecycle

```
┌──────────┐
│ Proposed │ ← Draft, under discussion
└─────┬────┘
      │
      ▼
┌──────────┐
│ Accepted │ ← Approved, ready for implementation
└─────┬────┘
      │
      ▼
[Implementation happens]
      │
      ├─→ Still valid ─→ Continue using
      │
      ├─→ Better option found ─┐
      │                        │
      ▼                        ▼
┌────────────┐        ┌───────────────┐
│ Deprecated │        │  Superseded   │
└────────────┘        └───────────────┘
                      (new ADR created)
```

### Status Definitions

| Status | Meaning | Action |
|--------|---------|--------|
| **Proposed** | Under discussion, not yet approved | Review and provide feedback |
| **Accepted** | Approved and active | Implement or reference |
| **Deprecated** | No longer recommended, but may exist in codebase | Migrate away when possible |
| **Superseded** | Replaced by a newer ADR | See superseding ADR |

### Deprecating or Superseding ADRs

When a decision needs to change:

1. **Create new ADR** with updated decision (don't edit the old one)
2. **Update old ADR**:
   - Change Status to "Deprecated" or "Superseded"
   - Add note: `**Superseded by:** ADR-XXXX`
   - Add date when superseded
3. **New ADR references old**:
   - In "Supersedes" field
   - In "Context" section explaining why change was needed

## ADR Numbering

- **Sequential numbering**: ADR-0001, ADR-0002, ADR-0003, etc.
- **Zero-padded**: Use 4 digits (ADR-0001, not ADR-1)
- **No gaps**: Don't skip numbers
- **No reassignment**: Once assigned, number never reused

**Current ADRs:**
- ADR-0001: MCP Framework Selection (FastMCP 2.0)
- ADR-0002: Centralized LLM Router Pattern
- **Next:** ADR-0003

## File Naming Convention

```
adr-XXXX-short-descriptive-title.md
```

- **`adr-`**: Prefix for all ADRs
- **`XXXX`**: Zero-padded sequential number (0001, 0002, etc.)
- **`short-descriptive-title`**: Kebab-case, describes the decision
- **`.md`**: Markdown extension

**Examples:**
- `adr-0001-mcp-framework-selection.md`
- `adr-0002-centralized-llm-router.md`
- `adr-0003-database-selection.md` (hypothetical)

## Storage Location

All ADRs are stored in:

```
docs/architecture/adr-XXXX-*.md
```

**Supporting files** (diagrams, research) go in:

```
docs/architecture/adr-XXXX-*/
```

Example:
```
docs/
└── architecture/
    ├── adr-0001-mcp-framework-selection.md
    ├── adr-0002-centralized-llm-router.md
    ├── adr-0002-centralized-llm-router/
    │   ├── router-architecture-diagram.png
    │   └── cost-analysis.csv
    ├── adr-template.md
    ├── adr-process.md (this file)
    └── roadmap.md
```

## ADR Metadata

Every ADR must include YAML frontmatter:

```yaml
---
doc_type: architecture
subsystem: general  # or api, ws, auth, ji, per, ui
version: 1.0.0
status: approved
owners: Architecture Team
last_reviewed: YYYY-MM-DD
---
```

## Review Schedule

### Regular Reviews

- **Quarterly**: Review all Accepted ADRs to check if still valid
- **Annual**: Comprehensive review of all ADRs for deprecation candidates

### Triggered Reviews

Review an ADR when:
- Implementation reveals major issues
- New technology makes decision obsolete
- Business requirements change significantly
- Performance or security issues emerge

## Communication

### Internal (Single Developer)

For personal projects:
- ADRs live in Git history
- Reference in commit messages
- Update `docs/todo.md` with implementation tasks

### External (If Project Grows)

If project becomes multi-contributor:
- Announce new ADRs in team chat/Discord
- Present major ADRs in team meetings
- Include in sprint planning
- Add to project wiki/documentation site

## Quality Standards

### Every ADR Must Include:

1. ✅ **Clear problem statement** - What are we deciding?
2. ✅ **At least 2 alternatives** - What options did we consider?
3. ✅ **Consequences** - What are the trade-offs?
4. ✅ **Rationale** - Why did we choose this?
5. ✅ **Review schedule** - When will we revisit?

### Best Practices:

- **Be concise**: Aim for 1-3 pages, not 20
- **Use visuals**: Diagrams explain better than words
- **Link to research**: Reference prototypes, benchmarks, articles
- **Update when wrong**: It's okay to be wrong, document learnings
- **Think long-term**: Consider maintenance, not just initial implementation

## Common Mistakes to Avoid

1. ❌ **Too much detail** - ADRs aren't design docs, keep it high-level
2. ❌ **No alternatives** - Always document what you didn't choose
3. ❌ **No consequences** - Every decision has trade-offs
4. ❌ **Editing history** - Don't change old ADRs, create new ones
5. ❌ **No review schedule** - Decisions need periodic validation

## Examples

### Good ADR:
- **ADR-0002**: Centralized LLM Router Pattern
  - Clear problem and context
  - Multiple alternatives considered
  - Detailed architecture with diagrams
  - Explicit consequences and mitigations
  - Implementation phases defined

### What a Bad ADR Looks Like:

```markdown
# ADR-9999: Use Redis

## Decision
We'll use Redis for caching.

## Rationale
Because it's fast.
```

**Problems:**
- No context or problem statement
- No alternatives considered
- No consequences documented
- No implementation details
- No review schedule

## Tools & Templates

### Available Resources:

- **Template**: `docs/architecture/adr-template.md`
- **Process Guide**: `docs/architecture/adr-process.md` (this file)
- **Examples**: `docs/architecture/adr-000*.md`

### Future Tooling (Optional):

- [ ] ADR validation script (check completeness)
- [ ] ADR index generator (auto-update ADR list)
- [ ] ADR status dashboard (visualize decision landscape)

## Related Documents

- [Architecture Overview](../architecture.md)
- [Roadmap - Decision Log](roadmap.md#decision-log)
- [Documentation Standards](../standards.md)
- [ADR Template](adr-template.md)

---

**Last Updated:** 2025-11-10
**Process Version:** 1.0.0
**Next Review:** 2026-02-10 (Quarterly)
