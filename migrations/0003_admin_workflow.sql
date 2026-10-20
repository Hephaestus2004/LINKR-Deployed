-- Private admin task board. Reseller/profile data uses the existing retailers and profiles tables.
CREATE TABLE IF NOT EXISTS admin_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL CHECK (category IN ('system', 'printing', 'add_client')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  reseller_id INTEGER REFERENCES retailers(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT '',
  package TEXT NOT NULL DEFAULT '',
  client_names TEXT NOT NULL DEFAULT '[]',
  deadline TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  parent_task_id INTEGER REFERENCES admin_tasks(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_deadline ON admin_tasks(deadline, completed);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_category ON admin_tasks(category, created_at);
