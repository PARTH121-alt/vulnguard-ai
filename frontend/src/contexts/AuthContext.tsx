import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('vulnguard_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then(res => setUser(res.data))
        .catch(() => { localStorage.removeItem('vulnguard_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('vulnguard_token', res.data.access_token);
    localStorage.setItem('vulnguard_user', JSON.stringify(res.data.user));
    setToken(res.data.access_token);
    setUser(res.data.user);
  };

  const signup = async (username: string, email: string, password: string) => {
    const res = await authAPI.signup({ username, email, password });
    localStorage.setItem('vulnguard_token', res.data.access_token);
    localStorage.setItem('vulnguard_user', JSON.stringify(res.data.user));
    setToken(res.data.access_token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('vulnguard_token');
    localStorage.removeItem('vulnguard_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
