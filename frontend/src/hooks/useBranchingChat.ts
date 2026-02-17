import { useState, useCallback, useEffect } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'https://chatfork-api.lively-block-6291.workers.dev').replace(/\/+$/, '');

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  branchId: string | null;
  parentMessageId: string | null;
  timestamp: string;
}

export interface Branch {
  id: string;
  name: string;
  parentBranchId: string | null;
  forkedFromMessageId: string | null;
  createdAt: string;
  messageCount?: number;
  lastActivity?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  messages: Message[];
  branches: Branch[];
  conversations: Conversation[];
  currentConversationId: string | null;
  currentBranchId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface UseBranchingChatReturn {
  state: ChatState;
  hasApiKey: boolean;
  isCheckingApiKey: boolean;
  apiKeyError: string | null;
  createNewConversation: (title?: string) => Promise<string | null>;
  renameConversation: (conversationId: string, title: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  deleteAllConversations: () => Promise<boolean>;
  loadConversations: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  sendUserMessage: (content: string) => Promise<{ conversationId: string | null; isFirstMessage: boolean }>;
  forkBranch: (messageId: string, branchName?: string) => Promise<string | null>;
  newThreadFromMessage: (messageId: string, threadName: string) => Promise<string | null>;
  switchBranch: (branchId: string) => void;
  setApiKey: (apiKey: string) => Promise<boolean>;
  checkApiKey: () => Promise<boolean>;
}

export function useBranchingChat(getToken: () => string | null): UseBranchingChatReturn {
  const [state, setState] = useState<ChatState>({
    messages: [],
    branches: [],
    conversations: [],
    currentConversationId: null,
    currentBranchId: null,
    isLoading: false,
    error: null,
  });
  
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const checkApiKey = useCallback(async (): Promise<boolean> => {
    const token = getToken();
    if (!token) {
      setIsCheckingApiKey(false);
      setHasApiKey(false);
      return false;
    }
    try {
      setIsCheckingApiKey(true);
      setApiKeyError(null);
      const response = await fetch(`${API_URL}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const hasKey = data.hasApiKey === true;
        setHasApiKey(hasKey);
        return hasKey;
      } else if (response.status === 401) {
        setHasApiKey(false);
        setApiKeyError('Session expired. Please sign in again.');
        return false;
      } else {
        setHasApiKey(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking API key:', error);
      setHasApiKey(false);
      return false;
    } finally {
      setIsCheckingApiKey(false);
    }
  }, [getToken]);

  useEffect(() => {
    const token = getToken();
    if (token) loadConversations();
  }, []);

  const setApiKey = useCallback(async (apiKey: string): Promise<boolean> => {
    const token = getToken();
    if (!token) {
      setApiKeyError('Not authenticated');
      return false;
    }
    try {
      setApiKeyError(null);
      const response = await fetch(`${API_URL}/settings/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ apiKey }),
      });
      if (response.ok) {
        setHasApiKey(true);
        return true;
      } else {
        const data = await response.json().catch(() => ({}));
        setApiKeyError(data.error || 'Failed to save API key');
        return false;
      }
    } catch (error) {
      console.error('Error setting API key:', error);
      setApiKeyError('Network error. Please try again.');
      return false;
    }
  }, [getToken]);

  const loadConversations = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/ai/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const conversations = data.conversations || [];
        setState(prev => ({ ...prev, conversations }));
        if (conversations.length > 0) {
          await loadConversation(conversations[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [getToken]);

  const renameConversation = useCallback(async (conversationId: string, title: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/ai/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });
      if (response.ok) {
        setState(prev => ({
          ...prev,
          conversations: prev.conversations.map(c => 
            c.id === conversationId ? { ...c, title } : c
          ),
        }));
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  }, [getToken]);

  const loadBranchMessages = useCallback(async (conversationId: string, branchId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/ai/conversations/${conversationId}/messages?branchId=${branchId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const messages: Message[] = (data.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          branchId: m.branch_id,
          parentMessageId: m.parent_message_id,
          timestamp: m.created_at,
        }));
        return messages;
      }
      return [];
    } catch (error) {
      console.error('Error loading branch messages:', error);
      return [];
    }
  }, [getToken]);

  const loadConversation = useCallback(async (conversationId: string) => {
    const token = getToken();
    if (!token) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const branchesRes = await fetch(`${API_URL}/ai/conversations/${conversationId}/branches`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        const branches: Branch[] = (branchesData.branches || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          parentBranchId: b.parent_branch_id,
          forkedFromMessageId: b.forked_from_message_id,
          createdAt: b.created_at,
          messageCount: b.message_count,
          lastActivity: b.last_activity,
        }));
        
        // Find main branch (no parent)
        const mainBranch = branches.find(b => !b.parentBranchId) || branches[0];
        
        // Load messages for main branch
        const messages = mainBranch ? await loadBranchMessages(conversationId, mainBranch.id) : [];
        
        setState(prev => ({
          ...prev,
          messages,
          branches,
          currentConversationId: conversationId,
          currentBranchId: mainBranch?.id || null,
          isLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false, error: 'Failed to load conversation' }));
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setState(prev => ({ ...prev, isLoading: false, error: 'Network error. Please try again.' }));
    }
  }, [getToken, loadBranchMessages]);

  const createNewConversation = useCallback(async (title?: string): Promise<string | null> => {
    const token = getToken();
    if (!token) return null;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`${API_URL}/ai/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title || 'New Conversation' }),
      });
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          messages: [],
          branches: [{
            id: data.branchId,
            name: 'Main',
            parentBranchId: null,
            forkedFromMessageId: null,
            createdAt: new Date().toISOString(),
          }],
          currentConversationId: data.conversationId,
          currentBranchId: data.branchId,
          isLoading: false,
        }));
        await loadConversations();
        return data.conversationId;
      } else {
        const errorData = await response.json().catch(() => ({}));
        setState(prev => ({ ...prev, isLoading: false, error: errorData.error || 'Failed to create conversation' }));
        return null;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      setState(prev => ({ ...prev, isLoading: false, error: 'Network error. Please try again.' }));
      return null;
    }
  }, [getToken, loadConversations]);

  const sendUserMessage = useCallback(async (content: string): Promise<{ conversationId: string | null; isFirstMessage: boolean }> => {
    const token = getToken();
    if (!token) {
      setState(prev => ({ ...prev, error: 'Not authenticated' }));
      return { conversationId: null, isFirstMessage: false };
    }

    let conversationId = state.currentConversationId;
    let branchId = state.currentBranchId;
    let isFirstMessage = false;

    // Create new conversation if none exists
    if (!conversationId) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const createRes = await fetch(`${API_URL}/ai/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ title: 'New Conversation' }),
        });
        if (createRes.ok) {
          const createData = await createRes.json();
          conversationId = createData.conversationId;
          branchId = createData.branchId;
          isFirstMessage = true;
          setState(prev => ({
            ...prev,
            branches: [{
              id: createData.branchId,
              name: 'Main',
              parentBranchId: null,
              forkedFromMessageId: null,
              createdAt: new Date().toISOString(),
            }],
            currentConversationId: conversationId,
            currentBranchId: branchId,
          }));
        } else {
          const errorData = await createRes.json().catch(() => ({}));
          setState(prev => ({ ...prev, isLoading: false, error: errorData.error || 'Failed to create conversation' }));
          return { conversationId: null, isFirstMessage: false };
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
        setState(prev => ({ ...prev, isLoading: false, error: 'Network error. Please try again.' }));
        return { conversationId: null, isFirstMessage: false };
      }
    }

    // Check if this is the first message in an existing conversation
    if (state.messages.length === 0) {
      isFirstMessage = true;
    }

    const userMessageId = crypto.randomUUID();
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content,
      branchId,
      parentMessageId: state.messages.length > 0 ? state.messages[state.messages.length - 1].id : null,
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [...state.messages, userMessage].map(m => ({ role: m.role, content: m.content, id: m.id })),
          conversationId,
          branchId,
          isFirstMessage, // Tell backend to auto-rename if this is the first message
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: data.messageId || crypto.randomUUID(),
          role: 'assistant',
          content: data.message?.content || '',
          branchId,
          parentMessageId: userMessageId,
          timestamp: new Date().toISOString(),
        };
        setState(prev => ({ ...prev, messages: [...prev.messages, assistantMessage], isLoading: false }));
        await loadConversations();
        return { conversationId, isFirstMessage };
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setHasApiKey(false);
          setApiKeyError(errorData.error || 'API key issue. Please check your settings.');
        }
        setState(prev => ({ ...prev, isLoading: false, error: errorData.error || `Error: ${response.status}` }));
        return { conversationId, isFirstMessage: false };
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setState(prev => ({ ...prev, isLoading: false, error: 'Network error. Please try again.' }));
      return { conversationId, isFirstMessage: false };
    }
  }, [getToken, state.currentConversationId, state.currentBranchId, state.messages, loadConversations]);

  const forkBranch = useCallback(async (messageId: string, branchName?: string): Promise<string | null> => {
    const token = getToken();
    if (!token || !state.currentConversationId) return null;
    try {
      const response = await fetch(`${API_URL}/ai/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: state.currentConversationId,
          parentMessageId: messageId,
          branchName: branchName || `Branch from message`,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const branchesRes = await fetch(`${API_URL}/ai/conversations/${state.currentConversationId}/branches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (branchesRes.ok) {
          const branchesData = await branchesRes.json();
          setState(prev => ({
            ...prev,
            branches: (branchesData.branches || []).map((b: any) => ({
              id: b.id,
              name: b.name,
              parentBranchId: b.parent_branch_id,
              forkedFromMessageId: b.forked_from_message_id,
              createdAt: b.created_at,
            })),
            currentBranchId: data.branchId,
          }));
        }
        return data.branchId;
      } else {
        const errorData = await response.json().catch(() => ({}));
        setState(prev => ({ ...prev, error: errorData.error || 'Failed to fork branch' }));
        return null;
      }
    } catch (error) {
      console.error('Error forking branch:', error);
      setState(prev => ({ ...prev, error: 'Network error. Please try again.' }));
      return null;
    }
  }, [getToken, state.currentConversationId]);

  // Create a new top-level thread from a message (no parent branch)
  const newThreadFromMessage = useCallback(async (messageId: string, threadName: string): Promise<string | null> => {
    const token = getToken();
    if (!token || !state.currentConversationId) return null;
    try {
      const response = await fetch(`${API_URL}/ai/thread`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: state.currentConversationId,
          fromMessageId: messageId,
          threadName: threadName,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const branchesRes = await fetch(`${API_URL}/ai/conversations/${state.currentConversationId}/branches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (branchesRes.ok) {
          const branchesData = await branchesRes.json();
          setState(prev => ({
            ...prev,
            branches: (branchesData.branches || []).map((b: any) => ({
              id: b.id,
              name: b.name,
              parentBranchId: b.parent_branch_id,
              forkedFromMessageId: b.forked_from_message_id,
              createdAt: b.created_at,
            })),
            currentBranchId: data.branchId,
          }));
        }
        return data.branchId;
      } else {
        const errorData = await response.json().catch(() => ({}));
        setState(prev => ({ ...prev, error: errorData.error || 'Failed to create thread' }));
        return null;
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      setState(prev => ({ ...prev, error: 'Network error. Please try again.' }));
      return null;
    }
  }, [getToken, state.currentConversationId]);

  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    const token = getToken();
    if (!token) return false;
    try {
      const response = await fetch(`${API_URL}/ai/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setState(prev => ({
          ...prev,
          conversations: prev.conversations.filter(c => c.id !== conversationId),
          // Clear current conversation if it was deleted
          ...(prev.currentConversationId === conversationId ? {
            currentConversationId: null,
            currentBranchId: null,
            messages: [],
            branches: [],
          } : {}),
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }, [getToken]);

  const deleteAllConversations = useCallback(async (): Promise<boolean> => {
    const token = getToken();
    if (!token) return false;
    try {
      const response = await fetch(`${API_URL}/ai/conversations`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setState(prev => ({
          ...prev,
          conversations: [],
          currentConversationId: null,
          currentBranchId: null,
          messages: [],
          branches: [],
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting all conversations:', error);
      return false;
    }
  }, [getToken]);

  const switchBranch = useCallback(async (branchId: string) => {
    const conversationId = state.currentConversationId;
    if (!conversationId) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Load messages for the selected branch
    const messages = await loadBranchMessages(conversationId, branchId);
    
    setState(prev => ({
      ...prev,
      currentBranchId: branchId,
      messages,
      isLoading: false,
    }));
  }, [state.currentConversationId, loadBranchMessages]);

  return {
    state,
    hasApiKey,
    isCheckingApiKey,
    apiKeyError,
    createNewConversation,
    renameConversation,
    deleteConversation,
    deleteAllConversations,
    loadConversations,
    loadConversation,
    sendUserMessage,
    forkBranch,
    newThreadFromMessage,
    switchBranch,
    setApiKey,
    checkApiKey,
  };
}
