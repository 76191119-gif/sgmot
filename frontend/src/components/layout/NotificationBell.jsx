import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Info,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { api } from '@/api/localClient';

const TYPE_CONFIG = {
  order_new: {
    Icon: ClipboardList,
    color: 'text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-400/35',
    ring: 'shadow-[0_0_18px_rgba(56,189,248,0.16)]',
    label: 'Nueva orden',
  },
  order_assigned: {
    Icon: Wrench,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/35',
    ring: 'shadow-[0_0_18px_rgba(52,211,153,0.16)]',
    label: 'Orden asignada',
  },
  order_status: {
    Icon: Clock,
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/35',
    ring: 'shadow-[0_0_18px_rgba(251,191,36,0.16)]',
    label: 'Estado de orden',
  },
  order_completed: {
    Icon: CheckCircle2,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/35',
    ring: 'shadow-[0_0_18px_rgba(52,211,153,0.16)]',
    label: 'Orden completada',
  },
  incident_new: {
    Icon: ShieldAlert,
    color: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-400/35',
    ring: 'shadow-[0_0_18px_rgba(248,113,113,0.16)]',
    label: 'Nueva incidencia',
  },
  incident_resolved: {
    Icon: CheckCircle2,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/35',
    ring: 'shadow-[0_0_18px_rgba(52,211,153,0.16)]',
    label: 'Incidencia resuelta',
  },
  incident_status: {
    Icon: AlertTriangle,
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/35',
    ring: 'shadow-[0_0_18px_rgba(251,191,36,0.16)]',
    label: 'Estado de incidencia',
  },
  system: {
    Icon: Zap,
    color: 'text-matrix-primary',
    bg: 'bg-matrix-primary/10',
    border: 'border-matrix-primary/35',
    ring: 'shadow-[0_0_18px_rgba(37,99,235,0.16)]',
    label: 'Sistema',
  },
  info: {
    Icon: Info,
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-400/35',
    ring: 'shadow-[0_0_18px_rgba(34,211,238,0.14)]',
    label: 'Informacion',
  },
};

const DEFAULT_CFG = TYPE_CONFIG.info;

function timeAgo(date) {
  if (!date) return '';
  const diff = Math.max(0, Math.floor((Date.now() - new Date(date)) / 1000));
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d`;
  return new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

function NotificationItem({ item, onRead, onDelete, onNavigate }) {
  const cfg = TYPE_CONFIG[item.type] || DEFAULT_CFG;
  const { Icon } = cfg;
  const unread = !Number(item.is_read);

  return (
    <article
      className={`relative overflow-hidden rounded-lg border p-4 transition ${cfg.border} ${cfg.bg} ${
        unread ? cfg.ring : 'opacity-80'
      } hover:border-matrix-primary/45`}
    >
      {unread && <div className="absolute left-0 top-0 h-full w-1 bg-[#39FF14]" />}
      <div className="flex items-start gap-4">
        <div className={`h-11 w-11 shrink-0 rounded-lg border ${cfg.border} ${cfg.bg} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${cfg.color}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${cfg.border} ${cfg.color} ${cfg.bg}`}>
              {cfg.label}
            </span>
            <span className="text-[11px] text-matrix-muted">{timeAgo(item.created_date)}</span>
            {unread && (
              <span className="rounded-full bg-matrix-primary px-2 py-0.5 text-[10px] font-bold text-black">
                NUEVA
              </span>
            )}
          </div>

          <h3 className="mt-2 text-sm font-bold leading-snug text-matrix-text">{item.title}</h3>
          {item.message && (
            <p className="mt-1 text-sm leading-relaxed text-matrix-muted">{item.message}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {unread && (
              <button
                type="button"
                onClick={() => onRead(item)}
                className="inline-flex items-center gap-2 rounded-md border border-matrix-primary/35 px-3 py-1.5 text-xs font-semibold text-matrix-primary hover:bg-matrix-primary/10"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar leida
              </button>
            )}
            {item.action_url && (
              <button
                type="button"
                onClick={() => onNavigate(item)}
                className="inline-flex items-center gap-1 rounded-md bg-matrix-primary px-3 py-1.5 text-xs font-bold text-black hover:bg-matrix-hover"
              >
                Ver detalle
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="inline-flex items-center gap-2 rounded-md border border-red-400/25 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
    refetchInterval: 30000,
  });

  const notifications = Array.isArray(data)
    ? data
    : Array.isArray(data?.notifications)
      ? data.notifications
      : [];
  const unreadCount = Number(data?.unread_count ?? notifications.filter((item) => !Number(item.is_read)).length);
  const readCount = Math.max(0, notifications.length - unreadCount);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications.filter((item) => {
      if (tab === 'unread' && Number(item.is_read)) return false;
      if (tab === 'read' && !Number(item.is_read)) return false;
      if (!q) return true;
      return `${item.title || ''} ${item.message || ''} ${item.type || ''}`.toLowerCase().includes(q);
    });
  }, [notifications, query, tab]);

  const markReadMut = useMutation({
    mutationFn: (id) => api.notifications.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllMut = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.notifications.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const clearReadMut = useMutation({
    mutationFn: () => api.notifications.clearRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const markRead = (item) => {
    if (!Number(item.is_read)) markReadMut.mutate(item.id);
  };
  const goTo = (item) => {
    markRead(item);
    if (item.action_url) {
      navigate(item.action_url);
      close();
    }
  };

  const notificationCenter = open ? (
        <div className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen bg-black/90 backdrop-blur-md">
          <div className="flex min-h-0 w-full flex-col">
            <header className="border-b border-matrix-primary/20 bg-black/70 px-4 py-4 sm:px-6">
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-matrix-primary/35 bg-matrix-primary/10">
                    <Bell className="h-5 w-5 text-matrix-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-matrix-text">Centro de notificaciones</h2>
                    <p className="text-xs text-matrix-muted">
                      {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al dia'} - {notifications.length} en total
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-matrix-muted" />}
                  <button
                    type="button"
                    onClick={close}
                    className="hidden rounded-md border border-matrix-primary/30 px-4 py-2 text-sm font-semibold text-matrix-primary hover:bg-matrix-primary/10 sm:inline-flex"
                  >
                    Salir
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-md border border-matrix-primary/30 p-2 text-matrix-primary hover:bg-matrix-primary/10"
                    title="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[280px_1fr]">
                <aside className="space-y-3">
                  <div className="rounded-lg border border-matrix-primary/20 bg-black/55 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-matrix-muted">Resumen</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-1">
                      <button
                        type="button"
                        onClick={() => setTab('all')}
                        className={`rounded-md border px-3 py-2 text-left transition ${
                          tab === 'all' ? 'border-matrix-primary/55 bg-matrix-primary/10' : 'border-matrix-primary/15 hover:bg-white/5'
                        }`}
                      >
                        <span className="block text-lg font-bold text-matrix-text">{notifications.length}</span>
                        <span className="text-xs text-matrix-muted">Todas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('unread')}
                        className={`rounded-md border px-3 py-2 text-left transition ${
                          tab === 'unread' ? 'border-matrix-primary/55 bg-matrix-primary/10' : 'border-matrix-primary/15 hover:bg-white/5'
                        }`}
                      >
                        <span className="block text-lg font-bold text-matrix-primary">{unreadCount}</span>
                        <span className="text-xs text-matrix-muted">Sin leer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('read')}
                        className={`rounded-md border px-3 py-2 text-left transition ${
                          tab === 'read' ? 'border-matrix-primary/55 bg-matrix-primary/10' : 'border-matrix-primary/15 hover:bg-white/5'
                        }`}
                      >
                        <span className="block text-lg font-bold text-matrix-text/80">{readCount}</span>
                        <span className="text-xs text-matrix-muted">Leidas</span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-matrix-primary/20 bg-black/55 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-matrix-muted">Acciones</p>
                    <div className="mt-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => markAllMut.mutate()}
                        disabled={unreadCount === 0 || markAllMut.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-matrix-primary/30 px-3 py-2 text-sm font-semibold text-matrix-primary transition hover:bg-matrix-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <CheckCheck className="h-4 w-4" />
                        Marcar todo leido
                      </button>
                      <button
                        type="button"
                        onClick={() => clearReadMut.mutate()}
                        disabled={readCount === 0 || clearReadMut.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-red-400/25 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                        Limpiar leidas
                      </button>
                    </div>
                  </div>
                </aside>

                <section className="min-w-0">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative min-w-0 flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-matrix-muted" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar por titulo, mensaje o tipo..."
                        className="w-full rounded-md border border-matrix-primary/25 bg-black/60 py-2.5 pl-9 pr-3 text-sm text-matrix-text outline-none transition placeholder:text-matrix-muted/50 focus:border-matrix-primary/60"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => qc.invalidateQueries({ queryKey: ['notifications'] })}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-matrix-primary/30 px-3 py-2.5 text-sm font-semibold text-matrix-primary hover:bg-matrix-primary/10"
                    >
                      <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                      Actualizar
                    </button>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-matrix-primary/25 bg-black/45 p-8 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-matrix-primary/20 bg-matrix-primary/5">
                        <BellOff className="h-7 w-7 text-matrix-muted" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-matrix-text">
                        {query ? 'No hay resultados' : 'Sin notificaciones para este usuario'}
                      </p>
                      <p className="mt-1 max-w-sm text-xs text-matrix-muted">
                        {query
                          ? 'Prueba con otro texto de busqueda.'
                          : 'Las notificaciones se guardan por usuario. Si entras como admin veras las alertas administrativas existentes.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {filtered.map((item) => (
                        <NotificationItem
                          key={item.id}
                          item={item}
                          onRead={markRead}
                          onDelete={(id) => deleteMut.mutate(id)}
                          onNavigate={goTo}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </main>
          </div>
        </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex h-10 items-center gap-2 rounded-md border border-matrix-primary/25 bg-matrix-primary/10 px-3 text-matrix-primary transition hover:border-matrix-primary/55 hover:bg-matrix-primary/15"
        title="Notificaciones"
        aria-label={`Notificaciones, ${unreadCount} sin leer`}
      >
        <Bell className="h-5 w-5" />
        <span className="hidden text-sm font-semibold sm:inline">Notificaciones</span>
        {unreadCount > 0 && (
          <span
            className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
            style={{ boxShadow: '0 0 10px rgba(239,68,68,0.8)' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {typeof document !== 'undefined' ? createPortal(notificationCenter, document.body) : notificationCenter}
    </>
  );
}
