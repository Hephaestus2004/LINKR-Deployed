# GitHub Copilot Instructions

Always follow the permanent rules and architectural boundaries defined in the root [AGENTS.md](../AGENTS.md).

## Quick Context
- **Project**: LINKR Single-Deploy Multi-Profile Platform on Cloudflare Pages.
- **Rules**:
  1. Read `AGENTS.md` and `Docs/PROJECT_STATE.md` before starting any task.
  2. Profiles in `public/t/` and `public/shared/` use **Vanilla HTML/CSS/ES Modules** (no client-side build step).
  3. Edge routing and injection occur in `functions/u/[id].ts` with Cloudflare D1 SQL.
  4. Never introduce heavy frameworks or rewrite architecture without explicit approval.
  5. Check `git status --short` before modifying code.
  6. Verify all TypeScript changes using `npm run typecheck`.
