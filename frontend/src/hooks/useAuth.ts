import { useState, useEffect, useCallback } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'https://chatfork-api.lively-block-6291.workers.dev').replace(/\/+$/, '');

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('chatfork_session');
      
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const user = await response.json();
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          localStorage.removeItem('chatfork_session');
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Session check error:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('chatfork_session', data.token);
      setState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      localStorage.setItem('chatfork_session', data.token);
      setState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Signup failed' 
      };
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('chatfork_session');
    
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('chatfork_session');
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem('chatfork_session');
  }, []);

  return {
    ...state,
    login,
    signup,
    logout,
    getToken,
  };
}
