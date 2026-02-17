import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { ChatView } from './components/ChatView';
import { LandingPage, AuthModal } from './components/LandingPage';

function App() {
  const { user, isLoading, isAuthenticated, login, signup, logout, getToken } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleGetStarted = () => {
    setAuthError(null);
    setShowAuthModal(true);
  };

  const handleCloseModal = () => {
    setShowAuthModal(false);
    setAuthError(null);
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    setIsAuthLoading(true);
    const result = await login(email, password);
    setIsAuthLoading(false);
    if (result.success) {
      setShowAuthModal(false);
      return true;
    }
    setAuthError(result.error || 'Login failed');
    return false;
  };

  const handleSignup = async (email: string, password: string, name?: string): Promise<boolean> => {
    setAuthError(null);
    setIsAuthLoading(true);
    const result = await signup(email, password, name);
    setIsAuthLoading(false);
    if (result.success) {
      setShowAuthModal(false);
      return true;
    }
    setAuthError(result.error || 'Signup failed');
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
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
    <>
      <LandingPage onGetStarted={handleGetStarted} />
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleCloseModal}
        onLogin={handleLogin}
        onSignup={handleSignup}
        error={authError}
        isLoading={isAuthLoading}
      />
    </>
  );
}

export default App;
