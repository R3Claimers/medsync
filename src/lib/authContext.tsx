import React, { createContext, useContext, useEffect, useState } from 'react';
import jwtDecode from 'jwt-decode';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from './api';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
  hospitalId?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({ id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role, mustChangePassword: decoded.mustChangePassword, hospitalId: decoded.hospitalId });
        localStorage.removeItem('justLoggedOut'); // Clear justLoggedOut if user is present
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const data = await apiLogin(email, password);
    setUser({ id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role, mustChangePassword: data.user.mustChangePassword, hospitalId: data.user.hospitalId });
    localStorage.removeItem('justLoggedOut'); // Clear justLoggedOut on login
    setLoading(false);
  };

  const register = async (payload: any) => {
    setLoading(true);
    const data = await apiRegister(payload);
    setUser({ id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role, mustChangePassword: data.user.mustChangePassword, hospitalId: data.user.hospitalId });
    setLoading(false);
  };

  const logout = () => {
    localStorage.setItem('justLoggedOut', 'true');
    apiLogout();
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
} 