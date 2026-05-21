import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/api/localClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sgmot_user');
    const token = localStorage.getItem('sgmot_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); }
      catch { /* ignore */ }
    }
    setIsLoadingAuth(false);
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.auth.login(email, password);
    localStorage.setItem('sgmot_token', token);
    localStorage.setItem('sgmot_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  /** Registro con datos personales completos (form de Register) */
  const register = async (data) => {
    const res = await api.auth.register(data);
    localStorage.setItem('sgmot_token', res.token);
    localStorage.setItem('sgmot_user',  JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  /**
   * Login/registro con Google ID token.
   * Devuelve { user, profile_complete, is_new_user }
   */
  const loginWithGoogle = async (idToken) => {
    const res = await api.auth.google(idToken);
    localStorage.setItem('sgmot_token', res.token);
    localStorage.setItem('sgmot_user',  JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  const refreshUser = (next) => {
    const updated = { ...user, ...next };
    localStorage.setItem('sgmot_user', JSON.stringify(updated));
    setUser(updated);
  };

  const logout = () => {
    localStorage.removeItem('sgmot_token');
    localStorage.removeItem('sgmot_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user, isLoadingAuth,
        login, register, loginWithGoogle, logout, refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
