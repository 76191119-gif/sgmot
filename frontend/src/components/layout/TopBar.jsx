import NotificationBell from './NotificationBell';
import { LogOut, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/lib/usePermissions';

const ROLE_BADGES = {
  admin:   { label: 'ADMIN',   cls: 'bg-matrix-primary/15 text-matrix-primary border-matrix-primary/40' },
  tecnico: { label: 'TÉCNICO', cls: 'bg-matrix-primary/15 text-matrix-primary border-matrix-primary/40' },
  cliente: { label: 'CLIENTE', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' },
};

export default function TopBar() {
  const { user, logout } = useAuth();
  const perms = usePermissions();
  const badge = ROLE_BADGES[perms.role];

  return (
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-matrix-primary/20 h-14 flex items-center justify-between px-4 sm:px-6">
      <div className="text-sm text-matrix-muted hidden sm:flex items-center gap-2">
        <span>Sesión activa:</span>
        <span className="font-medium text-matrix-text">{user?.full_name}</span>
        {badge && (
          <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold tracking-wider ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <Link
          to="/profile"
          className="p-2 rounded-md hover:bg-matrix-primary/10 text-matrix-muted hover:text-matrix-primary transition"
          title="Mi perfil"
        >
          <UserCircle className="w-5 h-5" />
        </Link>
        <button
          onClick={logout}
          className="p-2 rounded-md hover:bg-red-500/10 text-matrix-muted hover:text-red-400 transition"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
