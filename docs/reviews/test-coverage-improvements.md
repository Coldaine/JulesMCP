# Backend Test Coverage Review

## Overview
A focused review of the backend Vitest suite uncovered three medium-severity gaps. Each gap targets infrastructure code whose regressions would silently degrade reliability or weaken security guarantees. The plan below captures the remediation work required for robust coverage.

## Action Plan

### 1. Exercise the persistence adapter (Medium)
- [x] Mock the `sql.js` dependency so tests can run without the WASM runtime.
- [x] Simulate file system interactions to ensure `persistSessions` writes serialized data and `loadSessions` rehydrates it.
- [x] Verify we log and swallow read errors so a corrupted DB does not crash startup.

### 2. Guard logging redaction and request IDs (Medium)
- [x] Spy on the shared logger and ensure `logEvent`/`logError` redact secrets and truncate oversized messages.
- [x] Validate `withRequestId` respects incoming IDs and generates a UUID fallback while emitting structured logs.

### 3. Strengthen rate limiter coverage (Medium)
- [x] Rewrite the security tests to create fresh middleware instances per test so counters do not leak between cases.
- [x] Use fake timers to assert requests are allowed again after the 60-second rolling window elapses.
- [x] Cover the "no allowlist configured" branch to keep the IP allow bypass intentional.
