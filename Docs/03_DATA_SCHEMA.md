# 03. Data Schema

This is the contract between data, admin, API, and templates. **Lock it early.** Templates read it. They never extend it on their own.

## 1. Profile object (v1)

Stored as JSON in `profiles.data`. `client.txt` (section 3) is an import/export format for this object, not the storage format.

```json
{
  "schema": 1,
  "template": "clean-white",
  "profile_mode": "standard",
  "name": "Alex Example",
  "company": "Example Studio",
  "title": "Photographer",
  "title_link": "https://example.com",
  "bio": "Weddings and events in Metro Manila.",
  "location": "Makati, PH",
  "photo": "r2:photos/k7x2mq.webp",
  "company_logo": "r2:logos/k7x2mq.webp",
  "show": { "name": true, "title": true, "bio": true, "photo": true, "company_logo": true },
  "theme": { "mode": "light", "accent": "#2f6fed" },
  "links": [
    { "type": "phone",     "value": "0917 123 4567" },
    { "type": "email",     "value": "hello@example.com" },
    { "type": "facebook",  "value": "facebook.com/alexexample" },
    { "type": "custom",    "label": "Shop on Shopee", "value": "https://shopee.ph/..." }
  ],
  "redirect_url": null
}
```

### 1.1 Field rules

| Field | Required | Limit | Notes |
| --- | --- | --- | --- |
| `schema` | yes | integer | Schema version for future migrations |
| `template` | yes | must exist in manifest list | Default `clean-white` |
| `profile_mode` | no | `standard` or `logo_only` | Default `standard` |
| `name` | see rule below | 60 chars | |
| `company_logo` | see rule below | image <= 200 KB | |
| `company` | no | 80 chars | Accessibility label, title, vCard. Not shown as separate text |
| `title` | no | 80 chars | |
| `title_link` | no | valid https URL | Applies to title and logo link |
| `bio` | no | 300 chars | |
| `location` | no | 120 chars | Becomes a Maps link |
| `photo` | no | image <= 300 KB after resize | Initials avatar if missing |
| `show.*` | no | boolean | Default true |
| `theme.mode` | no | `light` or `dark` | |
| `theme.accent` and other colors | no | valid CSS color | Invalid values ignored and reported by admin |
| `links` | yes, at least 1 | tier cap, hard max 15 | Ordered. Order is display order |
| `redirect_url` | only for `redirect` tier | valid https URL | The one destination |

**Minimum viable profile:** `name` OR `company_logo`, **and** at least one link (or `redirect_url` for the `redirect` tier). Admin blocks saving otherwise.

### 1.2 Link types

| Type | Value format | Generated URL |
| --- | --- | --- |
| `phone` | digits, spaces, `+` | `tel:` |
| `email` | email address | `mailto:` |
| `website`, `facebook`, `instagram`, `tiktok`, `youtube`, `linkedin`, `github`, `messenger` | URL or handle | `https://` prefixed if missing |
| `whatsapp` | number or URL | `https://wa.me/<digits>` (PH `0` becomes `63`) |
| `telegram` | handle or URL | `https://t.me/<handle>` |
| `viber` | number | `viber://chat?number=%2B<digits>` |
| `location` | address text | Google Maps search URL |
| `custom` | `label` plus `value` URL | Generic link icon. Label chosen by client |

### 1.3 Priority order for quick actions

When a template shows a limited number of quick actions, fill by this order, using only types that exist:

`phone, email, messenger, facebook, whatsapp, viber, telegram, instagram, website, linkedin, tiktok, youtube, github, custom...`

Each template's manifest sets `max_quick_actions`. The remaining links go to the full list.

### 1.4 Tier caps

| Tier | Link cap (suggested) | Extra links |
| --- | --- | --- |
| `direct` | n/a (no profile) | n/a |
| `redirect` | 1 destination | Upgrade to `full` |
| `full` | 6 | P20 each, hard max 15 |

## 2. Template manifest

`public/t/<name>/manifest.json`:

```json
{
  "id": "glass-dark",
  "label": "Glass Dark",
  "max_quick_actions": 4,
  "supports_photo": true,
  "supports_logo_only": true,
  "supports_bio": true,
  "best_with": ["photo", "logo"],
  "preview": "preview.webp"
}
```

Admin reads manifests to show a template picker with live preview, and to warn: "This template works best with a photo."

## 3. `client.txt` v2 (import/export)

Backward compatible with your current files. The parser rules do not change:

- One `key: value` per line. First colon splits key and value.
- Blank lines and `#` lines ignored. Keys lowercased.
- A final ` | Label` suffix becomes the display label.

New and changed keys:

| Key | Meaning |
| --- | --- |
| `template` | Template id (new) |
| `redirect_url` | Destination for `redirect` tier (new) |
| `link_1`, `link_2`, ... | Custom links: `link_1: Shop on Shopee | https://shopee.ph/...` (new) |
| `retailer` | Retailer code (admin-only, stripped from public output) |
| `order` | Order id (admin-only, stripped from public output) |

Admin-only keys never appear in the public JSON. **Unknown keys are reported as warnings on import** (this fixes the "spelling mistakes are easy to miss" problem).

## 4. ID specification

| Rule | Value |
| --- | --- |
| Public ID | 8 random characters from Crockford Base32 (`0-9 A-Z` without `I L O U`), lowercase in URLs |
| Entropy | 32^8 is about 1.1 x 10^12 possible IDs |
| Internal number | `seq`, sequential integer, never shown publicly |
| Uniqueness | Database unique constraint. Generator retries on collision |
| Permanence | An ID is never reused, reassigned, or deleted. Retire with `archived` |
| Meaning | No meaning encoded (no retailer, date, or tier in the ID) |
| Optional check char | A 9th character as a checksum catches mistyped IDs. Optional |
| Case | Treat as case-insensitive. Store lowercase |

Why 8 and not 6: with 100,000 profiles, a 6-character space (about 1 billion) is guessable at scale. Eight characters make random enumeration impractical, combined with rate limiting.

URL example: `https://<domain>/u/k7x2m9qa`. Keep the whole URL short: it must fit on a small NFC chip and it makes a cleaner, less dense QR code.

**Vanity slugs** (optional paid feature) are stored in a separate `slugs` table pointing to a profile ID, so they never replace the permanent ID.

## 5. Status lifecycle

```text
unassigned -> assigned -> active -> suspended
                              \-> archived
suspended -> active   (after review)
```

| Status | Public behavior |
| --- | --- |
| `unassigned` | "Claim this card" or "coming soon" page |
| `assigned` | Same as `unassigned` until profile is complete |
| `active` | Profile renders (or redirect fires) |
| `suspended` | Neutral "unavailable" page. Instant kill switch |
| `archived` | Neutral "no longer active" page |

## 6. D1 tables

```sql
-- migrations/0001_init.sql

CREATE TABLE retailers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  contact    TEXT,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE orders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer    TEXT,
  contact     TEXT,
  tier        TEXT NOT NULL CHECK (tier IN ('direct','redirect','full')),
  qty         INTEGER NOT NULL DEFAULT 1,
  retailer_id INTEGER REFERENCES retailers(id),
  paid        INTEGER NOT NULL DEFAULT 0,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE batches (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  label       TEXT NOT NULL,
  size        INTEGER NOT NULL,
  printed_at  TEXT,
  encoded_at  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE profiles (
  id            TEXT PRIMARY KEY,                 -- public 8-char code (lowercase)
  seq           INTEGER NOT NULL UNIQUE,          -- internal sequential number
  status        TEXT NOT NULL DEFAULT 'unassigned'
                CHECK (status IN ('unassigned','assigned','active','suspended','archived')),
  tier          TEXT CHECK (tier IN ('direct','redirect','full')),
  template      TEXT NOT NULL DEFAULT 'clean-white',
  data          TEXT NOT NULL DEFAULT '{}',       -- profile JSON (section 1)
  claim_hash    TEXT,                             -- hash of claim code, never the code itself
  order_id      INTEGER REFERENCES orders(id),
  retailer_id   INTEGER REFERENCES retailers(id),
  batch_id      INTEGER REFERENCES batches(id),
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  activated_at  TEXT
);
CREATE INDEX idx_profiles_status   ON profiles(status);
CREATE INDEX idx_profiles_order    ON profiles(order_id);
CREATE INDEX idx_profiles_retailer ON profiles(retailer_id);
CREATE INDEX idx_profiles_batch    ON profiles(batch_id);

CREATE TABLE profile_versions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id  TEXT NOT NULL REFERENCES profiles(id),
  version     INTEGER NOT NULL,
  data        TEXT NOT NULL,
  changed_by  TEXT,                               -- admin user or 'customer-claim'
  reason      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (profile_id, version)
);

CREATE TABLE edit_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id  TEXT NOT NULL REFERENCES profiles(id),
  payload     TEXT NOT NULL,                      -- requested changes as JSON
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','applied','rejected')),
  fee         INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE TABLE slugs (
  slug        TEXT PRIMARY KEY,
  profile_id  TEXT NOT NULL REFERENCES profiles(id)
);

-- Optional daily rollup if you do not use Analytics Engine:
CREATE TABLE scan_daily (
  profile_id TEXT NOT NULL,
  day        TEXT NOT NULL,                       -- YYYY-MM-DD
  count      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (profile_id, day)
) WITHOUT ROWID;
```

Notes:

- Do **not** put an index on a scan counter. Index writes cost extra rows written.
- `scan_daily` still costs one write per update. Batch increments (flush from memory or a queue every minute) or use Analytics Engine to avoid per-scan writes.
- Every edit writes a `profile_versions` row first, so rollback is a copy.

## 7. Validation (on save, not on render)

Admin and API reject or warn:

| Check | Action |
| --- | --- |
| No `name` and no `company_logo` | Block |
| No links | Block (unless `redirect_url` for redirect tier) |
| URL scheme not in allowlist | Block |
| Phone with fewer than 7 digits | Block |
| Email malformed | Block |
| Over a length limit | Block, show counter |
| Image over size limit | Auto-resize, then block if still too large |
| Invalid CSS color | Warn, fall back to default |
| Unknown key (import) | Warn |
| Empty photo or logo | Info: "will show initials" or "no logo" |
| Template does not match data (for example no photo with a photo-heavy template) | Warn |
| Too many links for tier | Warn and show upsell |

## 8. Test fixtures

Keep these in `fixtures/` and view every template against all of them before merging a change:

| Fixture | Purpose |
| --- | --- |
| `minimal.txt` | Name plus one link |
| `typical.txt` | Normal case |
| `maximal.txt` | Every field filled, 12+ links |
| `long-text.txt` | 60-character name, 300-character bio, long email |
| `no-photo-no-logo.txt` | Image fallbacks (initials) |
| `logo-only.txt` | Business-card mode |
| `redirect.txt` | Redirect tier |
| `rtl-or-emoji.txt` | Emoji and non-Latin names (Filipino names with ñ, emoji in bio) |

## 9. Rendering rules for optional data

| Case | Behavior |
| --- | --- |
| No photo | Initials avatar on accent color |
| No logo | Hide logo block, close the spacing |
| No title or bio | Collapse margins |
| 1 to 2 links | Centered `flex-wrap` or `auto-fit` grid, never fixed empty columns |
| Over `max_quick_actions` | Quick actions by priority order, rest in list, "Show more" past 8 |
| Broken image URL | `onerror` swaps to fallback |
| Share button | Always created, independent of any field (fixes the current `phone` dependency) |
| Long text | `overflow-wrap: anywhere`, line clamp, ellipsis |
