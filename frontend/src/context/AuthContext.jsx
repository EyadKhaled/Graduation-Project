import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/auth.service.js";
import { clearTokens } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }
      // Show cached user immediately for fast paint, then sync from server in background
      const cached = authService.getCurrentUser();
      if (cached) {
        setUser(cached);
        setLoading(false);
      }
      // Always verify with server — keeps isVerified, name, etc. in sync
      // and detects deleted / suspended accounts within one page load.
      try {
        const me = await authService.getMe();
        setUser(me);
        localStorage.setItem("user", JSON.stringify(me));
      } catch {
        // Token invalid or expired — clear everything
        setUser(null);
        clearTokens();
      } finally {
        if (!cached) setLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await authService.register(formData);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  // Call this after email verification to sync isVerified from server
  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.getMe();
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
    } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
