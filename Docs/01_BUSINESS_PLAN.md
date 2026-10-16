# 01. Business Plan

## 1. Summary

LINKR sells NFC business cards that open a digital contact profile. A tap or QR scan opens the buyer's links, contact details, and a one-tap "Save contact". Customers are freelancers, small businesses, sales and real estate agents, organizations, and event teams. Distribution is direct and through retailers who buy at wholesale and mark up.

The hardware (an NFC card) is a commodity. The defensible part is the platform behind it: templates, editable profiles, a stable short domain, analytics, and a retailer network that depends on it. The plan is to move revenue and effort from "sell a card" toward "run the profile system".

## 2. Problem and solution

| Customer problem | LINKR solution |
| --- | --- |
| Paper cards get lost, can't be updated, and don't link to social media | One tap opens current links and contacts |
| Linktree-style tools need setup and a subscription | We build and set it up for them, one-time price |
| Most buyers have little design skill or content | Ready templates plus a done-for-you sticker and profile design |
| Resellers want a product with a good margin | Wholesale pricing, ready designs, and a profile platform they don't have to build |

## 3. Products and unit economics

All costs are your figures. "Leakage" below means costs not yet counted (payment fees, delivery, defects, reprints).

| Tier | Internal code | Price | Contents | COGS | Gross margin | Margin % |
| --- | --- | --- | --- | --- | --- | --- |
| Plain black NFC, direct social URL | `direct` | P150 | Card, cover, URL written to chip | P20 (10 card + 5 cover + 5 materials) | P130 | 87% |
| Plain black NFC + QR sticker | `redirect` | P200 | Above + QR sticker, redirects to one social link | P25 (+5 sticker) | P175 | 88% |
| Full sticker NFC, custom design | `full` | P300 (supplier price) | Custom sticker design, QR, full profile page | P70 (+50 laminated sticker) | P230 | 77% |

Observations:

- Margins are strong at every tier. The real cost is **labor time**, not materials (see `04`).
- The `redirect` tier used to need a blank website per client. In the new system it is one database row, so its effective margin improves.
- The `direct` tier writes a social URL straight onto the chip. It has zero ongoing cost and zero dependency on our domain, but we can't track it, change it, or upsell it. See decision D-006 in `09`.
- Retailer markups mean the end customer may pay far more than P300. That margin belongs to the retailer. Your leverage is that the profile lives on your platform.
- With demand this strong, **test a price increase** of P20 to P50 on one tier for two weeks and compare conversion.

## 4. Revenue model

| Stream | Type | Notes | Status |
| --- | --- | --- | --- |
| Card sales (3 tiers) | One-time | Core | Live |
| Wholesale to retailers | One-time | Core | Live |
| Link-change / profile edit fee | Per edit | Suggested starting price P30 to P50 after a free window (test) | New |
| Premium templates | One-time upsell | Extra template packs or custom colors | New |
| Vanity URL (`linkr.xx/janedoe`) | One-time or yearly | Short custom handle | New |
| Scan analytics add-on | Yearly | Scan counts, trend, top links | New |
| Team / corporate packs | Bulk | 10 to 100 cards, shared brand, one invoice | New, large potential |
| Annual "keep-alive" renewal | Recurring | Optional. Only if you decide to move beyond lifetime (D-007) | Decide |

Price points in this table are starting hypotheses to test, not facts.

## 5. Customers and segments

| Segment | Why they buy | Best tier | Template need |
| --- | --- | --- | --- |
| Freelancers, creators | Fast link to socials/portfolio | `direct` or `redirect` | Clean, photo-forward |
| Small business owners | Contact, socials, location, shop links | `full` | Logo-forward, many links |
| Sales and real estate agents | Phone, messaging, save contact | `full` | Photo, quick-action buttons |
| Restaurants, salons, shops | Menu, booking, maps | `full` | Logo-only mode |
| Organizations, schools, events | Many members, consistent brand | Team pack | Shared theme per org |
| Corporate gifting (Q4 peak) | Gift or client giveaway | Team pack | Logo-only or branded |
| Retailers | Resell for profit | Wholesale `full` | Their client's design |

## 6. Channels and go-to-market

1. **Retail network (existing).** Formalize with a simple retailer agreement, a retailer code on every profile, and a wholesale price list with volume tiers.
2. **Direct online.** Facebook page and Messenger, Shopee/Lazada listings, TikTok demo videos (tap a card on a phone is a great visual).
3. **B2B outreach.** Real estate offices, clinics, salons, co-working spaces, events, school organizations. Lead with team packs.
4. **Demo kit.** A few sample cards for each template, a QR-only demo card, and a short live demo page. A working demo converts better than a photo.
5. **Referral.** A small credit or discount for each referred order, tracked via a retailer/referral code on the profile.

## 7. Operations summary

Detailed in `06_OPERATIONS_SOP.md`. Key points:

- Pre-generate ID batches. Print QR stickers and write chips before orders exist.
- Intake through a structured form, not free text over Messenger.
- Daily sticker print cutoff so the outsourced printer works in batches.
- Every unit is tap-tested on iOS and Android before packing.
- Chips are write-locked after encoding.

## 8. Finance

### 8.1 Illustrative mix and per-unit result

Assumed mix for illustration only: 40% `direct`, 30% `redirect`, 30% `full`, at the prices above.

| Item | Per unit |
| --- | --- |
| Average price | P210 |
| Average COGS | P36.50 |
| Contribution before leakage | P173.50 |
| Leakage allowance (10% of revenue, estimate) | P21 |
| Contribution after leakage | about P152 |

### 8.2 Scenarios (units per day, 30-day month)

| Units/day | Revenue/day | Contribution/day (after leakage) | Contribution/month |
| --- | --- | --- | --- |
| 10 | P2,100 | P1,525 | P45,750 |
| 50 | P10,500 | P7,625 | P228,750 |
| 200 | P42,000 | P30,500 | P915,000 |
| 1,000 | P210,000 | P152,500 | P4,575,000 |

These exclude your time, wages, rent, income tax, and percentage tax/VAT. Replace the mix with your real sales mix. If the P300 tier is sold at wholesale, revenue per unit is as shown. If retailers pay less per unit at volume, update.

### 8.3 Fixed platform costs (approximate)

| Item | Approx. cost |
| --- | --- |
| Cloudflare Workers Paid plan (covers D1, Functions) | US$5/month, about P300 (verify) |
| Domain | Roughly US$10 to 15/year for `.com`; `.ph` costs more (verify) |
| R2 storage for images | Near zero at your scale |
| Total infrastructure | Under 1% of revenue at 200 units/day |

Software cost is not your problem. Labor, cash flow, and quality are.

### 8.4 Working capital

- You buy chips and stickers ahead of sales. Pre-generated batches tie up cash. Size batches to roughly 7 to 14 days of sales.
- Track lead times for card stock and for the outsourced sticker printer. Keep a safety buffer of cards and cover stock.
- Keep a separate business bank/e-wallet account from day one. Pay yourself a fixed salary.

## 9. Retailer program

| Element | Recommendation |
| --- | --- |
| Pricing | Published wholesale price list. Volume tiers (for example 10+, 50+, 100+) |
| Intake | Retailer submits client info through the retailer form, not Messenger |
| Identity | Retailer code on every profile (`retailer_id`) |
| Design | Retailer uses your templates. Custom design is a paid extra |
| Quality | Defect and reprint policy in writing (replace within X days, photo proof) |
| Restrictions | No resale of LINKR templates as their own product. No illegal or deceptive profiles |
| Dependency | Their customers' profiles live on your domain. You hold the platform |
| Concentration | Keep any single retailer under about 40% of revenue |

## 10. Brand, trademark, and naming

- Check "LINKR" availability with the Intellectual Property Office of the Philippines (IPOPHL) and online before building more brand equity. "Linkr" is a common name, so check for conflicts in your class of goods (verify with a lawyer).
- Move the public landing page from `linkr-tap-connect.vercel.app` to your own domain.

## 11. Risks

See `05_STRENGTHS_AND_PITFALLS.md` for the full register. The big three are: labor bottleneck, domain and platform dependency, and retailer dependence.

## 12. Milestones

See `04_TARGETS_AND_TRAJECTORY.md` and `07_ROADMAP.md`.
