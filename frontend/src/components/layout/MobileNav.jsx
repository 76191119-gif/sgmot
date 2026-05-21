import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cable, Menu, X, LayoutDashboard, Users, HardHat, ClipboardList, AlertTriangle, BarChart3, LogOut, UserCog, UserCircle, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/lib/usePermissions';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const perms = usePermissions();
  const { pathname } = useLocation();

  const items = [
    { to: '/',             label: 'Panel Principal', icon: LayoutDashboard, show: true },
    { to: '/clients',      label: 'Clientes',        icon: Users,           show: perms.canViewClients },
    { to: '/technicians',  label: 'Técnicos',        icon: HardHat,         show: perms.canViewTechnicians },
    { to: '/work-orders',  label: 'Órdenes',         icon: ClipboardList,   show: perms.canViewWorkOrders },
    { to: '/incidents',    label: 'Incidencias',     icon: AlertTriangle,   show: perms.canViewIncidents },
    { to: '/reports',      label: 'Reportes',        icon: BarChart3,       show: perms.canViewReports },
    { to: '/users',        label: 'Usuarios',        icon: UserCog,         show: perms.canManageUsers },
    { to: '/audit-logs',   label: 'Auditoría',       icon: Shield,          show: perms.canViewAuditLogs },
    { to: '/profile',      label: 'Mi Perfil',       icon: UserCircle,      show: true },
  ].filter((i) => i.show);

  return (
    <>
      {/* Top bar fija */}
      <header className="fixed top-0 inset-x-0 z-40 h-16 bg-sidebar text-sidebar-foreground flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SGMOT" className="w-8 h-8 rounded-full" />
          <div className="leading-tight">
            <p className="font-brand font-bold text-matrix-primary text-sm tracking-wider">SGMOT</p>
            <p className="text-[9px] text-matrix-muted uppercase tracking-widest">INPE CABLE</p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 rounded-md hover:bg-sidebar-accent">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
              <p className="font-semibold">{user?.full_name}</p>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-sidebar-accent rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors
                      ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'hover:bg-sidebar-accent'}`}
                  >
                    <Icon className="w-4 h-4" /> {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-sidebar-border p-2">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
