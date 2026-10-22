# LINKR Platform — Agent Working Rules & Memory

This repository is the **persistent source of truth**. When starting a new AI session (whether Claude, ChatGPT/Codex, Gemini, Copilot, or Antigravity), follow these permanent rules.

---

## 1. Before Starting Any Task

1. **Read `AGENTS.md` and `Docs/PROJECT_STATE.md` first.**
2. **Consult `Docs/ARCHITECTURE.md` and `Docs/DECISIONS.md`** only when relevant to the task.
3. Check `git status --short` and `git log -5 --oneline` to inspect the exact files and current working tree.
4. **Do NOT run a full repository audit** unless explicitly requested or when resolving a concrete inconsistency.
5. Inspect only the targeted files and their immediate dependencies first.

---

## 2. Core Stack & Architectural Boundaries

- **Platform**: Single-deploy Cloudflare Pages (`public/`) + Cloudflare Pages Functions (`functions/`).
- **Database**: Cloudflare D1 SQL (`migrations/0001_init.sql`).
- **Storage**: Cloudflare R2 bucket (`ASSETS`) for photos and media.
- **Client Profiles (`public/t/`)**: Pure **Vanilla HTML/CSS/ES Modules**. **NO client build step** for profile rendering. Shared logic lives in `public/shared/`.
- **Target Domain**: `linkr-tap.site`. Base public route: `/u/:id` with Option A Server-Side Injection.
- **Card ID Scheme**: 8-character Crockford Base32 (`k7x2m9qa`). Never change the Crockford alphabet or length.
- **Zero Trust**: Admin console routes under `functions/api/admin/` and `public/admin/` are protected behind Cloudflare Access.

---

## 3. Implementation Rules & Guardrails

- **Preserve Working Systems**: Never replace Cloudflare Pages Functions or Vanilla ES Modules with Next.js, Nuxt, Remix, or React for public profile rendering without explicit user authorization.
- **Keep Edits Scoped**: Make minimal, targeted diffs. Do not rewrite unaffected modules or refactor styling arbitrarily.
- **Never Overwrite Unrelated User Changes**: Always check `git diff` before and after modifying files.
- **Do Not Invent Implementations**: Inspect the actual file or API route before assuming its signatures or exports.
- **Safe Operations Only**: Ask before destructive operations, database migrations affecting live tables, or adding heavyweight npm packages.

---

## 4. Verification & Validation Commands

Always run targeted validation appropriate to your changes:

```bash
# Type check Cloudflare Pages TypeScript Functions
npm run typecheck

# Test local pages & functions development
npm run dev

# Test D1 schema against local database
npm run d1:init

# Generate handoff status for next model
npm run ai:handoff
```

- **Distinguish verified facts from assumptions.**
- **Never claim a test or check passed unless you actually executed it.**
- If a check cannot be run (e.g. missing credentials or local wrangler daemon), explicitly state why.

---

## 5. Handoff Protocol (End of Every Session)

At the conclusion of each task:
1. Summarize the changes made and the technical rationale.
2. List changed files (`git status --short`).
3. Report test / typecheck results.
4. Record any unresolved issues and the recommended next task in `Docs/PROJECT_STATE.md` and `Docs/WORKLOG.md`.
5. Update `Docs/ARCHITECTURE.md` or `Docs/DECISIONS.md` only if architectural facts or decisions changed.
