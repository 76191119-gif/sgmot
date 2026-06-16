import NotificationBell from './NotificationBell';
import { LogOut, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/lib/usePermissions';

const ROLE_BADGES = {
  admin: { label: 'ADMIN', cls: 'bg-matrix-primary/15 text-matrix-primary border-matrix-primary/40' },
  tecnico: { label: 'TECNICO', cls: 'bg-matrix-primary/15 text-matrix-primary border-matrix-primary/40' },
  cliente: { label: 'CLIENTE', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' },
};

export default function TopBar() {
  const { user, logout } = useAuth();
  const perms = usePermissions();
  const badge = ROLE_BADGES[perms.role];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-matrix-primary/15 bg-[#0B1220]/68 px-4 shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:px-6">
      <div className="hidden items-center gap-2 text-sm text-matrix-muted sm:flex">
        <span>Sesion activa:</span>
        <span className="font-medium text-matrix-text">{user?.full_name}</span>
        {badge && (
          <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold tracking-wider ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <Link
          to="/profile"
          className="rounded-md p-2 text-matrix-muted transition hover:bg-matrix-primary/10 hover:text-matrix-primary"
          title="Mi perfil"
        >
          <UserCircle className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={logout}
          className="rounded-md p-2 text-matrix-muted transition hover:bg-red-500/10 hover:text-red-400"
          title="Cerrar sesion"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
