import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/api/localClient';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    const stored = localStorage.getItem('sgmot_user');
    const token = localStorage.getItem('sgmot_token');
    if (stored && token) {
      try {
        const cached = JSON.parse(stored);
        setUser(cached);
        api.auth.me()
          .then((fresh) => {
            if (!alive) return;
            localStorage.setItem('sgmot_user', JSON.stringify(fresh));
            setUser(fresh);
          })
          .catch(() => {
            if (!alive) return;
            localStorage.removeItem('sgmot_token');
            localStorage.removeItem('sgmot_user');
            setUser(null);
          })
          .finally(() => {
            if (alive) setIsLoadingAuth(false);
          });
        return () => { alive = false; };
      } catch {
        localStorage.removeItem('sgmot_token');
        localStorage.removeItem('sgmot_user');
      }
    }
    setIsLoadingAuth(false);
    return () => { alive = false; };
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

  const finishLogout = () => {
    localStorage.removeItem('sgmot_token');
    localStorage.removeItem('sgmot_user');
    setUser(null);
    window.location.href = '/login';
  };

  const logout = () => {
    setConfirmLogoutOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user, isLoadingAuth,
        login, register, loginWithGoogle, logout, refreshUser,
      }}
    >
      {children}
      <ConfirmDialog
        open={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={finishLogout}
        title="Cerrar sesion"
        message="¿Realmente quieres cerrar sesion? Tendras que iniciar sesion nuevamente para volver al sistema."
        confirmText="Cerrar sesion"
      />
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
