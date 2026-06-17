import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cable, LayoutDashboard, Users, HardHat, ClipboardList, AlertTriangle, BarChart3, LogOut, ChevronLeft, ChevronRight, UserCog, UserCircle, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/lib/usePermissions';

const ROLE_BADGES = {
  admin:   { label: 'Admin',    cls: 'bg-matrix-primary/20 text-matrix-primary border border-matrix-primary/40' },
  tecnico: { label: 'Técnico',  cls: 'bg-matrix-primary/20 text-matrix-primary border border-matrix-primary/40' },
  cliente: { label: 'Cliente',  cls: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40' },
};

export default function Sidebar({ collapsed: controlledCollapsed, setCollapsed: setControlledCollapsed }) {
  const { user, logout } = useAuth();
  const perms = usePermissions();
  const { pathname } = useLocation();
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? localCollapsed;
  const setCollapsed = setControlledCollapsed ?? setLocalCollapsed;

  const allItems = [
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

  const badge = ROLE_BADGES[perms.role];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[250px]'}`}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border flex items-center gap-3">
        <img
          src="/logo.png"
          alt="SGMOT"
          className="w-9 h-9 rounded-full shrink-0 animate-matrix-pulse"
        />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-brand font-bold text-matrix-primary text-glow-green tracking-wider">SGMOT</p>
            <p className="text-[10px] text-matrix-muted uppercase tracking-widest">INPE CABLE</p>
          </div>
        )}
      </div>

      {/* Usuario */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <p className="text-sm font-medium text-matrix-text truncate">{user.full_name}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${badge?.cls || ''}`}>
            {badge?.label || perms.role}
          </span>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {allItems.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : ''}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Colapsar</span>}
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
