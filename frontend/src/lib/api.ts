// Chatfork API Client
// Supports both localStorage (offline) and backend (synced) modes

const API_URL = import.meta.env.VITE_API_URL || '';

// Check if backend is configured
const hasBackend = !!API_URL;

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  if (!hasBackend) {
    throw new Error('Backend not configured');
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  // Check if backend is available
  isConfigured: () => hasBackend,
  
  // Health check
  health: async () => {
    if (!hasBackend) return { status: 'local-only' };
    const res = await fetch(`${API_URL}/health`);
    return res.json();
  },
  
  auth: {
    login: (email: string, password: string) =>
      fetchWithAuth('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email: string, password: string, displayName?: string) =>
      fetchWithAuth('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
    logout: () => fetchWithAuth('/api/auth/logout', { method: 'POST' }),
    me: () => fetchWithAuth('/api/auth/me'),
  },
  
  conversations: {
    list: () => fetchWithAuth('/api/conversations'),
    create: (title: string) => fetchWithAuth('/api/conversations', { method: 'POST', body: JSON.stringify({ title }) }),
    get: (id: string) => fetchWithAuth(`/api/conversations/${id}`),
    update: (id: string, title: string) => fetchWithAuth(`/api/conversations/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
    delete: (id: string) => fetchWithAuth(`/api/conversations/${id}`, { method: 'DELETE' }),
  },
  
  branches: {
    list: (conversationId: string) => fetchWithAuth(`/api/branches/conversation/${conversationId}`),
    fork: (data: { conversationId: string; parentBranchId: string; forkedFromMessageId: string; name: string; color?: string }) =>
      fetchWithAuth('/api/branches', { method: 'POST', body: JSON.stringify(data) }),
    rename: (id: string, name: string) => fetchWithAuth(`/api/branches/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
    delete: (id: string) => fetchWithAuth(`/api/branches/${id}`, { method: 'DELETE' }),
  },
  
  messages: {
    list: (branchId: string) => fetchWithAuth(`/api/messages/branch/${branchId}`),
    send: (branchId: string, content: string) =>
      fetchWithAuth(`/api/messages/branch/${branchId}`, { method: 'POST', body: JSON.stringify({ content }) }),
    delete: (id: string) => fetchWithAuth(`/api/messages/${id}`, { method: 'DELETE' }),
  },
};
