# 04. Targets and Trajectory

Targets here are **proposals**. Replace estimates with measured numbers as soon as you have them. Start measuring this week: time to create one profile, time to produce one card per tier, defect rate, edit requests per 100 cards.

## 1. North-star and core KPIs

**North-star metric: active profiles**, meaning profiles scanned at least once in the last 30 days. It proves customers get ongoing value, which supports retention, referrals, and any future paid features.

| KPI | Why | Proposed target |
| --- | --- | --- |
| Orders per day | Volume | Per phase below |
| Gross margin per unit | Pricing health | Hold at or above 75% |
| Profile setup time (full tier) | Labor bottleneck | Under 5 minutes in admin |
| Redirect/direct tier setup time | Labor bottleneck | Under 1 minute |
| Production time per unit (all-in) | Capacity | Measure, then cut 30% |
| Defect and reprint rate | Quality and cost | Under 2% |
| Edit requests per 100 cards | Support load | Measure, then reduce via self-serve |
| Edit turnaround | Customer trust | Under 24 hours |
| Uptime of profile pages | Reliability | 99.9% or better |
| p95 profile load time | Experience | Under 1 second on mobile data |
| Scans per active profile per month | Value delivered | Track trend |
| Retailer concentration | Dependence | Largest retailer under 40% of revenue |
| Share of orders with pre-assigned IDs | Process maturity | 100% |
| Cash runway | Survival | At least 2 months of fixed costs plus stock |

## 2. Phased targets

| Phase | Window (from now) | Goal | Success criteria |
| --- | --- | --- | --- |
| **0. Foundation** | Weeks 0 to 2 | Decide and lock | Domain bought and locked. ID format and URL decided. Schema frozen. One template ported to the multi-profile system. 5 test profiles live |
| **1. Single deploy** | Weeks 3 to 6 | All **new** orders on the new platform | Admin page live behind Access. Batch ID generation and QR script working. Chip encoding and locking process working. No new repos created. Backups running |
| **2. Streamline** | Months 2 to 4 | Remove manual work | 3 or more templates. Claim page for `direct`/`redirect`. Customer edit form. Defect rate under 2%. Daily production cutoff running. Old Vercel clients migrated or redirecting |
| **3. Network** | Months 4 to 9 | Make retailers part of the platform | Retailer intake form and codes. 5 or more active coded retailers. Scan dashboard shown to customers. First hire or contractor in production. Terms, privacy notice, retailer agreement signed |
| **4. Platform** | Months 9 to 18 | Add recurring and B2B revenue | Team/corporate packs sold. Paid analytics or renewals live. Self-serve ordering page. Vanity slugs. Wallet pass or lead-capture feature prototyped |
| **5. Scale** | Months 18 to 36 | Region and product depth | Second market or language. White-label for large retailers. Dedicated support and production staff |

**Peak-season note.** Q4 is gifting season in the Philippines. If you are in peak volume now, do **not** cut over everything at once. Build the new system alongside the old one and move only new orders when Phase 1 passes its gate (`07_ROADMAP.md`).

## 3. Volume scenarios

Based on the illustrative mix in `01` (40% `direct`, 30% `redirect`, 30% `full`). Replace with your real mix.

| Units/day | Revenue/day | Contribution/day (after 10% leakage) | Labor hours/day (see 4) | People needed (8 productive hours each) |
| --- | --- | --- | --- | --- |
| 10 | P2,100 | P1,525 | about 1 | 1 (you) |
| 50 | P10,500 | P7,625 | about 5 | 1 to 2 |
| 200 | P42,000 | P30,500 | about 21 | 3 |
| 1,000 | P210,000 | P152,500 | about 103 | 13 or more, or heavy automation |

## 4. Labor model (the real capacity limit)

**Estimated** minutes per unit. These are guesses to replace with timed measurements.

| Task | `direct` | `redirect` | `full` |
| --- | --- | --- | --- |
| Profile entry (admin) | 0 | 1 | 5 |
| Sticker design (from template) | 0 | 0 | 5 |
| Apply sticker | 0 | 1 | 1 |
| Encode and lock chip | 1 | 1 | 1 |
| QA (tap and scan on 2 phones) | 1 | 1 | 1 |
| Pack and label | 1 | 1 | 1 |
| **Total minutes** | **3** | **5** | **14** |

At 200 units per day with the illustrative mix:

`80 x 3 + 60 x 5 + 60 x 14 = 240 + 300 + 840 = 1,380 minutes, about 23 hours`

That is about 3 full-time people. **The `full` tier takes about 60% of the labor for 30% of the units.** The biggest levers, in order:

1. **Self-serve claim and edit forms.** Customers type their own profile data. Removes profile entry and cuts Messenger back-and-forth.
2. **Templated sticker design.** The design is generated from profile data into a print-ready sheet (script or Canva bulk create) rather than designed by hand.
3. **Batch NFC encoding.** Pre-encoded chips from your supplier, or a batch writing tool.
4. **Station layout.** Separate stations for encode, QA, and pack so work flows without waiting.
5. **Raise the price of `full` or restrict its customization** if the labor stays high.

## 5. Hiring and delegation triggers

| Trigger | Action |
| --- | --- |
| Production uses more than 6 of your hours per day for 2 weeks | Hire or contract a part-time production helper |
| Support messages exceed about 20 per day | Add a support macro library and a part-time support person |
| Defect rate above 3% for 2 weeks | Pause scaling. Fix process before more volume |
| One retailer above 40% of revenue | Recruit or promote 2 more retailers |
| Weekly orders consistently above current capacity | Add a second production station or contractor |

## 6. Trajectory

```text
Stage 1: Card seller with a system        (now to month 3)
  - One platform, one domain, templates, admin, batch IDs
  - You stop being the data-entry person

Stage 2: Production line                  (months 3 to 9)
  - Self-serve claim/edit, templated stickers, a small team
  - Retailers use intake forms and codes

Stage 3: Profile platform + retailer network   (months 9 to 18)
  - Revenue beyond the card: edits, slugs, analytics, team packs
  - Customers and retailers depend on your platform

Stage 4: Scalable software business       (months 18 to 36)
  - Self-serve checkout, subscriptions, white label, other regions
  - Physical production is one channel, not the whole business
```

### Revenue shape over time

| Stage | Main revenue | Recurring share (target) |
| --- | --- | --- |
| 1 | Card sales | 0% |
| 2 | Card sales plus edit fees | under 5% |
| 3 | Card sales, team packs, upsells | 5 to 15% |
| 4 | Cards plus renewals and analytics | 15 to 30% |

## 7. Review cadence

| Cadence | Review |
| --- | --- |
| Daily | Orders, production count, defects, open edit requests |
| Weekly | Margin per tier, retailer orders, backup success, KPI table |
| Monthly | Revisit targets, update risk register (`05`), cash position |
| Quarterly | Restore test from backup, domain and account security review, pricing review |
