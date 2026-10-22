# Architectural Decisions Record (ADR)

This document records the foundational decisions made for LINKR, the alternatives considered, and the rationale. **Do not propose replacing these without an explicit business or technical justification approved by the user.**

---

## ADR 01: Single-Deploy Multi-Tenant Platform on Cloudflare

- **Context**: The previous version required generating a distinct GitHub repository and Vercel project for every individual client, leading to high maintenance overhead, deployment limits, and configuration drift.
- **Decision**: Consolidate all clients into a single Cloudflare Pages deployment served at `linkr-tap.site`.
- **Alternatives Rejected**:
  - *Multi-repo Vercel*: Rejected due to exponential maintenance and build limits.
  - *AWS Lambda + S3*: Rejected due to cold starts and complex provisioning compared to Cloudflare Pages edge execution.
- **Consequences**: Fast global edge routing (<50ms), single point of deployment, centralized updates.

---

## ADR 02: Vanilla ES Modules with Zero Client Build Step for Profiles

- **Context**: Client profiles (`/u/:id`) must load instantly on mobile devices when tapped via NFC cards, even on weak cellular connections (3G/4G).
- **Decision**: Use pure HTML, CSS, and Vanilla JavaScript ES Modules in `public/t/` and `public/shared/`. The edge function reads the HTML template, injects data into a `<script id="__PROFILE_DATA__">` tag, and streams it.
- **Alternatives Rejected**:
  - *React / Next.js SSR*: Rejected due to JavaScript bundle hydration overhead and unnecessary complexity for static profile cards.
  - *Tailwind JIT per profile*: Rejected in favor of scoped CSS custom properties.
- **Consequences**: Zero client bundle compilation overhead; sub-second mobile render times; easy template customization.

---

## ADR 03: Cloudflare D1 (SQL) for Data Storage

- **Context**: Profiles, batch inventory, and audit logs require relational integrity, fast edge reads, and zero-maintenance serverless scaling.
- **Decision**: Use Cloudflare D1 SQLite database located in proximity to Workers.
- **Alternatives Rejected**:
  - *KV Storage alone*: Rejected because searching, batch inventory tracking, and relational foreign keys (cards -> profiles) require SQL.
  - *External PostgreSQL (e.g. Supabase, Neon)*: Rejected to avoid egress latency on every edge request; D1 runs directly in Cloudflare's network.

---

## ADR 04: Crockford Base32 ID Encoding (8 Characters)

- **Context**: NFC chips and printed QR codes need short, URL-friendly identifiers that prevent human transcription errors.
- **Decision**: Use 8-character Crockford Base32 strings (e.g., `k7x2m9qa`).
- **Rationale**: Excludes ambiguous characters (`I`, `L`, `O`, `U`), case-insensitive, compact in QR codes (lower QR error-correction density needed).
