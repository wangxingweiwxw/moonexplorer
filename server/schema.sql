CREATE TABLE IF NOT EXISTS oauth_pending (
  browser_hash TEXT PRIMARY KEY, state_hash TEXT NOT NULL, expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  csrf TEXT NOT NULL, expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires);
CREATE TABLE IF NOT EXISTS saves (
  user_id TEXT NOT NULL, slot TEXT NOT NULL, data TEXT NOT NULL,
  revision INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, slot)
);
CREATE TABLE IF NOT EXISTS login_limits (
  bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL
);
