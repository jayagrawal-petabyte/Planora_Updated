import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

import type { User } from '@planora/shared';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data.user);
          }
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();

    const handleUnauthorized = () => {
      setUser(null);
      setGlobalError('Your session has expired. Please log in again.');
    };

    const handleNetworkError = () => {
      setGlobalError('Network error. Please check your connection.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('network:error', handleNetworkError);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('network:error', handleNetworkError);
    };
  }, []);

  const login = (token: string, refreshToken: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
    setGlobalError(null);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setGlobalError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {globalError && (
        <div style={{ backgroundColor: '#ff4d4f', color: 'white', padding: '10px', textAlign: 'center', zIndex: 9999, position: 'relative' }}>
          {globalError}
          <button 
            onClick={() => setGlobalError(null)} 
            style={{ marginLeft: '15px', background: 'transparent', border: '1px solid white', color: 'white', cursor: 'pointer', borderRadius: '4px', padding: '2px 8px' }}
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
