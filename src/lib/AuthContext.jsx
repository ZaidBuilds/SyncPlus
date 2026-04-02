import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'syncplus.local-user';

const defaultUser = {
  id: 'local-user',
  full_name: 'Workspace Admin',
  email: 'admin@syncplus.local',
  role: 'admin',
};

function loadLocalUser() {
  if (typeof window === 'undefined') {
    return defaultUser;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultUser;
  } catch (error) {
    return defaultUser;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(defaultUser);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const storedUser = loadLocalUser();
    setUser(storedUser);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
  }, []);

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser);
    setIsAuthenticated(true);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    }
  }, []);

  const logout = useCallback(() => {
    persistUser(defaultUser);
  }, [persistUser]);

  const navigateToLogin = useCallback(() => {}, []);
  const checkAppState = useCallback(() => {}, []);

  const value = useMemo(
    () => ({
      user,
      setUser: persistUser,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: { mode: 'local' },
      logout,
      navigateToLogin,
      checkAppState,
    }),
    [user, persistUser, isAuthenticated, isLoadingAuth, logout, navigateToLogin, checkAppState]
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
