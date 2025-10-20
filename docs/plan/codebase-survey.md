# JulesMCP Codebase Survey (2025-10-19)

This document summarizes the current repository/branch state and enumerates problems and improvement opportunities without making changes. It ends with one or two detailed prompts you can use to drive an implementation pass.

## Repository and branch state

- Current branch: `main` (tracking `origin/main`)
- Local branches: `fix/improve-tests-and-config` (tracks `origin/fix/improve-tests-and-config`), `main`
- Remote branches present (all merged or historical):
  - `origin/main` (active)
  - `origin/codex/review-test-coverage-and-create-improvement-plan` (merged via PR #4)
  - `origin/codex/fix-and-approve-pull-request` (merged via PR #3)
  - `origin/codex/initialize-secure-real-time-backend` (merged)
  - `origin/fix/improve-tests-and-config` (stale; not merged into main)
- Open PRs: none (PR #3 and #4 merged)

Conclusion: main is the active branch. One extra remote branch exists (`origin/fix/improve-tests-and-config`) that may be stale.

## Build, type, lint, tests

- Tests: PASS (8 files, 32 tests) when run via `npm --workspace backend run test`
- Typecheck: FAILS currently when run in isolation (tsc --noEmit) due to path alias resolution during typecheck and some strict type assertions in tests. Test runner passes because of runtime and test setup.
  - Errors include: unresolved `@shared/types` in several files when tsc is invoked directly; strict assertions on unknown types in `logging.test.ts`.
- Lint: FAILS with 7 errors (import order, unused variables in test fakes, one no-explicit-any, import group spacing)
- Audit: 4 moderate advisories related to `vitest`/`vite`/`esbuild` toolchain; fix path suggests major upgrade to vitest 3.x

## Notable code-level observations

- WebSocket security:
  - Upgrade path enforces IP allowlist and rate limiting; tests cover unauthorized/no-bearer and throttling.
  - Headers handler ensures single Sec-WebSocket-Protocol response header.
- Persistence layer:
  - Can accept both deltas and sessions; supports deletion of removed sessions; uses sql.js with wasm locator.
  - Writes to `DATA_DIR` or `./data`.
- Rate limiter:
  - Global helper for programmatic use and per-middleware local state to avoid cross-app/test contamination; rolling window semantics covered by tests.
- TypeScript config:
  - Backend uses path alias `@shared/*` -> `../shared/*`; vitest config also maps alias. Typecheck run surfaced alias resolution and some strict typing issues in tests.
- Tooling:
  - ESLint reports spacing/order issues and one any type in `ws.ts` (`authWs(request as any)` usage) plus unused underscore params in test fakes.
  - Vitest CLI in backend uses `vitest run` (good); earlier `--no-threads` was removed.

## Problems and opportunities

We agreed to break the work into two phases:

- **Phase 1 (current PR):** Knock out the Types & Lint hygiene work so the repo is lint/tsc/test clean (Problems 1, 2, and 8).
- **Phase 2 (follow-up PR):** Handle the remaining tooling, dependency, documentation, and infra improvements (Problems 3–7) once the first PR lands.

1. Typecheck parity between `tsc --noEmit` and test runs

- Symptom: `npm run typecheck` fails with unresolved `@shared/types` and strict typings in tests, while tests pass.
- Impact: Inconsistent CI signals; harder to rely on typecheck gate.
- Likely causes: tsconfig includes look correct, but editor/tsc path alias must match; some tests access typed payloads as `unknown`.
- Scope: Backend tsconfig + 2–3 test files.

1. ESLint failures (7 errors)

- Import order spacing in tests and persistence import grouping.
- Unused underscore params in test fake classes.
- no-explicit-any in `ws.ts` handler for upgrade auth cast.
- Scope: Small edits across 4 files.

1. Dependency advisories (moderate) and outdated toolchain

- `vitest`, `vite`, `esbuild` advisories suggest upgrading vitest to 3.2.x (major).
- Risk: test and config churn; not urgent since dev-only, but worth scheduling.

1. Stale remote branch `origin/fix/improve-tests-and-config`

- Decide to prune or merge if it contains relevant work.

1. Docs and .env practices

- Env file loading is robust (backend/.env resolved relative), but README lacks a top-level reminder for `ENV_FILE` usage and persistence `DATA_DIR` volume mapping examples.
- Scope: Docs-only.

1. Docker security hardening (optional)

- Consider adding non-root user, read-only FS with tmpfs for writable dirs, explicit healthcheck.
- Scope: Dockerfile + compose.

1. CI additions (optional)

- Add GitHub Actions for lint, typecheck, test, and audit.
- Scope: New workflows.

1. Logging test strictness

- Tests assert on `payload` typed as unknown; fix tests to narrow or adjust logger types to expose shape.
- Scope: Single file improvement.

## High-level delegation brief (for an autonomous coding bot)

Objective

- Stabilize developer experience and CI without changing runtime behavior. Make the repo lint/type-check clean, add basic CI, and improve docs so future work is safer and faster.

Scope (you choose the path based on risk/impact)

- Prefer two small PRs: (A) Types & Lint hygiene; (B) Tooling, CI, and Docs. If low-risk, you may deliver (A) and (B) together. Keep diffs minimal and isolated.

Guardrails

- No API or WebSocket behavior changes; test suite must continue to pass.
- Keep Node targets at 20/22; avoid introducing new runtime dependencies or external services.
- Minimize churn: focus on configuration, types, lint rules, and docs. Small refactors allowed only to remove `any` or satisfy strictness.

Degrees of freedom

- You may adjust TypeScript/ESLint/Vitest configs, add CI workflows, and update docs. If moderate/major dependency upgrades are required, either complete them only if trivially safe or open a tracking issue with a short rationale and proposed plan.

Deliverables

- PR(s) with clear titles and summaries, passing CI, including:
  - Codebase is lint- and type-check clean in `backend`.
  - CI workflow(s) that run lint, typecheck, and tests on Node 20 and 22.
  - README additions covering `ENV_FILE`, `PERSIST=1`, and `DATA_DIR` volume mapping; optional Docker hardening notes.
  - If any items are deferred (e.g., dependency advisories), create issues describing options and recommendations.

Suggested execution order

1) Make `backend` lint/type-check clean (adjust path alias for `@shared/*`, remove `any` where feasible, tidy tests/types).
2) Add CI workflows for lint, typecheck, and tests; keep them fast and deterministic.
3) Address low-risk dependency advisories; if not trivial, open issues with proposed upgrade path.
4) Update docs: environment config and persistence usage; add brief Docker hardening notes (non-blocking).

Success criteria

- Commands succeed locally and in CI:
  - `npm --workspace backend run typecheck`
  - `npm --workspace backend run lint`
  - `npm --workspace backend run test`
- No observable runtime behavior changes; existing tests remain green.
- Concise PR(s) that are easy to review and clearly scoped, with follow-up issues for anything riskier.

## Phase 2 implementation prompt (detailed)

You will implement Phase 2: Tooling, CI, Docs, and infra improvements. Execute the issues below and associated changes under the following constraints:

Constraints

- Do not change API or WebSocket runtime behavior. Tests must remain green.
- Keep Node targets at 20 and 22. Avoid introducing new runtime dependencies or external services.
- Prefer small, isolated PRs. If batching, keep commits scoped per topic and reference the issue numbers.

Issues to complete (must close these in this Phase)

1. CI: Add GitHub Actions for lint, typecheck, and tests (Node 20/22) — Issue #5

URL: <https://github.com/Coldaine/JulesMCP/issues/5>

Details: Implement `.github/workflows/ci.yml` with three jobs (lint, typecheck, test) using a Node matrix [20, 22]. Use actions/setup-node with npm cache keyed by lockfile. Trigger on push and pull_request. Add concurrency to cancel in-progress per-branch runs. Ensure workspace-aware installs (npm ci at repo root) and workspace commands.

Acceptance: Workflow runs on PRs and main; all jobs pass for current main; cache effective.

1. Docs: Environment & Persistence usage (ENV_FILE, PERSIST, DATA_DIR, Docker) — Issue #6

URL: <https://github.com/Coldaine/JulesMCP/issues/6>

Details: Add README sections (root and/or backend) explaining ENV_FILE resolution, PERSIST=1 toggle, DATA_DIR default, Docker Compose volume mapping, and a minimal example .env (no secrets). Verify commands locally.

Acceptance: Clear, actionable docs; examples validated.

1. Deps: Review and address moderate advisories (vitest/vite/esbuild) — Issue #7

URL: <https://github.com/Coldaine/JulesMCP/issues/7>

Details: Run `npm audit` to confirm advisories. Attempt safe upgrades (e.g., vitest 3.x) only if trivial and tests remain green. If upgrades are non-trivial, document findings and open sub-issues or update this issue with a concrete plan (versions, breaking changes, migration steps).

Acceptance: Either advisories resolved with green tests, or a documented, actionable migration plan.

1. Docker: Optional hardening (non-root, RO FS, healthcheck) — Issue #8

URL: <https://github.com/Coldaine/JulesMCP/issues/8>

Details: Add a non-root user, consider read-only root filesystem with tmpfs for writable dirs, and define a HEALTHCHECK in Dockerfile and compose. Provide toggles or docs to relax hardening during local dev.

Acceptance: Hardened image runs under compose; healthcheck passes; docs explain toggles.

1. Cleanup: Remove or reconcile stale branch origin/fix/improve-tests-and-config — Issue #9

URL: <https://github.com/Coldaine/JulesMCP/issues/9>

Details: Inspect diff vs main. If redundant, delete the remote branch. If unique changes exist, cherry-pick/merge as appropriate and close with notes.

Acceptance: Decision and action recorded; branch handled.

1. CI: Add npm audit (informational) and caching improvements — Issue #10

URL: <https://github.com/Coldaine/JulesMCP/issues/10>

Details: Add an informational npm audit job (does not fail the build) and ensure cache keys include the lockfile hash. Make audit output visible on PRs.

Acceptance: Additional job present; PRs show audit results without blocking merges.

Other changes in scope (no separate issues required unless you prefer)

- Add brief README badges or status indicators (optional): CI status, Node versions supported.
- Document known deferrals from Issue #7 if upgrades are not taken now (e.g., create sub-issues like “Upgrade to Vitest 3.x” with concrete steps and risks).
- Update this plan document’s “GitHub issues to review for Phase 2” section after closing or adding issues.

PR guidance

- Prefer 2–3 PRs: one for CI (#5, #10), one for Docs (#6), one for Docker hardening (#8). Dependencies advisory (#7) can be part of the CI PR if trivial, otherwise plan-only update and separate PR later.
- Cross-reference issues in PR titles/descriptions, and provide a brief risk assessment when touching CI or Docker.

Validation

- Local: `npm --workspace backend run lint`, `typecheck`, and `test` pass.
- CI: All jobs succeed on Node 20 and 22. If a job is flaky, stabilize or document and open a follow-up issue.

Success criteria

- All issues (#5–#10) are closed or updated with explicit next steps.
- The repository has dependable CI, clearer docs for environment/persistence, optional Docker hardening, and a plan for dependency advisories.

## GitHub issues to review for Phase 2

- [#5 CI: Add GitHub Actions for lint, typecheck, and tests (Node 20/22)](https://github.com/Coldaine/JulesMCP/issues/5)
- [#6 Docs: Environment & Persistence usage (ENV_FILE, PERSIST, DATA_DIR, Docker)](https://github.com/Coldaine/JulesMCP/issues/6)
- [#7 Deps: Review and address moderate advisories (vitest/vite/esbuild)](https://github.com/Coldaine/JulesMCP/issues/7)
- [#8 Docker: Optional hardening (non-root, RO FS, healthcheck)](https://github.com/Coldaine/JulesMCP/issues/8)
- [#9 Cleanup: Remove or reconcile stale branch origin/fix/improve-tests-and-config](https://github.com/Coldaine/JulesMCP/issues/9)
- [#10 CI: Add npm audit (informational) and caching improvements](https://github.com/Coldaine/JulesMCP/issues/10)
