import { useState, useEffect } from 'react';
import { MessageSquare, Github, Twitter, Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { ChatView } from './components/ChatView';

function App() {
  const { user, isLoading, isAuthenticated, login, signup, logout, getToken } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setError(null);
  }, [isLoginMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = isLoginMode 
      ? await login(email, password)
      : await signup(email, password, name || undefined);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <ChatView 
        userEmail={user.email} 
        userName={user.name}
        onLogout={logout}
        getToken={getToken}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <nav className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">ChatFork</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
            <Github className="w-5 h-5" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
            <Twitter className="w-5 h-5" />
          </a>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                {isLoginMode ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-slate-400">
                {isLoginMode ? 'Sign in to continue to ChatFork' : 'Sign up to start using ChatFork'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name (optional)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? (isLoginMode ? 'Signing in...' : 'Creating account...') : (isLoginMode ? 'Sign in' : 'Create account')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                <button onClick={() => setIsLoginMode(!isLoginMode)} className="ml-1 text-indigo-400 hover:text-indigo-300 font-medium">
                  {isLoginMode ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full px-6 py-4 border-t border-slate-800/50">
        <p className="text-center text-slate-500 text-sm">
          Powered by Kimi AI • Built with Cloudflare Workers
        </p>
      </footer>
    </div>
  );
}

export default App;
