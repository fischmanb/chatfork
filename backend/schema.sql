-- Use ISO 8601 UTC timestamps throughout
-- SQLite: datetime('now') returns UTC when used with 'Z' suffix

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  api_key_encrypted TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  parent_branch_id TEXT,
  forked_from_message_id TEXT,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  branch_id TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_message_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Trigger to auto-update updated_at on conversations
CREATE TRIGGER IF NOT EXISTS update_conversations_updated_at
AFTER UPDATE ON conversations
BEGIN
  UPDATE conversations SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger to auto-update updated_at on user_settings
CREATE TRIGGER IF NOT EXISTS update_user_settings_updated_at
AFTER UPDATE ON user_settings
BEGIN
  UPDATE user_settings SET updated_at = datetime('now') WHERE user_id = NEW.user_id;
END;
