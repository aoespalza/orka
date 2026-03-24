import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api';
import type { User, LoginRequest } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('procura_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.setToken(token);
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    const response = await api.login(credentials);
    const { token: newToken, user: userData } = response;
    
    localStorage.setItem('procura_token', newToken);
    api.setToken(newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('procura_token');
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
