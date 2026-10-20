CREATE TABLE IF NOT EXISTS client_request_publications (
  req_uid TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL UNIQUE REFERENCES profiles(id),
  approval_hash TEXT NOT NULL,
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);
