"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

const TOKEN_KEY = "route53_token";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }

    api
      .me(stored)
      .then((u) => {
        setUser(u);
        setToken(stored);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await api.logout(token);
      } catch {
        /* ignore */
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
