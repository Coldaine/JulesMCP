# Documentation Review Prompt

## Quick Context

The JulesMCP project documentation has been reorganized. All docs moved to `/docs/` with a master index. Original files like `CLAUDE.md`, `IMPLEMENTATION.md`, etc. were moved or consolidated into comprehensive guides.

## Your Review Task

Critically evaluate this reorganization to ensure:
1. No information was lost
2. Structure is logical and discoverable
3. Common workflows are well-supported
4. The vision is coherent

---

## Critical Review Questions

### 1. Information Preservation

**Compare these consolidations:**

```bash
# Old → New mappings
CLAUDE.md → docs/claude-instructions.md + docs/development-guide.md
IMPLEMENTATION.md → docs/implementation-notes.md + docs/development-guide.md
LINTING.md → docs/linting-quick-reference.md + docs/linting.md
```

**Verify:**
- [ ] All architectural context from CLAUDE.md preserved?
- [ ] All implementation details from IMPLEMENTATION.md preserved?
- [ ] All linting setup steps preserved?
- [ ] All examples and commands preserved?

### 2. Test These Workflows

**Workflow A: New Developer (5 min)**
- Start at README.md
- Get the project running locally
- Make a change, run tests, understand linting

**Can you complete this using only the docs?** ✅ / ⚠️ / ❌

**Workflow B: API User (3 min)**
- Find how to authenticate
- Find endpoint documentation
- Find code examples (curl + TypeScript)

**Is this complete and clear?** ✅ / ⚠️ / ❌

**Workflow C: Production Deploy (5 min)**
- Find deployment guide
- Find security checklist
- Find environment configuration
- Find Docker instructions

**Is this production-ready?** ✅ / ⚠️ / ❌

**Workflow D: AI Agent (3 min)**
- Find comprehensive project context
- Find coding patterns and conventions
- Find architecture overview

**Can an AI agent understand the codebase?** ✅ / ⚠️ / ❌

### 3. Navigation Test

**Start at `README.md`:**
- Can you find the docs index? (should link to docs/INDEX.md)
- Is it clear where to go for different needs?

**Open `docs/INDEX.md`:**
- Can you quickly find any topic?
- Is the grouping logical?
- Are there clear paths for different personas (dev, ops, AI)?

**Try to find these specific things:**
1. How to set up auto-linting (should be easy)
2. What the WebSocket protocol is (should be clear)
3. How to deploy securely (should be complete)
4. How to run individual tests (should be documented)

**Rate discoverability:** 1-5 (where 5 = excellent)

### 4. Quality Checks

**Check for issues:**
- [ ] Broken internal links?
- [ ] Missing context (undefined acronyms/jargon)?
- [ ] Duplicate information in multiple places?
- [ ] Gaps (mentioned but not documented)?
- [ ] Inconsistent terminology?

**Rate documentation quality:** 1-5 per aspect
- Completeness: __/5
- Clarity: __/5
- Organization: __/5
- Actionability: __/5

---

## What to Report

### 1. Content Audit (Quick)

For each original file:
- ✅ Content preserved
- ⚠️ Content intentionally removed (explain why this makes sense)
- ❌ Content appears lost (needs recovery)

### 2. Workflow Results

For each workflow A-D:
- ✅ Complete and works well
- ⚠️ Mostly works (note gaps)
- ❌ Blocked or incomplete (explain)

### 3. Critical Issues (If Any)

List anything that:
- Blocks a common use case
- Loses important information
- Creates confusion
- Breaks the narrative

### 4. Recommendations

**Must fix:**
- [List critical issues]

**Should improve:**
- [List structural improvements]

**Nice to have:**
- [List enhancements]

---

## Quick Validation Commands

```bash
# See what changed
git status --short

# Compare old CLAUDE.md with new locations
git show HEAD:CLAUDE.md > /tmp/old-claude.md
wc -l /tmp/old-claude.md
wc -l docs/claude-instructions.md docs/development-guide.md

# Find all markdown files
find docs -name "*.md" | sort

# Check for broken internal links
grep -r "\.md" docs/ | grep -v "node_modules"
```

---

## Success Criteria

The reorganization succeeds if:

✅ All information preserved or intentionally removed with clear rationale  
✅ Common workflows are easier to complete than before  
✅ Documentation has clear entry points for different audiences  
✅ Related information is consolidated, not scattered  
✅ Navigation is intuitive (can find things in <2 clicks)  

---

## Time Estimate

- Content verification: 15 min
- Workflow testing: 15 min  
- Navigation/quality check: 10 min
- Report: 10 min

**Total: ~50 minutes**

---

## Reviewer's Final Assessment

**Overall rating:** 1-5 (where 5 = excellent reorganization)

**Confidence level:** High / Medium / Low

**Recommendation:** 
- [ ] Approve as-is
- [ ] Approve with minor fixes
- [ ] Needs revision (see critical issues)

**Summary:** [2-3 sentences on whether this reorganization achieves its goals]

---

Thank you for this critical review! Your feedback ensures we haven't lost important information and that the documentation serves all users effectively.
