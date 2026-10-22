# Project State: LINKR Platform

**Last Updated:** October 2026  
**Active Phase:** Production / Operational Deployment  
**Target Domain:** `linkr-tap.site`

---

## 1. What Is Implemented & Working

- **Edge Architecture & Routing**:
  - Cloudflare Pages Functions server injection on `/u/:id` (Option A: Server-Inject).
  - Instant HTTP 302 redirects for `redirect` tier cards.
  - Dynamic vCard generation endpoint at `/vcard/:id`.
  - Edge health probe at `/healthz`.
- **Database & Data Layer**:
  - D1 SQLite migration in `migrations/0001_init.sql` (8 tables: profiles, batches, cards, audit logs, edit requests).
  - Crockford Base32 ID generation & validation (`functions/_lib/ids.ts`).
- **Templates**:
  - `clean-white` and `glass-dark` templates in `public/t/`.
  - Zero-build client modules in `public/shared/` (`parse.js`, `links.js`, `vcard.js`, `ui.js`).
- **Admin & Tools**:
  - Admin UI in `public/admin/` with mobile preview and client.txt v2 parser.
  - Python scripts in `tools/` (`id_generate.py`, `qr_generate.py`, `export_chips.py`).
- **Verification**:
  - `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.

---

## 2. Active Work & Known Issues

- **`client-portal/` Configuration**:
  - Uncommitted wrangler config updates in `client-portal/` need validation against production secrets and D1 bindings.
- **Custom Domain & Cloudflare Access**:
  - Production deployment onto `linkr-tap.site` requires active Cloudflare Access Zero Trust policy configuration for `/admin/*` and `/api/admin/*`.

---

## 3. Immediate Next Recommended Task

- **Action**: Review and verify the `client-portal/` wrangler configuration or test end-to-end edge rendering using `npm run dev`.
- **Verification criteria**:
  1. `npm run typecheck` passes with zero errors.
  2. Local server `npm run dev` serves `http://localhost:8788/u/k7x2m9qa` with injected metadata and fallback profile.
