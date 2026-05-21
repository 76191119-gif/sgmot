import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, X, CheckCheck, Trash2 } from 'lucide-react';
import { api } from '@/api/localClient';

const TYPE_STYLES = {
  order_new:        { emoji: '📋', cls: 'border-l-blue-500' },
  order_assigned:   { emoji: '🔧', cls: 'border-l-emerald-500' },
  order_status:     { emoji: '⏳', cls: 'border-l-amber-500' },
  order_completed:  { emoji: '✅', cls: 'border-l-emerald-500' },
  incident_new:     { emoji: '🆘', cls: 'border-l-red-500' },
  incident_resolved:{ emoji: '✔️', cls: 'border-l-emerald-500' },
  incident_status:  { emoji: '⚠️', cls: 'border-l-amber-500' },
  system:           { emoji: '🔔', cls: 'border-l-slate-500' },
  info:             { emoji: 'ℹ️', cls: 'border-l-blue-500' },
};

function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;
  return then.toLocaleDateString('es-PE');
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
    refetchInterval: 30000, // refrescar cada 30s
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

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

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleClick = (n) => {
    if (!n.is_read) markReadMut.mutate(n.id);
    if (n.action_url) navigate(n.action_url);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-md hover:bg-muted transition"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <p className="font-semibold text-sm">Notificaciones</p>
              {unreadCount > 0 && <p className="text-[11px] text-muted-foreground">{unreadCount} sin leer</p>}
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMut.mutate()}
                  className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-muted text-primary"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3 h-3" /> Todas
                </button>
              )}
              {notifications.some((n) => n.is_read) && (
                <button
                  onClick={() => clearReadMut.mutate()}
                  className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-muted text-muted-foreground"
                  title="Limpiar leídas"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Sin notificaciones</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((n) => {
                  const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                  return (
                    <li key={n.id} className={`relative group border-l-4 ${style.cls} ${!n.is_read ? 'bg-matrix-primary/5' : ''}`}>
                      <button
                        onClick={() => handleClick(n)}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg shrink-0">{style.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!n.is_read ? 'font-semibold' : 'font-medium'} truncate pr-6`}>{n.title}</p>
                            {n.message && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>}
                            <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_date)}</p>
                          </div>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-matrix-primary mt-2 shrink-0 animate-pulse glow-green-sm" />}
                        </div>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMut.mutate(n.id); }}
                        className="absolute top-2 right-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                        title="Eliminar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
