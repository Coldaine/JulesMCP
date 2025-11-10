---
doc_type: playbook
subsystem: general
version: 1.0.0
status: approved
owners: Documentation Working Group
last_reviewed: 2025-11-10
---

# Pull Request Playbook

**Location:** `docs/playbooks/organizational/pr_playbook.md`

This playbook defines the organization-wide pull request policy, merge strategy, PR template requirements, and review guidelines. It is referenced by the [Master Documentation Playbook](documentation_playbook.md) and applies to all repositories.

## 1) Pull Request Requirements

### 1.1 Branch Protection

- All changes to `main` branch MUST go through a pull request
- No direct commits to `main` allowed
- At least 1 approval required before merge (configurable per repo)
- All CI checks must pass before merge

### 1.2 PR Creation Checklist

Every PR MUST include:

1. **Clear title** - Descriptive, following conventional commit format if applicable
2. **Description** - What changes were made and why
3. **Documentation updates** - If applicable, link to updated docs and confirm metadata headers are present
4. **Changelog decision** - Per the changelog rubric in `docs/standards.md`:
   - Is this change user-visible?
   - If yes, has `CHANGELOG.md` been updated?
5. **Task tracking** - Confirm relevant tasks were added/updated in `docs/todo.md`
6. **Testing notes** - How the changes were tested

### 1.3 PR Template

Repositories SHOULD use this PR template (`.github/pull_request_template.md`):

```markdown
## Description
<!-- Brief description of changes -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## Documentation
- [ ] Documentation has been updated (if applicable)
- [ ] All new/updated markdown files have required metadata headers
- [ ] Links to updated documentation:

## Changelog
Per the [changelog rubric](docs/standards.md):
- [ ] This change is user-visible (requires CHANGELOG.md entry)
- [ ] This change is internal only (no changelog needed)
- [ ] CHANGELOG.md has been updated (if user-visible)

## Task Tracking
- [ ] Relevant tasks added/updated in `docs/todo.md`
- [ ] Supporting materials linked from `docs/tasks/` (if applicable)

## Testing
<!-- Describe how the changes were tested -->

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published
```

## 2) Merge Strategy

### 2.1 Allowed Merge Methods

**Primary method:** "Rebase and merge"
- Maintains linear history
- Each commit from PR is preserved
- Preferred for most cases

**Alternative (if enabled):** "Squash and merge"
- Combines all PR commits into single commit
- Use for noisy PR histories
- Org policy determines if this is allowed

**Prohibited:** "Merge commits"
- No merge commits allowed
- Keeps history clean and linear

### 2.2 Auto-Merge

- Auto-merge MAY be enabled via workflow
- Requires all checks to pass
- Requires required approvals
- See `docs/playbooks/organizational/github_governance.md` for details

## 3) Code Review Guidelines

### 3.1 Reviewer Responsibilities

Reviewers MUST verify:

1. **Code quality**
   - Follows project conventions and style guide
   - No obvious bugs or security issues
   - Appropriate error handling
   - Reasonable performance considerations

2. **Testing**
   - Adequate test coverage for new code
   - Tests are meaningful and pass
   - Manual testing notes provided (if applicable)

3. **Documentation**
   - User-facing changes documented
   - Code comments present where needed
   - Markdown files have required metadata headers
   - Internal docs updated to reflect changes

4. **Task tracking**
   - Changes reflected in `docs/todo.md`
   - Completed tasks marked appropriately

5. **Changelog compliance**
   - Rubric followed correctly
   - CHANGELOG.md updated if user-visible

### 3.2 Review Etiquette

- **Be constructive** - Suggest improvements, don't just criticize
- **Be specific** - Point to exact lines, provide examples
- **Be timely** - Respond to PRs within 24-48 hours
- **Be thorough** - Don't rubber-stamp; actually review the code
- **Approve when satisfied** - Don't block unnecessarily

### 3.3 Addressing Feedback

PR authors SHOULD:
- Respond to all comments (even if just acknowledging)
- Make requested changes or explain why not
- Request re-review after addressing feedback
- Keep discussion focused and professional

## 4) CI Checks (Required)

All PRs MUST pass these automated checks:

1. **Linting** - Code style and formatting
2. **Type checking** - TypeScript/Rust type validation
3. **Build** - Project builds successfully
4. **Tests** - All test suites pass
5. **Documentation validation**:
   - All markdown under `/docs` has required metadata headers
   - No markdown files added outside `/docs` (unless approved exception)
   - Mermaid diagram syntax validation (if present)
6. **File watcher log** - `docs/revision_log.csv` updated for significant doc changes

### 4.1 Documentation CI Details

The CI MUST reject PRs if:
- Changed markdown files under `/docs` are missing required headers
- Markdown is added outside `/docs` without exception approval
- Mermaid diagrams have syntax errors

The CI SHOULD warn if:
- Files added under `docs/tasks/` but no update to `docs/todo.md`
- Large documentation changes without revision log entry

## 5) Special Cases

### 5.1 Documentation-Only PRs

- Still require approval and passing checks
- May be fast-tracked if urgent
- Must still follow metadata header requirements
- Consider using `[docs]` prefix in PR title

### 5.2 Breaking Changes

- Clearly label as breaking change
- Explain migration path in PR description
- Update relevant documentation
- MUST have CHANGELOG.md entry with clear upgrade notes

### 5.3 Emergency Fixes

- May bypass some process requirements with approval
- Document the exception in PR
- Follow up with proper documentation if rushed

## 6) PR Lifecycle

### 6.1 Draft PRs

- Use draft status for work-in-progress
- Useful for early feedback
- CI runs but approval not required
- Convert to "Ready for review" when done

### 6.2 Review Process

1. Author creates PR
2. CI checks run automatically
3. Reviewers notified
4. Reviewers provide feedback
5. Author addresses feedback
6. Reviewers approve
7. PR merged (manually or auto-merge)

### 6.3 Stale PRs

- PRs inactive for >14 days may be closed
- Author can reopen if still relevant
- Consider rebasing onto current main

## 7) Related Documentation

- [Master Documentation Playbook](documentation_playbook.md) - Overall documentation governance
- [CI/CD Playbook](ci_cd_playbook.md) - CI enforcement details
- [Documentation Standards](../../standards.md) - Metadata schema and changelog rubric
- [GitHub Governance](github_governance.md) - Branch protection and merge settings (if exists)

## 8) Exceptions and Overrides

Repository-specific exceptions to this playbook must be documented in that repository's `docs/standards.md` under "Approved Exceptions" and link back to this playbook.

## Appendix A - Changelog Rubric Quick Reference

From `docs/standards.md`:

**Add to CHANGELOG.md if:**
- User-visible behavior changes
- New features or capabilities
- Bug fixes that affect users
- Breaking changes or deprecations
- Security fixes

**Skip CHANGELOG.md if:**
- Internal refactoring with no user impact
- Test-only changes
- Documentation-only updates
- Build/CI configuration changes
- Dependency updates with no user impact

When in doubt, include it in the changelog with `[Internal]` prefix.
