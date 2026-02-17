/**
 * ChatFork Type Definitions
 * 
 * All timestamps use ISO 8601 format in UTC (e.g., "2024-01-15T10:30:00.000Z")
 * SQLite datetime('now') returns UTC timestamps
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  conversation_id: string;
  name: string;
  parent_branch_id: string | null;
  forked_from_message_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  branch_id: string | null;
  role: 'user' | 'assistant';
  content: string;
  parent_message_id: string | null;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  api_key_encrypted: string | null;
  created_at: string;
  updated_at: string;
}
