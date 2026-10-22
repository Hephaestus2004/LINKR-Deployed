# Architecture & System Map: LINKR

> **Note**: For exhaustive technical details and operations, see [`Docs/11_CURRENT_ARCHITECTURE_AND_USAGE_GUIDE.md`](./11_CURRENT_ARCHITECTURE_AND_USAGE_GUIDE.md) and [`Docs/02_ARCHITECTURE.md`](./02_ARCHITECTURE.md).

---

## 1. High-Level Flow

```text
[ NFC Card / QR Code ]
       │  (e.g., https://linkr-tap.site/u/k7x2m9qa)
       ▼
[ Cloudflare Pages Edge Router (functions/u/[id].ts) ]
       │
       ├──► Query Cloudflare D1 Database (profiles table)
       │
       ├──► Tier Check:
       │      ├─ "redirect" ──► HTTP 302 to destination social URL
       │      └─ "full"     ──► Read public/t/[template]/index.html
       │                        Inject Open Graph tags + __PROFILE_DATA__
       │                        Serve cached HTML response to client
       ▼
[ Client Browser (Zero-Build ES Modules) ]
       │
       └──► public/shared/ui.js renders links, QR flip card, vCard save button
```

---

## 2. Directory Responsibilities

| Path | Role | Tech Stack |
|---|---|---|
| `public/` | Static web root served by Cloudflare Pages | HTML, CSS, SVG, Vanilla JS |
| `public/t/` | Profile templates (`clean-white`, `glass-dark`) | Vanilla CSS, ES modules |
| `public/shared/` | Shared browser modules (`parse.js`, `vcard.js`, `ui.js`) | ES Modules (No build step) |
| `public/admin/` | Management console with live simulator | HTML5, Vanilla JS |
| `functions/` | Serverless edge API and routing | Cloudflare Pages Functions (TypeScript) |
| `functions/_lib/` | Reusable edge logic (Crockford IDs, validation, cache) | TypeScript |
| `migrations/` | D1 database schema definitions | SQLite SQL (`0001_init.sql`) |
| `tools/` | Production CLI tools (QR, ID generation, chip export) | Python 3 |
| `fixtures/` | Standard test profiles for regression tests | Plain text |
| `Docs/` | Project memory, architecture, SOP, and work logs | Markdown |

---

## 3. Key Endpoints

- `/u/:id` — Public profile edge handler with HTML template injection.
- `/vcard/:id` — Server-generated `.vcf` file for instant contact saving.
- `/api/profile/:id` — Edge-cached JSON representation of a profile.
- `/api/claim` — Public endpoint to activate newly printed smart cards.
- `/api/admin/*` — Cloudflare Access-protected administrative endpoints.
- `/healthz` — Edge and D1 latency health check probe.
