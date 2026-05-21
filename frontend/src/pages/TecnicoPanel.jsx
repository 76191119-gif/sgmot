import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, AlertTriangle, History, CheckCircle2,
  Clock, Loader, MapPin, Calendar, User as UserIcon, X,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';
import { typeLabels, categoryLabels, formatDate, formatDateTime } from '@/lib/utils';

const TABS = [
  { id: 'orders',    label: 'Mis Órdenes',  icon: ClipboardList },
  { id: 'incidents', label: 'Incidencias',  icon: AlertTriangle },
  { id: 'history',   label: 'Historial',    icon: History },
];

export default function TecnicoPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState('orders');

  const { data: orders = [] }    = useQuery({ queryKey: ['work_orders'], queryFn: api.workOrders.list });
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'],   queryFn: api.incidents.list });

  // Filtrar lo del técnico actual (la API ya filtra, pero por consistencia local)
  const myOrders = orders;
  const pendientes = myOrders.filter((o) => o.status === 'pendiente');
  const enProceso  = myOrders.filter((o) => o.status === 'en_proceso');
  const completed  = myOrders.filter((o) => o.status === 'completado');

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div>
      {/* Header Matrix */}
      <div className="relative overflow-hidden bg-gradient-to-br from-black via-[#001a05] to-black border border-matrix-primary/30 rounded-2xl p-6 mb-6 bg-matrix-grid">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(0,255,65,0.18) 0%, transparent 50%)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[10px] text-matrix-muted uppercase tracking-[0.3em] font-mono mb-1">▶ TÉCNICO ONLINE</p>
            <p className="text-matrix-muted text-xs capitalize">{today}</p>
            <h1 className="text-2xl font-brand font-bold text-matrix-primary text-glow-green mt-1 tracking-wider">
              Hola, {user?.full_name?.split(' ')[0]?.toUpperCase()}
            </h1>
            <p className="text-sm text-matrix-text/70 mt-1">Panel de operación en campo</p>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <Mini label="Pendientes" value={pendientes.length}  icon={Clock}        />
            <Mini label="En Proceso" value={enProceso.length}   icon={Loader}       />
            <Mini label="Completas"  value={completed.length}   icon={CheckCircle2} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${active ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'orders'    && <OrdersBoard enProceso={enProceso} pendientes={pendientes} />}
      {tab === 'incidents' && <IncidentsBoard incidents={incidents} />}
      {tab === 'history'   && <HistoryBoard completed={completed} />}
    </div>
  );
}

function Mini({ label, value, icon: Icon }) {
  return (
    <div className="bg-black/40 backdrop-blur border border-matrix-primary/30 rounded-xl px-3 py-2 text-center">
      <Icon className="w-4 h-4 mx-auto mb-0.5 text-matrix-primary" />
      <p className="text-[10px] text-matrix-muted uppercase tracking-wider">{label}</p>
      <p className="text-xl font-brand font-bold text-matrix-primary text-glow-green">{value}</p>
    </div>
  );
}

/* ---------------- ORDERS BOARD ---------------- */

function OrdersBoard({ enProceso, pendientes }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-6">
      {enProceso.length > 0 && (
        <Section title="En Proceso" color="border-blue-300" orders={enProceso} onClick={setSelected} actionLabel="Marcar Completado" />
      )}
      {pendientes.length > 0 && (
        <Section title="Pendientes" color="border-amber-300" orders={pendientes} onClick={setSelected} actionLabel="Iniciar Trabajo" />
      )}
      {enProceso.length === 0 && pendientes.length === 0 && (
        <EmptyState icon={ClipboardList} title="Sin órdenes asignadas" description="No tienes órdenes pendientes en este momento." />
      )}

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Section({ title, color, orders, onClick, actionLabel }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-1 h-5 rounded-full ${color.replace('border', 'bg').replace('-300', '-500')}`} />
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">({orders.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((o) => (
          <button
            key={o.id}
            onClick={() => onClick(o)}
            className={`text-left bg-card border-l-4 ${color} border border-border rounded-xl p-4 hover:shadow-lg hover:shadow-primary/5 transition-all`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-xs font-mono text-muted-foreground">{o.order_number}</p>
                <p className="font-semibold text-sm mt-0.5">{typeLabels[o.type] || o.type}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusBadge status={o.priority} />
                <StatusBadge status={o.status} />
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-foreground/80"><UserIcon className="w-3 h-3 text-muted-foreground" /> {o.client_name}</div>
              <div className="flex items-center gap-2 text-foreground/80"><MapPin className="w-3 h-3 text-muted-foreground" /> <span className="truncate">{o.client_address}</span></div>
              <div className="flex items-center gap-2 text-foreground/80"><Calendar className="w-3 h-3 text-muted-foreground" /> {formatDate(o.scheduled_date) || '—'}</div>
            </div>
            {o.description && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{o.description}</p>}
            <div className="mt-3 pt-3 border-t border-border">
              <span className="text-xs font-medium text-primary">{actionLabel} →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(order.status === 'pendiente' ? 'en_proceso' : 'completado');
  const [notes, setNotes] = useState(order.resolution_notes || '');

  const mut = useMutation({
    mutationFn: () => api.workOrders.update(order.id, {
      ...order,
      status,
      resolution_notes: notes,
      completed_date: status === 'completado' ? new Date().toISOString().slice(0, 10) : null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work_orders'] }); onClose(); },
  });

  return (
    <Modal open={true} onClose={onClose} title={`Orden ${order.order_number}`}>
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{order.client_name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{typeLabels[order.type] || order.type}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Dirección:</span> <span className="font-medium text-right">{order.client_address}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Fecha:</span> <span className="font-medium">{formatDate(order.scheduled_date) || '—'}</span></div>
          {order.description && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Descripción</p>
              <p className="text-sm">{order.description}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Nuevo estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En Proceso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Notas de resolución</label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describir el trabajo realizado..."
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-input text-sm font-medium hover:bg-muted">Cancelar</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            {mut.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- INCIDENTS BOARD ---------------- */

function IncidentsBoard({ incidents }) {
  const [selected, setSelected] = useState(null);

  if (incidents.length === 0) {
    return <EmptyState icon={AlertTriangle} title="Sin incidencias" description="No hay incidencias activas en este momento." />;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {incidents.map((i) => (
          <button
            key={i.id} onClick={() => setSelected(i)}
            className="text-left bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:shadow-primary/5 transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-semibold text-sm flex-1">{i.title}</p>
              <StatusBadge status={i.priority} />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{i.client_name}</p>
            <p className="text-xs">{categoryLabels[i.category] || i.category}</p>
            {i.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{i.description}</p>}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <StatusBadge status={i.status} />
              <span className="text-xs text-muted-foreground">{formatDateTime(i.created_date)}</span>
            </div>
          </button>
        ))}
      </div>

      {selected && <IncidentAttendModal incident={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function IncidentAttendModal({ incident, onClose }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(incident.status);
  const [resolution, setResolution] = useState(incident.resolution || '');

  const mut = useMutation({
    mutationFn: () => api.incidents.update(incident.id, { ...incident, status, resolution }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); onClose(); },
  });

  return (
    <Modal open={true} onClose={onClose} title="Atender Incidencia">
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Título:</span> <span className="font-medium">{incident.title}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{incident.client_name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Categoría:</span> <span className="font-medium">{categoryLabels[incident.category]}</span></div>
          {incident.description && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Descripción</p>
              <p className="text-sm">{incident.description}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
            <option value="abierta">Abierta</option>
            <option value="en_atencion">En Atención</option>
            <option value="resuelta">Resuelta</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Resolución aplicada</label>
          <textarea rows={4} value={resolution} onChange={(e) => setResolution(e.target.value)}
            placeholder="Describir solución..."
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-input text-sm font-medium hover:bg-muted">Cancelar</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            {mut.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- HISTORY ---------------- */

function HistoryBoard({ completed }) {
  if (completed.length === 0) {
    return <EmptyState icon={History} title="Sin historial" description="Aún no has completado órdenes." />;
  }
  return (
    <div className="space-y-3">
      {completed.map((o) => (
        <div key={o.id} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-xs font-mono text-muted-foreground">{o.order_number}</p>
              <p className="font-semibold text-sm">{o.client_name} — {typeLabels[o.type] || o.type}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={o.status} />
              <p className="text-xs text-muted-foreground mt-1">{formatDate(o.completed_date)}</p>
            </div>
          </div>
          {o.resolution_notes && (
            <div className="mt-2 bg-matrix-primary/10 border border-matrix-primary/30 rounded-md p-3">
              <p className="text-xs font-semibold text-matrix-primary mb-1">Notas de resolución</p>
              <p className="text-xs text-matrix-text">{o.resolution_notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
