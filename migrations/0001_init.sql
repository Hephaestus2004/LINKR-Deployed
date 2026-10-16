-- migrations/0001_init.sql
-- LINKR Core D1 Schema as defined in 03_DATA_SCHEMA.md

CREATE TABLE IF NOT EXISTS retailers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  contact    TEXT,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
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

CREATE TABLE IF NOT EXISTS batches (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  label       TEXT NOT NULL,
  size        INTEGER NOT NULL,
  printed_at  TEXT,
  encoded_at  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
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

CREATE INDEX IF NOT EXISTS idx_profiles_status   ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_order    ON profiles(order_id);
CREATE INDEX IF NOT EXISTS idx_profiles_retailer ON profiles(retailer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_batch    ON profiles(batch_id);

CREATE TABLE IF NOT EXISTS profile_versions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id  TEXT NOT NULL REFERENCES profiles(id),
  version     INTEGER NOT NULL,
  data        TEXT NOT NULL,
  changed_by  TEXT,                               -- admin user or 'customer-claim'
  reason      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (profile_id, version)
);

CREATE TABLE IF NOT EXISTS edit_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id  TEXT NOT NULL REFERENCES profiles(id),
  payload     TEXT NOT NULL,                      -- requested changes as JSON
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','applied','rejected')),
  fee         INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS slugs (
  slug        TEXT PRIMARY KEY,
  profile_id  TEXT NOT NULL REFERENCES profiles(id)
);

-- Daily rollup table for scans (when Analytics Engine is not used)
CREATE TABLE IF NOT EXISTS scan_daily (
  profile_id TEXT NOT NULL,
  day        TEXT NOT NULL,                       -- YYYY-MM-DD
  count      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (profile_id, day)
) WITHOUT ROWID;
