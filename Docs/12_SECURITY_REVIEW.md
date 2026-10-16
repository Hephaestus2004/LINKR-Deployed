# LINKR security review

**Review date:** 17 October 2026
**Scope:** Repository review of the application code, configuration, and operational backup implementation. Cloudflare account settings, live traffic, and deployed Access/WAF policies were not independently inspected. Findings describe risks visible in this checkout; confirm them against the deployed revision before making production changes.

## Findings

### High — Claim codes are optional for records, allowing card claims without proof of possession

The public claim handler checks a submitted code only when a database row already has a `claim_hash`. If the field is empty, any non-empty code passes. The batch generator creates unassigned profile rows without claim hashes, so stock created through this endpoint is exposed to this bypass. The claim and profile update also are not guarded by a conditional status update, leaving room for simultaneous claim requests to race.

Evidence: [claim handler](../functions/api/claim.ts), [batch generator](../functions/api/admin/batches.ts), and the [`claim_hash` schema](../Docs/03_DATA_SCHEMA.md).

**Recommended fix:** Generate and store a high-entropy claim-code hash for every claimable card; reject rows that lack one. Claim through an atomic conditional update/transaction so only one request can change an unassigned card. Add attempt limits and bot protection at the edge, then review and rotate claim codes for any stock already created without hashes.

### High — Untrusted profile values reach HTML interpolation

Profile `location` is inserted into `innerHTML` in the `glass-dark` and `luxury-gold` renderers. The profile validator checks the location's length but does not encode or reject HTML. A claimed profile can therefore carry markup that executes when its public profile is rendered. The admin profile table also interpolates values into HTML; its current list endpoint limits those fields, but the same pattern is unsafe as fields or data sources change.

Evidence: [profile validation](../functions/_lib/validate.ts), [glass-dark renderer](../public/t/glass-dark/render.js), [luxury-gold renderer](../public/t/luxury-gold/render.js), and [admin UI rendering](../public/admin/app.js).

**Recommended fix:** Render user-controlled text with `textContent` and create elements through DOM APIs. Restrict templates and URL schemes to explicit allowlists, validate each profile field server-side, and review the Content Security Policy after removing unsafe HTML sinks.

### Medium — Public form endpoints have no visible application-level abuse controls

The claim and edit-request handlers accept JSON requests and write to D1 without visible request-size caps, per-client limits, or Turnstile verification. Cloudflare WAF rules may add protection, but those account-level settings were outside this repository review. Repeated requests can drive unwanted profile claims or fill the edit-request table.

Evidence: [claim handler](../functions/api/claim.ts), [edit-request handler](../functions/api/edit-request.ts), and the intended edge controls described in [architecture](../Docs/02_ARCHITECTURE.md).

**Recommended fix:** Configure and verify Cloudflare rate limits and Turnstile for public write endpoints. Also enforce request-body and field-size limits in the handlers, return consistent errors, and alert on unusual write volume.

### Medium — Public profile cache can retain outdated content

Public profile responses use `max-age=300` with `stale-while-revalidate=86400`. This can serve old profile data for up to a day while revalidation happens, depending on the cache serving the response. The architecture document expects purge-on-edit, but a purge failure can leave cached content visible after a profile change or suspension.

Evidence: [cache headers and helpers](../functions/_lib/cache.ts) and the purge expectations in [architecture](../Docs/02_ARCHITECTURE.md).

**Recommended fix:** Verify that every profile mutation purges all relevant cache keys and that purge failures are logged and retried. Consider reducing or removing `stale-while-revalidate` for changes that must take effect promptly.

### Medium — Backup recovery and separation are not demonstrated by code

The scheduled worker writes a compressed JSON snapshot to R2 and prunes backups after 90 days. This checkout does not include a restore procedure or an automated restore verification. The production and backup configurations point to the same R2 bucket (`linkr-assets`), so deletion or account-level access problems could affect both application media and backups.

Evidence: [backup worker](../workers/backup.ts), [backup configuration](../wrangler.backup.toml), and [production configuration](../wrangler.toml).

**Recommended fix:** Document and periodically rehearse restoring D1 from a backup. Keep a protected copy in a separate account or provider, alert on failed/missing scheduled backups, and test that snapshots can be parsed and imported.

### Needs operational verification — Admin protection depends on Cloudflare Access

Admin API comments say the routes are behind Cloudflare Access; the application code itself does not provide a separate admin login. This can be a sound setup when Access policies cover both the admin UI and every `/api/admin/*` route, but repository files cannot prove the live policy is complete or still enabled.

Evidence: [admin profile API](../functions/api/admin/profiles.ts) and the deployment’s [Wrangler configuration](../wrangler.toml).

**Recommended check:** In Cloudflare Zero Trust, verify that the application policy covers the custom domain and the Pages hostname, including all admin API paths, allows only the intended identity, and denies unauthenticated requests. Confirm this with a private browser session.

## Suggested order

1. Close the claim-code bypass and review existing unassigned records.
2. Remove unsafe HTML interpolation for user-controlled profile fields.
3. Verify Access protection and add abuse controls to public writes.
4. Test cache invalidation and complete a backup restore drill.

## Review limits

This document is a source-code review, not a penetration test. It does not establish whether a suspected path is exploitable in the current live deployment, whether Cloudflare account rules mitigate it, or whether production data has been affected. Re-review the deployed commit and account policies before treating a finding as closed.
