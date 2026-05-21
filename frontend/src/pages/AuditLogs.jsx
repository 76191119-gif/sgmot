import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, Search, Filter, CheckCircle2, XCircle, AlertTriangle,
  Monitor, Smartphone, Users as UsersIcon, Globe,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import AccessDenied from '@/components/shared/AccessDenied';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';
import { formatDateTime } from '@/lib/utils';

const ACTION_LABELS = {
  login: 'Inicio de sesión',
  logout: 'Cierre de sesión',
  login_failed: 'Login fallido',
  change_password: 'Cambio de contraseña',
  create_client: 'Crear cliente',
  update_client: 'Editar cliente',
  delete_client: 'Eliminar cliente',
  create_technician: 'Crear técnico',
  update_technician: 'Editar técnico',
  delete_technician: 'Eliminar técnico',
  create_work_order: 'Crear orden',
  update_work_order: 'Editar orden',
  delete_work_order: 'Eliminar orden',
  create_incident: 'Crear incidencia',
  update_incident: 'Editar incidencia',
  delete_incident: 'Eliminar incidencia',
  create_user: 'Crear usuario',
  update_user: 'Editar usuario',
  update_user_password: 'Reset contraseña',
  delete_user: 'Eliminar usuario',
  purge_logs: 'Purgar logs',
};

const STATUS_CFG = {
  success: { Icon: CheckCircle2, cls: 'text-matrix-primary',cls2: 'bg-matrix-primary/15 border-matrix-primary/40',label: 'Éxito' },
  failed:  { Icon: XCircle,      cls: 'text-red-400',       cls2: 'bg-red-500/15 border-red-500/40',              label: 'Fallido' },
  warning: { Icon: AlertTriangle,cls: 'text-amber-300',     cls2: 'bg-amber-500/15 border-amber-500/40',          label: 'Atención' },
};

const ROLE_CFG = {
  admin:   'bg-matrix-primary/15 text-matrix-primary border border-matrix-primary/30',
  tecnico: 'bg-matrix-primary/15 text-matrix-primary border border-matrix-primary/30',
  cliente: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
};

const INPUT = "px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring";

export default function AuditLogs() {
  const perms = usePermissions();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limit, setLimit] = useState(500);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    search: '', action: '', role: '', status: '', from: '', to: '', limit: 500,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit_logs', appliedFilters],
    queryFn: () => api.auditLogs.list({
      search: appliedFilters.search || undefined,
      action: appliedFilters.action || undefined,
      role:   appliedFilters.role || undefined,
      status: appliedFilters.status || undefined,
      from:   appliedFilters.from || undefined,
      to:     appliedFilters.to || undefined,
      limit:  appliedFilters.limit || undefined,
    }),
    enabled: perms.canViewAuditLogs,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const logs  = data?.logs  || [];
  const stats = data?.stats || {};

  const isMobile = (os) => /Android|iPhone|iPad/i.test(os || '');

  if (!perms.canViewAuditLogs) return <AccessDenied />;

  return (
    <div>
      <PageHeader
        title="Auditoría del Sistema"
        subtitle="Registro de seguridad: accesos, cambios y eventos críticos"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total eventos"     value={stats.total || 0}           icon={Shield}        color="primary" />
        <StatCard label="Logins fallidos"   value={stats.failed_logins || 0}   icon={XCircle}       color="red"     subtitle="Intentos sospechosos" />
        <StatCard label="Usuarios únicos"   value={stats.unique_users || 0}    icon={UsersIcon}     color="blue" />
        <StatCard label="IPs distintas"     value={stats.unique_ips || 0}      icon={Globe}         color="purple" />
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium">
          <Filter className="w-4 h-4 text-primary" /> Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar email, IP o descripción..."
              className={`${INPUT} pl-9 w-full`}
            />
          </div>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={INPUT}>
            <option value="">Toda acción</option>
            <option value="login">Login</option>
            <option value="login_failed">Login fallido</option>
            <option value="change_password">Cambio password</option>
            <option value="create_client">Crear cliente</option>
            <option value="delete_client">Eliminar cliente</option>
            <option value="create_work_order">Crear orden</option>
            <option value="update_work_order">Editar orden</option>
            <option value="delete_work_order">Eliminar orden</option>
            <option value="create_incident">Crear incidencia</option>
            <option value="delete_user">Eliminar usuario</option>
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={INPUT}>
            <option value="">Todo rol</option>
            <option value="admin">Admin</option>
            <option value="tecnico">Técnico</option>
            <option value="cliente">Cliente</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={INPUT} title="Desde" />
          <input type="date" value={to}   onChange={(e) => setTo(e.target.value)}   className={INPUT} title="Hasta" />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => setStatusFilter('')}        className={`px-3 py-1 text-xs rounded-md border ${!statusFilter ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'}`}>Todos</button>
          <button onClick={() => setStatusFilter('success')} className={`px-3 py-1 text-xs rounded-md border ${statusFilter === 'success' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-input hover:bg-muted'}`}>Éxito</button>
          <button onClick={() => setStatusFilter('failed')}  className={`px-3 py-1 text-xs rounded-md border ${statusFilter === 'failed' ? 'bg-red-600 text-white border-red-600' : 'border-input hover:bg-muted'}`}>Fallidos</button>
          <button onClick={() => setStatusFilter('warning')} className={`px-3 py-1 text-xs rounded-md border ${statusFilter === 'warning' ? 'bg-amber-600 text-white border-amber-600' : 'border-input hover:bg-muted'}`}>Atención</button>

          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="px-3 py-1 text-xs rounded-md border border-input ml-2">
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500 (máx)</option>
          </select>

          <button onClick={() => refetch()} className="px-3 py-1 text-xs rounded-md border border-input ml-2 hover:bg-muted">Refrescar</button>
          <button
            onClick={() => {
              setAppliedFilters({
                search: search || '',
                action: actionFilter || '',
                role: roleFilter || '',
                status: statusFilter || '',
                from: from || '',
                to: to || '',
                limit: limit || 500,
              });
              setTimeout(() => refetch(), 100);
            }}
            className="px-3 py-1 text-xs rounded-md border ml-2 border-input hover:bg-muted"
          >
            Aplicar filtros
          </button>

          <button
            onClick={() => setAutoRefresh(a => !a)}
            className={`px-3 py-1 text-xs rounded-md border ml-2 ${autoRefresh ? 'bg-emerald-600 text-white border-emerald-600' : 'border-input hover:bg-muted'}`}
          >
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </button>
          <button
            onClick={() => {
              setSearch(''); setActionFilter(''); setRoleFilter(''); setStatusFilter(''); setFrom(''); setTo(''); setLimit(500);
              setAppliedFilters({ search: '', action: '', role: '', status: '', from: '', to: '', limit: 500 });
              setTimeout(() => refetch(), 150);
            }}
            className="ml-auto px-3 py-1 text-xs rounded-md border border-input hover:bg-muted"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Indicador de total */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total eventos: <span className="font-semibold text-white">{stats.total || 0}</span></div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const newLimit = Math.min(stats.total || 500, 500);
              setSearch(''); setActionFilter(''); setRoleFilter(''); setStatusFilter(''); setFrom(''); setTo('');
              setLimit(newLimit);
              setTimeout(() => refetch(), 150);
            }}
            className="px-3 py-1 text-xs rounded-md border border-input hover:bg-muted"
          >
            Mostrar en tabla
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : logs.length === 0 ? (
          <EmptyState icon={Shield} title="Sin registros" description="No hay eventos que coincidan con los filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold">Acción</th>
                  <th className="text-left px-4 py-3 font-semibold">Descripción</th>
                  <th className="text-left px-4 py-3 font-semibold">IP</th>
                  <th className="text-left px-4 py-3 font-semibold">Dispositivo</th>
                  <th className="text-left px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((l) => {
                  const sCfg = STATUS_CFG[l.status] || STATUS_CFG.success;
                  const SIcon = sCfg.Icon;
                  const Device = isMobile(l.os) ? Smartphone : Monitor;
                  return (
                    <tr key={l.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(l.created_date)}</td>
                      <td className="px-4 py-3">
                        {l.user_email ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-xs truncate">{l.user_email}</span>
                            {l.user_role && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${ROLE_CFG[l.user_role] || ''}`}>
                                {l.user_role}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">anónimo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">{ACTION_LABELS[l.action] || l.action}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[300px] truncate" title={l.description}>{l.description}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{l.ip_address}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Device className="w-3.5 h-3.5" />
                          <div>
                            <p>{l.browser}</p>
                            <p className="text-[10px]">{l.os}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border uppercase tracking-wider ${sCfg.cls2} ${sCfg.cls}`}>
                          <SIcon className="w-3 h-3" /> {sCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {logs.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Mostrando {logs.length} eventos. Para ver más, ajusta los filtros de fecha.
        </p>
      )}
    </div>
  );
}
