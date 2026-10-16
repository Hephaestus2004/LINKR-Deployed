# LINKR Planning Pack

Planning documents for moving LINKR from "one repo per client" to a single multi-profile platform, plus the business plan around it.

Last updated: October 2026.

## What is in this pack

| File | What it answers |
| --- | --- |
| [01_BUSINESS_PLAN.md](./01_BUSINESS_PLAN.md) | What we sell, to whom, at what margin, and how we make money beyond the card |
| [02_ARCHITECTURE.md](./02_ARCHITECTURE.md) | The target technical system on Cloudflare, request flows, security, cost |
| [03_DATA_SCHEMA.md](./03_DATA_SCHEMA.md) | Profile data contract, `client.txt` v2, ID format, D1 tables, template manifest |
| [04_TARGETS_AND_TRAJECTORY.md](./04_TARGETS_AND_TRAJECTORY.md) | Phased targets, KPIs, volume scenarios, labor model, hiring triggers |
| [05_STRENGTHS_AND_PITFALLS.md](./05_STRENGTHS_AND_PITFALLS.md) | SWOT, risk register, founder pitfalls |
| [06_OPERATIONS_SOP.md](./06_OPERATIONS_SOP.md) | Daily production flow, QR/NFC specs, QA, edits, suspensions, backups |
| [07_ROADMAP.md](./07_ROADMAP.md) | Week-by-week migration plan with go/no-go gates |
| [08_LEGAL_PRIVACY_CHECKLIST.md](./08_LEGAL_PRIVACY_CHECKLIST.md) | Registration, trademark, Data Privacy Act, terms, retailer agreement |
| [09_DECISIONS.md](./09_DECISIONS.md) | Open decisions with recommended defaults. Resolve these before printing |
| [10_IMPLEMENTATION_AUDIT.md](./10_IMPLEMENTATION_AUDIT.md) | Comprehensive audit of implementation against specs & architecture |
| [11_CURRENT_ARCHITECTURE_AND_USAGE_GUIDE.md](./11_CURRENT_ARCHITECTURE_AND_USAGE_GUIDE.md) | Current architecture, file responsibilities, and step-by-step usage guide |

## The one-page summary

**Where you are.** A working, profitable product with real demand. Cost of goods is roughly P20 to P70 per card against P150 to P300 in revenue. Your bottleneck is manual work: a GitHub repo, a Vercel URL, and a hand-edited template per client.

**Where you are going.** From a card seller to a profile platform. One codebase, one domain, many profiles identified by a random short ID, many templates, data in a database. The card is the entry product. The platform (editable links, analytics, templates, retailer network) is the business.

**Top 5 priorities, in order**

1. Buy and lock the domain, then decide the URL and ID format (see `09_DECISIONS.md`). Everything printed depends on it.
2. Build the single-deploy system: `/u/:id`, D1, one admin page. Stop creating repos.
3. Pre-generate ID batches so stock (stickers, chips) is made before orders exist.
4. Fix the labor bottleneck: self-serve claim and edit forms, templated sticker designs, batch NFC encoding.
5. Formalize the business: registration, terms, privacy notice, bookkeeping, retailer agreement.

**Do not do yet:** custom per-client code, a framework rewrite, customer logins, a mobile app.

## Assumptions used in this pack

1. **Volume.** "1k sales per day max, 200 avg" is read as units (cards) per day. If it actually means pesos per day, all volume numbers in `04` scale down, and the architecture and plan still hold. Replace the numbers using the scenario table in `04`.
2. **Prices and costs** are exactly as you gave them. The P300 tier is your supplier price to retailers. Retailers sell higher.
3. **Cloudflare D1 pricing and limits** were checked against Cloudflare's published pricing in October 2026. Items marked **(verify)** in these files come from memory or may have changed. Check them on Cloudflare's site before relying on them.
4. Nothing here is legal, tax, or financial advice. Get a local accountant and lawyer for `08`.
5. Peso estimates for USD prices use a rough rate. Recheck at purchase time.

## How to use this pack

- Treat `09_DECISIONS.md` as the source of truth for choices. When you decide something, update its status there.
- Treat `03_DATA_SCHEMA.md` as the contract. Templates change how data looks, never what data exists.
- Review `05` and `04` monthly. Replace estimated numbers with measured ones as soon as you have them (setup time per profile, defect rate, edit requests per 100 cards).
