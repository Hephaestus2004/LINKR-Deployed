CREATE TABLE IF NOT EXISTS portal_invites (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  session_hash TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'submitted', 'expired', 'revoked')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_portal_invites_expiry ON portal_invites(expires_at, status);

CREATE TABLE IF NOT EXISTS portal_requests (
  req_uid TEXT PRIMARY KEY,
  invite_id TEXT NOT NULL UNIQUE REFERENCES portal_invites(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published', 'expired')),
  approved_snapshot TEXT,
  approved_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  approved_at TEXT,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_portal_requests_status ON portal_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_portal_requests_expiry ON portal_requests(expires_at, status);
