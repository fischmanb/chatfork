import { useState, useRef, useEffect } from 'react';
import { useBranchingChat } from '../hooks/useBranchingChat';
import { GitBranch, MessageSquare, Plus, Send, Loader2, Sparkles } from 'lucide-react';

interface ChatViewProps {
  userEmail: string;
  userName: string | null;
  onLogout: () => Promise<void>;
  getToken: () => string | null;
}

export function ChatView({ getToken }: ChatViewProps) {
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    state,
    sendUserMessage,
    forkBranch,
    switchBranch,
    createNewConversation,
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

  // Robust date parsing that handles multiple formats
  const parseDate = (timestamp: string | null | undefined): Date | null => {
    if (!timestamp) return null;
    try {
      // Try parsing as ISO string first
      let date = new Date(timestamp);
      if (!isNaN(date.getTime())) return date;
      
      // Try with Z appended
      date = new Date(timestamp + 'Z');
      if (!isNaN(date.getTime())) return date;
      
      // Try SQLite format (2024-01-15 10:30:00)
      if (timestamp.includes(' ')) {
        date = new Date(timestamp.replace(' ', 'T') + 'Z');
        if (!isNaN(date.getTime())) return date;
      }
      
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
              <button onClick={() => {}} className="w-full text-left">
                <div className={`p-3 rounded-xl transition-all duration-200 ${state.currentConversationId === conversation.id ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-400/50' : 'bg-slate-800/50 hover:bg-slate-700/50 border border-transparent'}`}>
                  <span className="text-sm font-medium text-slate-200 truncate pr-2 block">{conversation.title}</span>
                  <span className="text-xs text-slate-500 mt-1">{formatDate(conversation.updatedAt)}</span>
                </div>
              </button>

              {state.currentConversationId === conversation.id && state.branches.length > 0 && (
                <div className="mt-2 ml-4 space-y-1 border-l-2 border-slate-700/50 pl-3">
                  {state.branches.map((branch) => {
                    const isMainBranch = !branch.parentBranchId;
                    const displayName = isMainBranch 
                      ? (state.conversations.find(c => c.id === state.currentConversationId)?.title || branch.name)
                      : branch.name;
                    
                    return (
                      <button key={branch.id} onClick={() => switchBranch(branch.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${state.currentBranchId === branch.id ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                        <GitBranch className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate flex-1">{displayName}</span>
                        {isMainBranch && <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/30 text-indigo-300 rounded">MAIN</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
              <MessageSquare className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">ChatFork</h1>
              <p className="text-xs text-slate-500">{state.branches.find((b) => b.id === state.currentBranchId)?.name || 'Chat'}</p>
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