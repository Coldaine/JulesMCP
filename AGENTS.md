# Repository Guidelines

## Project Structure & Module Organization
- Root `package.json` proxies npm scripts into `backend/`.
- `backend/src` holds the Express server (`routes/`, `auth.ts`, `ws.ts`, `logging.ts`); add feature modules alongside existing folders.
- `backend/public` serves static UI assets, while `backend/dist` is generated — never edit compiled output.
- `shared/types.ts` provides DTOs reused via the `@shared/*` alias.
- `docs/` contains architecture notes, task tracking (`docs/todo.md`), and playbooks; prefer adding new guidance there over bloating `README.md`.

## Build, Test, and Development Commands
- `npm install && npm run dev` boots the server with nodemon/ts-node hot reload.
- `npm run build` emits TypeScript to `backend/dist`, and `npm run start` runs that output.
- Quality gates: `npm run lint`, `npm run lint:fix`, `npm run typecheck`.
- Testing: `npm run test` (Vitest run), `npm run test:watch` for loops, or `npx vitest run backend/src/__tests__/routes.test.ts` for a focused spec.
- Container smoke tests: `docker compose build && docker compose up -d`.

## Coding Style & Naming Conventions
- TypeScript everywhere; keep DTOs and Zod schemas in sync.
- ESLint enforces ordered imports, consistent type-only imports, and forbids unused vars (prefix intentional ones with `_`).
- Prettier uses single quotes, semicolons, trailing commas on multiline literals, and `printWidth` 100; rely on Husky/lint-staged auto-fixes instead of editing dist files.
- File names stay lowercase-hyphen, exported types/classes PascalCase, functions and locals camelCase.

## Testing Guidelines
- Tests live under `backend/src/__tests__`; mirror the area you touch (auth/security middleware, REST routes, WebSocket broadcaster, persistence).
- Keep Vitest deterministic: mock outbound calls with `nock`/`supertest`, avoid real Jules API traffic, and respect the `--no-threads` config.
- Always run `npm run test`, `npm run lint`, and `npm run typecheck` before pushing; CI fails on warnings.
- Documentation changes must retain front-matter headers and update `docs/revision_log.csv` when substantial.

## Commit & Pull Request Guidelines
- Follow the conventional commit style seen in history (`type(scope): summary`, e.g., `refactor(docs): reorganize plans`).
- Each PR needs a clear description, linked issues/tasks, testing notes, and a statement about changelog impact (`CHANGELOG.md`).
- Update `docs/todo.md` when tracking new work, and ensure `/docs` additions stay inside that tree with metadata.
- Branch from `main`, keep histories linear (rebase or squash), and wait for CI plus at least one approval before merging.

## Security & Configuration Tips
- Copy `backend/.env.example` to `backend/.env`; set `JULES_API_KEY`, `LOCAL_TOKEN`, and never check secrets in.
- Default deployments stay on localhost; if exposing to LAN, set `ALLOWLIST` CIDRs and `CORS_ORIGIN` explicitly.
- Enable SQLite history (`PERSIST=1`) only when mounting `data/` to durable storage.
- WebSocket clients must send `Sec-WebSocket-Protocol: bearer.<LOCAL_TOKEN>`; document this when sharing tools.
