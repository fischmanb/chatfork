export interface User {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  conversation_id: string;
  name: string;
  parent_branch_id: string | null;
  forked_from_message_id: string | null;
  created_by: string;
  created_at: string;
  color: string | null;
  is_active: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  branch_id: string;
  parent_message_id: string | null;
  content: string;
  role: 'user' | 'assistant' | 'system';
  model: string | null;
  tokens_used: number | null;
  created_at: string;
  created_by: string | null;
}

export interface UserSession {
  token: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  encrypted_api_key: string | null;
  api_key_iv: string | null;
  default_model: string;
  theme: string;
  updated_at: string;
}
