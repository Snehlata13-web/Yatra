import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services';
import { tokenStore } from '../api/tokenStore';
import { onUnauthorized } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => onUnauthorized(signOut), [signOut]);

  useEffect(() => {
    let active = true;
    if (!tokenStore.get()) {
      setBooting(false);
      return undefined;
    }
    authApi
      .me()
      .then((u) => active && setUser(u))
      .catch(() => active && tokenStore.clear())
      .finally(() => active && setBooting(false));
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { user: u } = await authApi.login(email, password);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(
    () => ({ user, booting, signIn, signOut, setUser, isAuthenticated: Boolean(user) }),
    [user, booting, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
