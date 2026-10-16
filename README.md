# LINKR Platform

LINKR is a multi-profile digital business card platform built on Cloudflare Pages Functions, D1 (SQL database), R2 (object storage), and edge caching. It operates on the domain **`linkr-tap.site`**.

This repository unifies LINKR from legacy "one repo per client" into a single, scalable multi-profile system.

---

## Repository Layout

```text
LINKR-Deployed/
├── public/                     # Static files served by Cloudflare Pages
│   ├── t/                      # Shared profile templates
│   │   ├── clean-white/        # Light neumorphic card template (default)
│   │   │   ├── index.html
│   │   │   ├── style.css
│   │   │   ├── render.js
│   │   │   └── manifest.json
│   │   └── glass-dark/         # Dark glassmorphism template
│   │       ├── index.html
│   │       ├── style.css
│   │       ├── render.js
│   │       └── manifest.json
│   ├── shared/                 # Reusable ES modules
│   │   ├── parse.js            # client.txt v2 parser and serializer
│   │   ├── links.js            # SVG icons, link types, URL normalizers
│   │   ├── vcard.js            # vCard 3.0 builder & Android intent
│   │   └── ui.js               # 3D flip card, initials avatar, Web Share
│   ├── landing/                # Public marketing landing page
│   ├── admin/                  # Admin UI console (behind Cloudflare Access)
│   ├── assets/                 # Favicons, fallbacks, QR placeholders
│   ├── index.html              # Root landing page
│   └── favicon.svg
├── functions/                  # Cloudflare Pages Functions (Edge backend)
│   ├── u/[id].ts               # Public profile route (/u/:id) with Option A Server-Inject
│   ├── api/profile/[id].ts     # Edge-cached JSON profile endpoint
│   ├── api/claim.ts            # Claim unassigned cards with code
│   ├── api/edit-request.ts     # Customer edit requests intake
│   ├── api/admin/
│   │   ├── profiles.ts         # Profile CRUD and status management
│   │   └── batches.ts          # Pre-generated stock ID batches
│   ├── vcard/[id].ts           # Server-generated .vcf download route
│   ├── healthz.ts              # System health & database latency check
│   └── _lib/                   # Internal utilities
│       ├── types.ts            # TypeScript interfaces
│       ├── ids.ts              # 8-char Crockford Base32 generator & validator
│       ├── validate.ts         # Schema, link security & tier validation
│       ├── cache.ts            # Edge cache headers & security headers
│       └── templates.ts        # Server-inject processor & system pages
├── migrations/
│   └── 0001_init.sql           # D1 database schema
├── tools/                      # Automation & production scripts
│   ├── id_generate.py          # Batch ID generator (CSV + D1 SQL)
│   ├── qr_generate.py          # Level H branded QR code generator
│   └── export_chips.py         # NFC chip encoder CSV export
├── fixtures/                   # Test fixtures adhering to 03_DATA_SCHEMA.md
│   ├── minimal.txt
│   ├── typical.txt
│   ├── maximal.txt
│   ├── long-text.txt
│   ├── no-photo-no-logo.txt
│   ├── logo-only.txt
│   ├── redirect.txt
│   └── rtl-or-emoji.txt
├── Docs/                       # Complete planning pack and documentation
├── wrangler.toml               # Cloudflare configuration for linkr-tap.site
├── package.json
└── tsconfig.json
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Local Development Server
Run the local Pages Functions dev server with live reload:
```bash
npm run dev
```
Open `http://localhost:8788`.

### 3. Initialize the D1 Database

#### For Local Development:
```bash
npx wrangler d1 execute linkr-db --local --file=./migrations/0001_init.sql
```

#### For Cloudflare Production:
1. Create your D1 database in Cloudflare dashboard or CLI:
   ```bash
   npx wrangler d1 create linkr-db
   ```
2. Copy the resulting `database_id` into [`wrangler.toml`](./wrangler.toml).
3. Apply the schema migration:
   ```bash
   npm run d1:init:prod
   ```

---

### 4. Enable R2 image storage

The admin profile editor stores uploaded photos, company logos, and optional QR images in the `linkr-assets` R2 bucket. Enable R2 for your Cloudflare account in the dashboard, then create the bucket:

```bash
npx wrangler r2 bucket create linkr-assets
```

The `R2_STORAGE` binding is configured in [`wrangler.toml`](./wrangler.toml). If R2 is unavailable, profiles without uploaded images can still be saved; image uploads require the bucket.

### 5. Deploy weekly D1 backups

Update the D1 `database_id` in [`wrangler.backup.toml`](./wrangler.backup.toml) to match `wrangler.toml`, then deploy the scheduled backup Worker:

```bash
npm run backup:deploy
```

It writes compressed snapshots of the LINKR D1 tables to the private `backups/d1/` prefix in R2 every Sunday at 02:00 UTC and deletes snapshots older than 90 days.

### 6. Deploy

```bash
npm run deploy
```

## Production Operations & Tools

### Generate Stock IDs (Pre-encoded chips & stickers)
Generates 100 unique Crockford Base32 8-character IDs:
```bash
python tools/id_generate.py --size 100 --label Batch-2026-10-A --domain linkr-tap.site
```
Outputs:
- `tool_output/Batch-2026-10-A.csv`
- `tool_output/Batch-2026-10-A.sql` (can be executed into D1)

### Export for NFC Chip Encoders
Generates CSV with columns `id,url,lock_chip` for NFC writer apps:
```bash
python tools/export_chips.py --csv tool_output/Batch-2026-10-A.csv --out tool_output/chips.csv
```

### Generate Branded QR Codes
Generates Level H QR codes with centered logo named `<id>.png`:
```bash
python tools/qr_generate.py --csv tool_output/Batch-2026-10-A.csv --out-dir tool_output/qrs
```

---

## Core Routes

| Route | Method | Description |
|---|---|---|
| `/u/:id` | GET | Public profile page (Option A Server-Inject, cached at edge) |
| `/api/profile/:id` | GET | Profile JSON (cached) |
| `/vcard/:id` | GET | Server-side `.vcf` download |
| `/admin` | GET | Admin management dashboard (behind Cloudflare Access) |
| `/api/admin/profiles` | GET / POST | Profile CRUD and status management |
| `/api/admin/batches` | GET / POST | Stock batch generation |
| `/api/claim` | POST | Customer card claiming |
| `/api/edit-request` | POST | Customer edit request intake |
| `/healthz` | GET | Uptime & latency check |
| `/t/:template/*` | GET | Static template assets |
| `/media/*` | GET | Public profile photos, company logos, and QR images stored in R2 |
