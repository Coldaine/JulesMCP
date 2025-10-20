# Code Quality & Linting

This document explains the automated code quality tools and how to use them effectively.

## Overview

The project has **3 layers** of automatic linting to maintain code quality:

1. **VS Code Auto-Fix** (instant, on save)
2. **Git Pre-Commit Hook** (before commits)
3. **CI/Manual Checks** (in CI pipelines)

---

## Quick Commands

```bash
# Fix everything now
npm run lint:fix

# Check if code is clean
npm run lint

# Run type checking
npm run typecheck
```

---

## Layer 1: VS Code Auto-Fix (Instant) 🟢

### What It Does

Automatically fixes code issues every time you save a file.

### Features

- Auto-organizes imports (removes unused, sorts, adds blank lines)
- Fixes formatting issues
- Applies ESLint auto-fixes

### Setup

1. Install the ESLint extension (VS Code will prompt you)
2. Reload VS Code if needed
3. Open any `.ts` file and save it → imports auto-organize!

### Configuration Files

- `.vscode/settings.json` - Enables `editor.codeActionsOnSave`
- `.vscode/extensions.json` - Recommends ESLint extension

### Example

**Before save:**
```typescript
import { logger } from './logging.js';
import express from 'express';
import { readFile } from 'node:fs';
```

**After save (Ctrl+S):**
```typescript
import { readFile } from 'node:fs';

import express from 'express';

import { logger } from './logging.js';
```

---

## Layer 2: Git Pre-Commit Hook (Before Commits) 🟡

### What It Does

Runs `eslint --fix` on all staged `.ts` files when you commit.

### How It Works

```bash
# Make changes
git add backend/src/server.ts

# Commit (hook runs automatically)
git commit -m "update server"

# → lint-staged runs
# → auto-fixes imports
# → adds fixes to commit
```

### Configuration Files

- `.husky/pre-commit` - Git hook script
- `package.json` - `lint-staged` configuration

### Skip Hook (Emergency)

```bash
git commit --no-verify -m "skip hooks"
```

Use sparingly! The hook exists to maintain quality.

---

## Layer 3: Manual/CI Lint Check 🔵

### What It Does

Verifies all files pass strict linting (no auto-fix).

### Commands

```bash
# Check for errors (fails if any)
npm run lint

# Auto-fix all files
npm run lint:fix

# Run in backend only
npm --workspace backend run lint
npm --workspace backend run lint:fix
```

### Use in CI/CD

Add to your CI pipeline:

```yaml
- name: Lint
  run: npm run lint

- name: Type Check
  run: npm run typecheck

- name: Test
  run: npm run test
```

---

## ESLint Rules

### Import Ordering

Imports are automatically organized into groups with blank lines between:

1. **builtin** - Node.js built-in modules (`node:fs`, `node:path`)
2. **external** - npm packages (`express`, `zod`)
3. **internal** - Internal paths (`@shared/*`)
4. **parent/sibling** - Relative imports (`../`, `./`)
5. **type** - TypeScript type imports (`import type`)

Within each group, imports are sorted alphabetically (case-insensitive).

### Example

```typescript
// 1. Node.js built-ins
import { readFile } from 'node:fs';
import path from 'node:path';

// 2. External packages
import express from 'express';
import { z } from 'zod';

// 3. Internal modules
import type { Session } from '@shared/types';

// 4. Relative imports
import { logger } from './logging.js';
import { rateLimit } from '../security.js';
```

### Other Rules

- **No unused variables** (except prefixed with `_`)
- **Consistent type imports** (`import type` for types)
- **No explicit `any`** (use `unknown` + type guards)
- **No misused promises** (proper async/await handling)

---

## TypeScript Configuration

### Strict Mode

All TypeScript files must pass strict type checking:

```bash
npm run typecheck
```

### Path Aliases

The project uses path aliases for cleaner imports:

```typescript
// Instead of this:
import type { Session } from '../../shared/types.js';

// Use this:
import type { Session } from '@shared/types';
```

### Configuration Files

- `backend/tsconfig.json` - Main TypeScript config
- `backend/tsconfig.base.json` - Shared base config
- `backend/tsconfig.build.json` - Production build config

---

## Troubleshooting

### "I still see red squiggles in VS Code"

These are cached TypeScript language server errors. To fix:

1. **Reload VS Code**: `Ctrl+Shift+P` → "Developer: Reload Window"
2. **Restart TS Server**: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### "Auto-fix on save isn't working"

1. Check ESLint extension is installed and enabled
2. Check Output panel: `View` → `Output` → Select "ESLint"
3. Verify `.vscode/settings.json` has:
   ```json
   {
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": "explicit"
     }
   }
   ```

### "Git hook didn't run"

Ensure the hook is executable:

```bash
chmod +x .husky/pre-commit
```

### "Lint passes locally but fails in CI"

1. Ensure you committed the fixed files
2. Run `npm run lint` locally before pushing
3. Check that `.eslintrc.cjs` and `.eslintignore` are committed

---

## Best Practices

### For Development

1. ✅ Let VS Code auto-fix on save
2. ✅ Commit frequently (hook ensures quality)
3. ✅ Run `npm run lint` before pushing
4. ✅ Fix lint errors immediately

### For Code Review

1. ✅ Lint errors should never appear in PRs
2. ✅ Type errors should be caught before review
3. ✅ Focus reviews on logic, not formatting

### For AI Agents

1. ✅ Run `npm run lint:fix` after generating code
2. ✅ Let the auto-fix tools handle formatting
3. ✅ Focus on correctness and architecture

---

## Summary

| Layer | When | Speed | Auto-Fix |
|-------|------|-------|----------|
| **VS Code** | On save | Instant | ✅ Yes |
| **Git Hook** | On commit | ~1-2s | ✅ Yes |
| **CI Lint** | Manual/CI | ~2-3s | ❌ No |

**Result**: You almost never have to think about code quality! 🎉

The tools handle:
- ✅ Import organization
- ✅ Formatting consistency
- ✅ Common code smells
- ✅ Type safety

You focus on:
- 🎯 Business logic
- 🎯 Architecture
- 🎯 Testing
- 🎯 Documentation
