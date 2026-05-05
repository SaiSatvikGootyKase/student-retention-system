import React, { createContext, useState, useCallback } from 'react';
import type { LoginResponse } from '../api';
import { login as apiLogin, registerAccount } from '../api';

export interface AuthContextType {
  currentUser: LoginResponse | null;
  /** Mark dropout profile gate satisfied after successful PATCH (updates localStorage). */
  markDropoutProfileComplete: () => void;
  login: (email: string, password: string, expectedRole: 'STUDENT' | 'FACULTY') => Promise<void>;
  register: (args: {
    name: string;
    email: string;
    password: string;
    role: 'STUDENT' | 'FACULTY';
    department?: string;
  }) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(() => {
    try {
      const stored = localStorage.getItem('lms_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email: string, password: string, expectedRole: 'STUDENT' | 'FACULTY') => {
    const user = await apiLogin(email, password, expectedRole);
    setCurrentUser(user);
    localStorage.setItem('lms_user', JSON.stringify(user));
  }, []);

  const markDropoutProfileComplete = useCallback(() => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, dropoutProfileComplete: true };
      localStorage.setItem('lms_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const register = useCallback(
    async (args: {
      name: string;
      email: string;
      password: string;
      role: 'STUDENT' | 'FACULTY';
      department?: string;
    }) => {
      await registerAccount({
        name: args.name,
        email: args.email,
        passwordHash: args.password,
        role: args.role,
        department: args.department?.trim() || undefined,
      });
      await login(args.email.trim(), args.password, args.role);
    },
    [login],
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('lms_user');
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, markDropoutProfileComplete, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
