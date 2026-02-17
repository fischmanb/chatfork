import { useState, useRef, useEffect } from 'react';
import { useBranchingChat } from '../hooks/useBranchingChat';
import { GitBranch, MessageSquare, Plus, Send, Loader2, Sparkles, Trash2, AlertTriangle } from 'lucide-react';

interface ChatViewProps {
  userEmail: string;
  userName: string | null;
  onLogout: () => Promise<void>;
  getToken: () => string | null;
}

export function ChatView({ getToken }: ChatViewProps) {
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    state,
    sendUserMessage,
    forkBranch,
    switchBranch,
    createNewConversation,
    deleteConversation,
    deleteAllConversations,
    loadConversation,
  } = useBranchingChat(getToken);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isLoading]);

  const handleSend = async () => {
    if (!input.trim() || state.isLoading) return;
    const content = input.trim();
    setInput('');
    
    // Send message - backend handles auto-naming on first message
    await sendUserMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFork = (messageId: string) => {
    const name = prompt('Enter a name for the new branch:');
    if (name?.trim()) {
      forkBranch(messageId, name.trim());
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation(conversationId);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    const success = await deleteAllConversations();
    setIsDeleting(false);
    setShowDeleteAllModal(false);
    if (!success) {
      alert('Failed to delete conversations. Please try again.');
    }
  };

  // Parse UTC timestamp and convert to local time
  const parseDate = (timestamp: string | null | undefined): Date | null => {
    if (!timestamp) return null;
    try {
      // Ensure timestamp is treated as UTC by appending Z if not present
      let utcTimestamp = timestamp;
      if (!timestamp.endsWith('Z') && !timestamp.match(/[+-]\d{2}:\d{2}$/)) {
        utcTimestamp = timestamp + 'Z';
      }
      
      const date = new Date(utcTimestamp);
      if (!isNaN(date.getTime())) return date;
      
      return null;
    } catch {
      return null;
    }
  };

  const formatTime = (timestamp: string | null | undefined) => {
    const date = parseDate(timestamp);
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (timestamp: string | null | undefined) => {
    const date = parseDate(timestamp);
    if (!date) return '';
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-slate-900/90 backdrop-blur-sm border-r border-slate-700/50 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-slate-700/50">
          <button onClick={() => createNewConversation()} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-900 font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20">
            <Plus className="w-5 h-5" />
            New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {state.conversations.map((conversation) => (
            <div key={conversation.id}>
              <div 
                onClick={() => loadConversation(conversation.id)}
                className={`group p-3 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-between ${state.currentConversationId === conversation.id ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-400/50' : 'bg-slate-800/50 hover:bg-slate-700/50 border border-transparent'}`}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-200 truncate pr-2 block">{conversation.title}</span>
                  <span className="text-xs text-slate-500 mt-1">{formatDate(conversation.updatedAt)}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, conversation.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  title="Delete conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {state.currentConversationId === conversation.id && state.branches.length > 0 && (
                <div className="mt-2 ml-4 space-y-1 border-l-2 border-slate-700/50 pl-3">
                  {state.branches.map((branch) => {
                    const isMainBranch = !branch.parentBranchId;
                    const isActive = state.currentBranchId === branch.id;
                    const displayName = isMainBranch 
                      ? (state.conversations.find(c => c.id === state.currentConversationId)?.title || branch.name)
                      : branch.name;
                    
                    return (
                      <button key={branch.id} onClick={() => switchBranch(branch.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate flex-1">{displayName}</span>
                          {isMainBranch && <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/30 text-indigo-300 rounded">MAIN</span>}
                          {isActive && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 rounded">ACTIVE</span>}
                        </div>
                        {(branch.messageCount !== undefined || branch.lastActivity) && (
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                            {branch.messageCount !== undefined && (
                              <span>{branch.messageCount} message{branch.messageCount !== 1 ? 's' : ''}</span>
                            )}
                            {branch.lastActivity && (
                              <span>• {formatDate(branch.lastActivity)}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Delete All Button */}
        {state.conversations.length > 0 && (
          <div className="p-4 border-t border-slate-700/50">
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
              Delete All History
            </button>
          </div>
        )}
      </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-200">Delete All History?</h3>
            </div>
            
            <p className="text-slate-400 mb-6">
              This will permanently delete all {state.conversations.length} conversation{state.conversations.length !== 1 ? 's' : ''} and all messages. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, Delete All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
              <MessageSquare className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">ChatFork</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {state.branches.find((b) => b.id === state.currentBranchId)?.name || 'Chat'}
                </span>
                {state.currentBranchId && state.branches.find((b) => b.id === state.currentBranchId)?.parentBranchId && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">FORK</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Click Fork on any message</span>
            <span className="text-slate-600">|</span>
            <span>Click branch in sidebar to switch</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {state.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
                <GitBranch className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-200 mb-2">Welcome to ChatFork</h2>
              <p className="text-slate-400 max-w-md mb-6">Start a conversation and fork at any point to explore different directions.</p>
              <button onClick={() => createNewConversation()} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-900 font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20">Start New Conversation</button>
            </div>
          ) : (
            <>
              {state.messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* User message: Fork button on LEFT (before message) */}
                  {message.role === 'user' && (
                    <button onClick={() => handleFork(message.id)} className="self-end mb-1 mr-2 p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-1" title="Fork from here">
                      <GitBranch className="w-4 h-4" />
                      <span className="text-xs font-medium">Fork</span>
                    </button>
                  )}
                  
                  <div className={`max-w-[70%] lg:max-w-[60%] ${message.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-slate-900' : 'bg-slate-800/80 backdrop-blur-sm text-slate-200 border border-slate-700/50'} rounded-2xl px-5 py-4 shadow-lg relative`}>
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</div>
                    <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-emerald-900/60' : 'text-slate-500'}`}>{formatTime(message.timestamp)}</div>
                  </div>
                  
                  {/* Assistant message: Fork button on RIGHT (after message) */}
                  {message.role === 'assistant' && (
                    <button onClick={() => handleFork(message.id)} className="self-end mb-1 ml-2 p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-1" title="Fork from here">
                      <GitBranch className="w-4 h-4" />
                      <span className="text-xs font-medium">Fork</span>
                    </button>
                  )}
                </div>
              ))}
              
              {state.isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span className="text-slate-400 text-sm">Thinking...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="px-4 py-4 bg-slate-900/50 backdrop-blur-sm border-t border-slate-700/50">
          <div className="max-w-4xl mx-auto flex gap-3">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)" className="flex-1 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none transition-all duration-200" rows={1} style={{ minHeight: '52px', maxHeight: '200px' }} />
            <button onClick={handleSend} disabled={!input.trim() || state.isLoading} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-slate-900 font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:shadow-none flex items-center gap-2">
              {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}