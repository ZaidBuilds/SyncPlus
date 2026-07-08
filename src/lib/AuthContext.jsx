import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'vantage_user';
const USERS_LIST_KEY = 'vantage_users';

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const stored = loadUser();
    if (stored) {
      setUser(stored);
      setIsAuthenticated(true);
    }
    setIsLoadingAuth(false);
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }, []);

  const signup = useCallback((userData) => {
    // Store users list for multi-account support
    const users = JSON.parse(localStorage.getItem(USERS_LIST_KEY) || '[]');
    const exists = users.find(u => u.email === userData.email);
    if (exists) throw new Error('Account already exists with this email');
    users.push({ ...userData, created_at: new Date().toISOString() });
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
    // Auto login
    login(userData);
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateProfile = useCallback((updates) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Also update in users list
    const users = JSON.parse(localStorage.getItem(USERS_LIST_KEY) || '[]');
    const idx = users.findIndex(u => u.email === user.email);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoadingAuth,
      login,
      signup,
      logout,
      updateProfile,
      setUser: login,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: { mode: 'local' },
      navigateToLogin: () => {},
      checkAppState: () => {},
    }),
    [user, isAuthenticated, isLoadingAuth, login, signup, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
