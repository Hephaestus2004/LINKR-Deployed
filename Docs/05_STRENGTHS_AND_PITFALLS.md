# 05. Strengths, Weaknesses, and Pitfalls

## 1. Strengths

| Strength | Why it matters |
| --- | --- |
| **Proven demand** | You already sell at volume. Most startups never get this far |
| **High gross margin** | 77 to 88% margin per unit leaves room for mistakes, defects, and price tests |
| **Supplier position** | You sell at wholesale to retailers. That is distribution you don't pay to acquire |
| **Technical ability** | You can build and fix the platform yourself or direct a developer. A major advantage over card-only sellers |
| **Working template system** | A data-driven profile with QR flip card, vCard, and share is already built. Migration is a re-plumb, not a rewrite |
| **QR tooling** | A branded QR generator exists. It only needs batch and ID input |
| **Cheap infrastructure** | Static pages and edge hosting cost under 1% of revenue |
| **Low inventory risk** | Cards and sticker printing are cheap, so stock write-offs are small |
| **Early-stage speed** | No legacy, no bureaucracy. You can change prices, tiers, and process in a day |

## 2. Weaknesses

| Weakness | Consequence |
| --- | --- |
| **Founder-only operations** | Everything stops if you are sick or busy. Quality depends on one person's attention |
| **Manual production** | Labor, not software, limits volume (`04`) |
| **Low barrier to entry** | An NFC card is a commodity. Anyone can copy it |
| **New to business** | Common gaps: bookkeeping, tax, contracts, cash discipline, pricing confidence |
| **Retailer dependence** | Retailers own the customer relationship and the markup |
| **Outsourced sticker printing** | Quality, lead time, and price are not in your control |
| **No tracking yet** | You can't measure production, scans, or retailers until IDs and the database exist |
| **One-time pricing, ongoing obligation** | Customers expect links to work and edits to be cheap, indefinitely |
| **Domain not yet owned** | Printing anything now locks you into temporary URLs |

## 3. Opportunities

| Opportunity | Notes |
| --- | --- |
| Team and corporate packs | Higher order value, one invoice, repeat edits when staff change |
| Q4 corporate gifting | Seasonal demand spike |
| Recurring revenue (edits, slugs, analytics, renewals) | Turns a one-time sale into lifetime value |
| White label for large retailers | Retailer brand, your platform |
| Scan analytics | Clear customer-facing value ("see how many people tapped you") |
| Wallet passes, lead capture, booking and menu templates | Template packs per industry |
| Expansion to other markets | Same product, different languages and templates |
| Channel partnerships | Printers, co-working spaces, event organizers |

## 4. Threats

| Threat | Notes |
| --- | --- |
| **Copycats and price cutting** | Low barrier to entry. Compete on service, templates, and platform, not the card |
| **Retailers going direct to your supplier** | Mitigate by owning the platform and making their customers' profiles live on your domain |
| **Chip or sticker price increases** | Keep buffer stock, a second supplier, and price flexibility |
| **Platform changes** (Cloudflare pricing or policy) | Keep code portable. Static plus a small API port easily |
| **Regulation** (Data Privacy Act, consumer protection) | Handle consent and privacy notices properly (`08`) |
| **Bad-actor profiles** (scam, adult, hate) | Reputation damage and possible liability. Needs suspension and terms |
| **Domain or account loss** | Catastrophic. Treat as the top operational risk |

## 5. Pitfalls, in the order they will hit you

| # | Pitfall | When it hits | What to do |
| --- | --- | --- | --- |
| 1 | **Printing before the domain and ID format are final** | Now | Buy the domain, decide the ID format (`09`), then print |
| 2 | **Free-edit expectations** | First weeks after launch | Publish an edit policy now: free window, then a small fee |
| 3 | **Broken layouts from missing or extra data** | First 20 diverse clients | Optional-field rules, fixtures, validation on save (`03`) |
| 4 | **NFC chip overwrite or wrong encoding** | First batch | Lock chips, QA every unit (`06`) |
| 5 | **Manual bottleneck at the sticker and encoding step** | 30 to 50 units/day | Batch process, daily cutoff, templated designs |
| 6 | **Enumerable or leaked customer data** | Any time | Random IDs, rate limits, only public data in profiles |
| 7 | **Database free-tier limits and unindexed queries** | Growth | Paid plan, indexed ID, cache, scan counting outside profile rows (`02`) |
| 8 | **Support overload from free-text requests** | 50+ units/day | Intake forms, claim and edit pages, macros |
| 9 | **Retailer conflict or undercutting** | Growth | Written agreement, codes, wholesale tiers, platform lock-in |
| 10 | **Quality drift as volume rises** | 100+ units/day | QA checklist, defect log, sample inspection from printer |
| 11 | **Abuse and scam profiles** | Once self-serve exists | Suspend switch, terms, report link |
| 12 | **Data loss or bad migration** | Any time | Backups, versioned edits, staging, restore tests |
| 13 | **Domain lapse or lost account access** | Years later | Multi-year renewal, 2FA, shared recovery process |

## 6. Founder pitfalls (new to business)

| Pitfall | Practice |
| --- | --- |
| Mixing personal and business money | Separate bank/e-wallet from day one. Pay yourself a fixed amount |
| No bookkeeping | Record every sale and cost daily. A simple spreadsheet is fine. Get an accountant before tax season |
| Counting revenue as profit | Track contribution after leakage, not sales. Include your time as a cost |
| Underpricing | Your margins are high. Test higher prices on one tier. Discount with a reason, never by default |
| Saying yes to every custom request | Each custom job destroys the template advantage. Offer it as a paid extra |
| Verbal promises to retailers | Put pricing, defect, and resale terms in writing |
| Chasing features before process | Self-serve forms and a daily cutoff beat new templates |
| Hero mode | Document the SOP (`06`) so someone else can run it |
| Ignoring registration and tax | Formalize early (`08`). Retroactive problems cost more than compliance |
| Growth without cash buffer | Limit stock batches to 7 to 14 days. Keep a 2-month reserve for fixed costs |
| Burnout | Set a daily print cutoff and support hours. Say so publicly |

## 7. Risk register

Likelihood and impact scored 1 (low) to 5 (high). Review monthly.

| ID | Risk | L | I | Score | Mitigation | Early warning |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | Domain lapses or is lost | 1 | 5 | 5 | Multi-year, auto-renew, 2FA, backup card | Renewal notice, registrar emails |
| R2 | Cloudflare account locked or compromised | 1 | 5 | 5 | 2FA, hardware key, recovery codes, exported backups | Login alerts |
| R3 | Data loss or corruption | 2 | 5 | 10 | Weekly exports to R2 and a second location, Time Travel, restore drills | Failed backup alert |
| R4 | Labor capacity exceeded | 4 | 4 | 16 | Self-serve, templated design, batching, hiring triggers (`04`) | Orders waiting more than 2 days |
| R5 | Retailers bypass LINKR | 3 | 4 | 12 | Platform lock-in, agreement, retailer codes | Retailer order drop |
| R6 | Sticker printer fails or raises price | 3 | 3 | 9 | Second printer, buffer stock, written lead times | Late deliveries |
| R7 | Chip supply or price shock | 2 | 3 | 6 | Buffer stock, second supplier | Supplier price notices |
| R8 | Privacy complaint or breach | 2 | 4 | 8 | Consent, privacy notice, minimal data, suspension (`08`) | Complaints, odd traffic |
| R9 | Scam or abusive profiles | 3 | 3 | 9 | Terms, suspend switch, report link | Reports from the public |
| R10 | Quality defects increase | 3 | 3 | 9 | QA checklist, defect log, supplier inspection | Defect rate above 2% |
| R11 | Edit requests overwhelm support | 4 | 3 | 12 | Edit policy, fees, claim and edit forms | More than 10 edit requests per 100 cards |
| R12 | Copycat undercuts price | 4 | 3 | 12 | Compete on platform, templates, service | Competitor prices |
| R13 | D1 limits or unindexed queries cause outage | 2 | 4 | 8 | Paid plan, indexes, cache, monitoring | Rows-read metrics, 5xx rate |
| R14 | Single point of failure: you | 3 | 5 | 15 | Documented SOP, backup access, a second trusted person with limited access | Your own overload |
| R15 | Cash shortfall from large stock batches | 2 | 4 | 8 | Batch size cap, cash reserve | Low cash vs. open orders |
| R16 | Trademark conflict over "LINKR" | 2 | 4 | 8 | IPOPHL search, lawyer opinion, own domain | Cease-and-desist or conflict notice |

## 8. What to protect first

If you can only do five things, do these:

1. Domain secured with 2FA and multi-year renewal.
2. Backups running and tested.
3. IDs random, permanent, and pre-generated.
4. Chips locked after writing.
5. A written edit and refund policy.
