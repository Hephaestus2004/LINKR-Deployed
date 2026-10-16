-- migrations/0002_seed.sql
-- Sample test profiles for local development and verification

INSERT OR IGNORE INTO profiles (id, seq, status, tier, template, data)
VALUES (
  'demo1234',
  1,
  'active',
  'full',
  'clean-white',
  '{"schema":1,"template":"clean-white","name":"Alex Example","company":"Studio Co.","title":"Photographer","bio":"Weddings and events in Metro Manila.","location":"Makati, PH","links":[{"type":"phone","value":"0917 123 4567"},{"type":"email","value":"alex@example.com"},{"type":"instagram","value":"instagram.com/alex"},{"type":"custom","label":"Portfolio","value":"https://example.com"}]}'
);

INSERT OR IGNORE INTO profiles (id, seq, status, tier, template, data)
VALUES (
  'glass999',
  2,
  'active',
  'full',
  'glass-dark',
  '{"schema":1,"template":"glass-dark","name":"Marcus Vance","company":"Nexus Tech PH","title":"Lead Systems Architect","bio":"High-concurrency distributed systems and edge networking.","location":"BGC, Taguig","links":[{"type":"phone","value":"0918 888 7777"},{"type":"email","value":"marcus@nexus.ph"},{"type":"github","value":"github.com/marcusvance"},{"type":"linkedin","value":"linkedin.com/in/marcusvance"}]}'
);

INSERT OR IGNORE INTO profiles (id, seq, status, tier, template, data)
VALUES (
  'stock001',
  3,
  'unassigned',
  'full',
  'clean-white',
  '{}'
);
