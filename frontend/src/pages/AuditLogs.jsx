import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Globe,
  Monitor,
  Search,
  Shield,
  Smartphone,
  Users as UsersIcon,
  XCircle,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import AccessDenied from '@/components/shared/AccessDenied';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';
import { formatDateTime } from '@/lib/utils';

const ACTION_LABELS = {
  login: 'Inicio de sesion',
  logout: 'Cierre de sesion',
  login_failed: 'Login fallido',
  change_password: 'Cambio de contrasena',
  create_client: 'Crear cliente',
  update_client: 'Editar cliente',
  delete_client: 'Eliminar cliente',
  create_technician: 'Crear tecnico',
  update_technician: 'Editar tecnico',
  delete_technician: 'Eliminar tecnico',
  create_work_order: 'Crear orden',
  update_work_order: 'Editar orden',
  delete_work_order: 'Eliminar orden',
  create_incident: 'Crear incidencia',
  update_incident: 'Editar incidencia',
  delete_incident: 'Eliminar incidencia',
  create_user: 'Crear usuario',
  update_user: 'Editar usuario',
  update_user_password: 'Reset contrasena',
  delete_user: 'Eliminar usuario',
  purge_logs: 'Purgar logs',
  register: 'Registro de cliente',
};

const STATUS_CFG = {
  success: { Icon: CheckCircle2, cls: 'text-matrix-primary', cls2: 'bg-matrix-primary/15 border-matrix-primary/40', label: 'Exito' },
  failed: { Icon: XCircle, cls: 'text-red-400', cls2: 'bg-red-500/15 border-red-500/40', label: 'Fallido' },
  warning: { Icon: AlertTriangle, cls: 'text-amber-300', cls2: 'bg-amber-500/15 border-amber-500/40', label: 'Atencion' },
};

const ROLE_CFG = {
  admin: 'bg-matrix-primary/15 text-matrix-primary border border-matrix-primary/30',
  tecnico: 'bg-matrix-primary/15 text-matrix-primary border border-matrix-primary/30',
  cliente: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
};

const INPUT = 'px-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition';
const DEFAULT_FILTERS = { search: '', action: '', role: '', status: '', from: '', to: '', limit: 500 };

export default function AuditLogs() {
  const perms = usePermissions();
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit_logs', appliedFilters],
    queryFn: () => api.auditLogs.list(appliedFilters),
    enabled: perms.canViewAuditLogs,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  if (!perms.canViewAuditLogs) return <AccessDenied />;

  const logs = Array.isArray(data) ? data : Array.isArray(data?.logs) ? data.logs : [];
  const stats = data?.stats || {};
  const isMobile = (os) => /Android|iPhone|iPad/i.test(os || '');

  const setField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const applyFilters = () => setAppliedFilters(draft);
  const clearFilters = () => {
    setDraft(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };
  const applyStatus = (status) => {
    const next = { ...draft, status };
    setDraft(next);
    setAppliedFilters(next);
  };

  return (
    <div>
      <PageHeader title="Auditoria del Sistema" subtitle="Registro de seguridad: accesos, cambios y eventos criticos" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total eventos" value={stats.total || 0} icon={Shield} color="primary" />
        <StatCard label="Logins fallidos" value={stats.failed_logins || 0} icon={XCircle} color="red" subtitle="Intentos sospechosos" />
        <StatCard label="Usuarios unicos" value={stats.unique_users || 0} icon={UsersIcon} color="blue" />
        <StatCard label="IPs distintas" value={stats.unique_ips || 0} icon={Globe} color="purple" />
      </div>

      <div className="mb-4 rounded-xl border border-matrix-primary/20 bg-black/60 p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-matrix-text">
          <Filter className="h-4 w-4 text-matrix-primary" /> Filtros
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(300px,1.5fr)_160px_150px_150px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-matrix-muted" />
            <input
              value={draft.search}
              onChange={(e) => setField('search', e.target.value)}
              placeholder="Buscar email, IP o descripcion..."
              className={`${INPUT} h-11 w-full pl-9 placeholder:text-matrix-muted/40`}
            />
          </div>
          <select value={draft.role} onChange={(e) => setField('role', e.target.value)} className={`${INPUT} h-11 w-full`}>
            <option value="">Todo rol</option>
            <option value="admin">Admin</option>
            <option value="tecnico">Tecnico</option>
            <option value="cliente">Cliente</option>
          </select>
          <input type="date" value={draft.from} onChange={(e) => setField('from', e.target.value)} className={`${INPUT} h-11 w-full`} title="Desde" />
          <input type="date" value={draft.to} onChange={(e) => setField('to', e.target.value)} className={`${INPUT} h-11 w-full`} title="Hasta" />
        </div>

        <div className="mt-4 grid gap-4 border-t border-matrix-primary/10 pt-4 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-matrix-muted">Estado</p>
            <div className="inline-flex max-w-full flex-wrap gap-2 rounded-lg border border-matrix-primary/15 bg-black/35 p-1.5">
            {[
              { key: '', label: 'Todos', active: 'bg-matrix-primary text-black border-matrix-primary' },
              { key: 'success', label: 'Exito', active: 'bg-emerald-600 text-white border-emerald-600' },
              { key: 'failed', label: 'Fallidos', active: 'bg-red-600 text-white border-red-600' },
              { key: 'warning', label: 'Atencion', active: 'bg-amber-600 text-white border-amber-600' },
            ].map(({ key, label, active }) => (
              <button
                key={key || 'all'}
                type="button"
                onClick={() => applyStatus(key)}
                className={`h-8 min-w-[78px] rounded-md border px-3 text-xs font-medium transition ${
                  draft.status === key ? active : 'border-matrix-primary/25 text-matrix-muted hover:bg-matrix-primary/5 hover:text-matrix-text'
                }`}
              >
                {label}
            </button>
          ))}
            </div>
          </div>

          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-matrix-muted xl:text-right">Acciones</p>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <button type="button" onClick={() => refetch()} className="h-10 min-w-[110px] rounded-md border border-matrix-primary/25 px-4 text-xs font-medium text-matrix-muted transition hover:bg-matrix-primary/5 hover:text-matrix-text">
                {isFetching ? 'Actualizando' : 'Refrescar'}
              </button>
              <button type="button" onClick={applyFilters} className="h-10 min-w-[140px] rounded-md border border-matrix-primary bg-matrix-primary px-4 text-xs font-bold text-black transition hover:bg-matrix-hover">
                Aplicar filtros
              </button>
              <button type="button" onClick={clearFilters} className="h-10 min-w-[96px] rounded-md border border-matrix-primary/25 px-4 text-xs font-medium text-matrix-muted transition hover:bg-matrix-primary/5 hover:text-matrix-text">
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-matrix-muted">
          Eventos encontrados: <span className="font-semibold text-matrix-text">{stats.total || 0}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-matrix-primary/20 bg-black/60">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-matrix-muted">Cargando...</div>
        ) : logs.length === 0 ? (
          <EmptyState icon={Shield} title="Sin registros" description="No hay eventos que coincidan con los filtros." />
        ) : (
          <div className="space-y-2 p-3">
            {logs.map((log) => {
              const sCfg = STATUS_CFG[log.status] || STATUS_CFG.success;
              const SIcon = sCfg.Icon;
              const Device = isMobile(log.os) ? Smartphone : Monitor;
              return (
                <div
                  key={log.id}
                  className="grid grid-cols-1 items-center gap-3 rounded-xl border border-matrix-primary/20 bg-black/55 px-4 py-3 transition hover:border-matrix-primary/45 hover:bg-matrix-primary/[0.035] lg:grid-cols-[150px_minmax(220px,1.3fr)_150px_minmax(260px,1.6fr)_120px_minmax(150px,0.9fr)_110px]"
                >
                  <p className="whitespace-nowrap text-xs text-matrix-muted">{formatDateTime(log.created_date)}</p>

                  {log.user_email ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-xs font-medium text-matrix-text">{log.user_email}</span>
                      {log.user_role && (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${ROLE_CFG[log.user_role] || ''}`}>
                          {log.user_role}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs italic text-matrix-muted">anonimo</span>
                  )}

                  <p className="text-xs font-medium text-matrix-text">{ACTION_LABELS[log.action] || log.action}</p>
                  <p className="truncate text-xs text-matrix-muted" title={log.description}>{log.description}</p>
                  <p className="font-mono text-xs text-matrix-muted">{log.ip_address}</p>

                  <div className="flex items-center gap-1.5 text-xs text-matrix-muted">
                    <Device className="h-3.5 w-3.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate">{log.browser}</p>
                      <p className="truncate text-[10px]">{log.os}</p>
                    </div>
                  </div>

                  <span className={`inline-flex w-fit items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${sCfg.cls2} ${sCfg.cls}`}>
                    <SIcon className="h-3 w-3" /> {sCfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {logs.length > 0 && (
        <p className="mt-3 text-center text-xs text-matrix-muted">
          Mostrando {logs.length} eventos. Para ver mas, ajusta los filtros o aumenta el limite.
        </p>
      )}
    </div>
  );
}
