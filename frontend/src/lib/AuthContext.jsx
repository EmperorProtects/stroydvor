/**
 * AuthContext — управление аутентификацией пользователей.
 * Поддерживает: гость / зарегистрированный пользователь / admin.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Auth } from '@/api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,           setUser]           = useState(() => Auth.getCachedUser());
  const [isLoadingAuth,  setIsLoadingAuth]  = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError,      setAuthError]      = useState(null);

  // При старте: загружаем профиль только для user-токенов
  // Admin-only токены (без refresh) не инициализируют UserContext
  useEffect(() => {
    if (!Auth.isAuthed()) return;
    // Если это admin-only сессия без refresh token — не трогаем
    const role = Auth.getRole();
    if (role === 'admin' && !Auth.getRefresh()) return;
    
    setIsLoadingAuth(true);
    Auth.me()
      .then(u => { setUser(u); setAuthError(null); })
      .catch(() => {
        if (!Auth.getRefresh()) { setIsLoadingAuth(false); return; }
        Auth.refresh()
          .then(() => Auth.me())
          .then(u => { setUser(u); setAuthError(null); })
          .catch(() => { Auth.clearTokens(); setUser(null); })
      })
      .finally(() => setIsLoadingAuth(false));
  }, []);

  const login = useCallback(async (loginStr, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const d = await Auth.login(loginStr, password);
      setUser(d.user);
      return d;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const register = useCallback(async (name, phone, email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const d = await Auth.register(name, phone, email, password);
      setUser(d.user);
      return d;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await Auth.logout().catch(() => {});
    setUser(null);
    setAuthError(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const updated = await Auth.updateProfile(data);
    setUser(updated);
    return updated;
  }, []);

  const changePassword = useCallback(async (oldPwd, newPwd) => {
    return Auth.changePassword(oldPwd, newPwd);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated:       !!user,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      // Legacy для admin panel
      navigateToLogin: () => { window.location.href = '/admin'; },
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
