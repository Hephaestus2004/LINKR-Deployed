# 06. Operations SOP

Standard operating procedures so the business doesn't depend on one person's memory. Update this file whenever a process changes.

## 1. Daily production cycle

| Time (example) | Step |
| --- | --- |
| Morning | Review overnight orders, retailer submissions, and open edit requests |
| Late morning | Assign IDs to orders, complete or validate profiles in admin |
| **Cutoff (example 2:00 PM)** | Close the day's sticker design list and send the print sheet to the printer |
| Afternoon | Encode and lock chips, QA finished units, pack |
| End of day | Update the production log, count defects, check backups and uptime alerts |

Publish the cutoff to customers and retailers. Orders after the cutoff go into the next day's batch.

## 2. Pre-generated stock

1. Generate a batch of IDs (for example 500) with `tools/id_generate.py`. Insert them into D1 as `unassigned`, tagged with a `batch_id`.
2. Export the batch as CSV: `id, url`.
3. From the CSV:
   - Generate QR images for the batch.
   - Print QR stickers (`redirect` tier stock) or send to the printer.
   - Encode chips with the matching URLs (`direct` tier writes the customer's social URL instead, see 5.4).
4. Store stock by batch in labeled bins. Never mix batches.
5. Size batches to about 7 to 14 days of sales (cash and error-risk balance).

## 3. QR code specification

Your Python generator should take an ID list and output files named by ID.

| Parameter | Recommendation |
| --- | --- |
| Data | `https://<domain>/u/<id>` only. No tracking parameters |
| Error correction | Level **H** (about 30% recovery), required because the logo covers the center |
| Logo size | No more than about 20% of the QR width. Test every new design |
| Quiet zone | At least 4 modules of blank border |
| Printed size | At least 2 x 2 cm. Larger is more reliable |
| Contrast | Dark modules on a light background. Avoid colored or low-contrast modules |
| Output | PNG at high resolution and SVG if possible |
| Naming | `<id>.png` |

Test before each print run:

- Scan sample QR codes with at least one iPhone and two Android phones, including a cheap one.
- Scan under bright light on the glossy laminate. Glare can break scans. Request matte lamination if glare is a problem.
- Verify the opened URL matches the ID on the sticker.

Short URLs make cleaner, less dense QR codes. This is another reason to keep the domain short.

## 4. NFC chip specification

| Item | Recommendation |
| --- | --- |
| Chip type | NTAG213 is the common low-cost option (about 144 bytes of user memory). NTAG215 or NTAG216 if you want more room |
| Data | One NDEF URI record with the profile URL |
| Locking | **Write-lock after encoding.** Locking is permanent. Verify the URL before locking |
| Password protection | NTAG21x chips support write password protection. Consider it if you want chips reprogrammable only by you (verify tooling) |
| Batch encoding | Use a batch tool or pre-encoded chips from your supplier with the URL list you provide |
| Metal | Metal surfaces and metal phone cases interfere. Add this to the customer FAQ |
| Cover | The plastic cover also protects the chip face |

Procedure:

1. Encode from the batch CSV, not by typing URLs.
2. Read back and compare the URL to the expected ID.
3. Lock.
4. Tap-test on an iPhone and an Android phone.
5. Mark failures and log them.

## 5. Procedure by tier

### 5.1 `redirect` tier (P200)

1. Take a pre-printed QR sticker and pre-encoded chip from the same batch, matching IDs. (Keep stickers and chips from one batch together.)
2. Assign the ID to the order in admin.
3. Set `tier = redirect`, `redirect_url = <customer's social URL>`, `status = active`.
4. Apply the QR sticker to the card.
5. QA (section 7). Pack.

### 5.2 `full` tier (P300)

1. Assign an ID from stock.
2. Collect customer data through the **intake form** (name, title, company, photo, logo, each link as its own field, template choice).
3. Create the profile in admin. Check the live preview against the chosen template.
4. Generate the sticker design from the template with the profile data and QR.
5. Add to the day's print sheet before cutoff.
6. After printing, apply the sticker, encode and lock chip, QA, pack.

### 5.3 Retailer orders

1. Retailer submits orders through the retailer form (not Messenger), including `retailer` code.
2. Treat each client as a normal `full` or `redirect` order with `retailer_id` set.
3. Invoice weekly or per agreement.
4. Defects: replace per policy after photo proof.

### 5.4 `direct` tier (P150)

1. Write the customer's social URL straight to the chip. No platform dependency.
2. Lock after verifying.
3. QA and pack.

Whether to keep `direct` as is or move it onto the platform is decision D-006 in `09`.

## 6. Intake form fields

Use a form (Google Form at first, your own page later). One field per item, no free text for links.

- Order number and contact (for later edits)
- Name, title, company
- Profile photo and logo upload (or "none")
- Phone, email, website, Facebook, Messenger, Instagram, TikTok, YouTube, LinkedIn, WhatsApp, Viber, Telegram, location, up to the tier cap
- Custom link label plus URL
- Template choice and color preference
- Consent checkbox (`08`)

## 7. QA checklist (every unit)

- [ ] Chip tapped on iPhone: correct page opens
- [ ] Chip tapped on Android: correct page opens
- [ ] QR scanned: same page opens
- [ ] URL ID matches the sticker and order
- [ ] Name, title, and logo are correct and spelled right
- [ ] Every link on the profile opens the right destination
- [ ] Save contact works
- [ ] Sticker aligned, no bubbles, no scratches
- [ ] Cover and card clean
- [ ] Packed with correct order label

Log failures with cause: chip, sticker, encoding, profile data, packing. Review the defect log weekly.

## 8. Edit request procedure

1. Customer or retailer submits the edit form with order number and original contact.
2. Verify identity against the order record.
3. Apply the edit policy (free window, paid edits, or `redirect_url` change fee).
4. Edit in admin. A version row is saved automatically.
5. Check the public page. Confirm to the customer.
6. If the change is wrong, roll back by copying the previous `profile_versions` row.

Target turnaround: under 24 hours.

## 9. Suspension procedure

| Trigger | Action |
| --- | --- |
| Report of scam, adult, hate, or illegal content | Suspend immediately in admin. Review afterward |
| Chargeback or fraud on the order | Suspend while investigating |
| Customer request | Archive (do not delete) |

Steps:

1. Set `status = suspended`. Purge cache.
2. Record the reason and the reporter.
3. Notify the customer if appropriate.
4. Reinstate only after review, and log it.

## 10. Backup and restore

| Task | Frequency |
| --- | --- |
| Export D1 to R2 (cron) | Weekly at minimum, daily once volume grows |
| Copy backups to a second location outside Cloudflare | Weekly |
| Check D1 Time Travel retention (verify current retention) | Once, then after plan changes |
| **Restore drill** into the staging database | Quarterly |
| Verify R2 images are also backed up | Monthly |

A backup that was never restored is not yet a backup.

## 11. Domain and account security

- Buy the domain for 5 to 10 years. Turn on auto-renew. Keep a payment card that will not expire.
- Use a registrar account with 2FA (hardware key if possible) and recovery codes stored offline.
- Put the domain's DNS on Cloudflare with 2FA on the Cloudflare account.
- Consider also registering common typo domains and the `.ph` version (D-001).
- Give a trusted second person recovery access instructions in a sealed or secured document.
- Calendar reminders: 90 and 30 days before renewal, even with auto-renew.
- Never print a temporary URL (`pages.dev`, `vercel.app`) on any physical product.

## 12. Incident runbook

| Incident | First actions |
| --- | --- |
| Profile pages down | Check Cloudflare status, `/healthz`, last deploy. Roll back the last deploy. Check D1 limits |
| Wrong data on a profile | Roll back from `profile_versions`, purge cache, tell the customer |
| Abuse report | Suspend first (section 9) |
| Domain or DNS problem | Highest priority. Contact registrar and Cloudflare. Post status on your social page |
| Suspected breach | Rotate secrets and Access policies, check logs, assess what personal data is exposed, follow `08` breach steps |
| Backup failure alert | Rerun export now. Investigate cause the same day |
| Bad print batch | Quarantine the batch, notify the printer, reprint, log cost |

## 13. Support macros

Keep short pre-written replies for the questions you will get daily:

- "How do I change my link?" (edit policy and form link)
- "My card isn't tapping." (phone NFC on, remove thick case, metal interference, try QR)
- "How long until my order ships?" (cutoff and lead times)
- "Can I add more links?" (tier cap and upgrade price)
- "Can I change my photo or template?" (edit policy)
- "How do I report a profile?" (report link)

## 14. Records to keep

- Daily production log (units by tier, defects, time)
- Order and invoice records
- Supplier lead times and prices
- Retailer agreements and price lists
- Incident log
- Backup log and restore-drill results
