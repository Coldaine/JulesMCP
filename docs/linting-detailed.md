# Auto-Linting Setup

This project has **3 layers** of automatic linting to keep code clean:

## 🟢 Layer 1: VS Code Auto-Fix (Immediate)

**Triggers:** Every time you save a file  
**What it does:** Runs `eslint --fix` on the saved file

### Setup:
1. Install the ESLint extension (VS Code will prompt you)
2. Open any `.ts` file and save it → imports auto-organize!

**Files:**
- `.vscode/settings.json` - Enables `editor.codeActionsOnSave`
- `.vscode/extensions.json` - Recommends ESLint extension

### Test it:
```typescript
// Mess up imports in any file:
import { logger } from './logging.js';
import express from 'express';
import { readFile } from 'node:fs';

// Save the file (Ctrl+S) → auto-fixed to:
import { readFile } from 'node:fs';

import express from 'express';

import { logger } from './logging.js';
```

---

## 🟡 Layer 2: Git Pre-Commit Hook (Before commits)

**Triggers:** When you run `git commit`  
**What it does:** Runs `eslint --fix` on all staged `.ts` files

### How it works:
```bash
git add backend/src/server.ts
git commit -m "update server"
# → lint-staged runs → auto-fixes imports → adds fixes to commit
```

**Files:**
- `.husky/pre-commit` - Git hook script
- `package.json` - `lint-staged` configuration

### Test it:
```bash
# Make a messy change
echo "import { z } from 'zod'; import express from 'express';" >> backend/src/test.ts

# Commit it
git add backend/src/test.ts
git commit -m "test"

# → Hook auto-fixes imports before committing!
```

---

## 🔵 Layer 3: Manual/CI Lint Check

**Triggers:** When you explicitly run it  
**What it does:** Verifies all files pass strict linting (no auto-fix)

### Commands:
```bash
npm run lint       # Check for errors (fails if any)
npm run lint:fix   # Fix all files in backend/src
```

Use this in CI/CD to ensure code quality.

---

## ❓ FAQ

### "I still see red squiggles in VS Code"

Those are cached TypeScript language server errors. Fix:
1. **Reload VS Code:** `Ctrl+Shift+P` → "Developer: Reload Window"
2. **Restart TS Server:** `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### "Git hook didn't run"

Ensure the hook is executable:
```bash
chmod +x .husky/pre-commit
```

### "I want to skip the pre-commit hook once"

```bash
git commit --no-verify -m "skip hooks"
```

### "Auto-fix on save isn't working"

1. Check ESLint extension is installed and enabled
2. Check Output panel: `View` → `Output` → Select "ESLint"
3. Verify `.vscode/settings.json` has `"source.fixAll.eslint": "explicit"`

---

## 🎯 Summary

| Layer | When | Speed | Auto-Fix |
|-------|------|-------|----------|
| **VS Code** | On save | Instant | ✅ Yes |
| **Git Hook** | On commit | ~1-2s | ✅ Yes |
| **CI Lint** | Manual/CI | ~2-3s | ❌ No |

**Result:** You almost never have to think about import ordering! 🎉
