import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, AlertTriangle, History, CheckCircle2,
  Clock, Loader, MapPin, Calendar,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';
import { typeLabels, categoryLabels, formatDate, formatDateTime } from '@/lib/utils';

const INPUT  = "w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary focus:ring-1 focus:ring-matrix-primary/50 transition text-matrix-text placeholder:text-matrix-muted/40";
const LABEL  = "block text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider";
const SELECT = `${INPUT} cursor-pointer`;

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

  const myOrders   = orders;
  const pendientes = myOrders.filter((o) => o.status === 'pendiente');
  const enProceso  = myOrders.filter((o) => o.status === 'en_proceso');
  const completed  = myOrders.filter((o) => o.status === 'completado');

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div>
      {/* Header Matrix */}
      <div className="cyber-glass relative overflow-hidden rounded-2xl border border-[#22304A] p-6 mb-6 bg-matrix-grid shadow-2xl">
        <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(57,255,20,0.10) 0%, transparent 50%)' }} />
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
            <Mini label="Pendientes" value={pendientes.length} icon={Clock}        />
            <Mini label="En Proceso" value={enProceso.length}  icon={Loader}       />
            <Mini label="Completas"  value={completed.length}  icon={CheckCircle2} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-matrix-primary/20 mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${active ? 'border-matrix-primary text-matrix-primary' : 'border-transparent text-matrix-muted hover:text-matrix-text hover:border-matrix-primary/40'}`}>
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
        <Section title="En Proceso" accentCls="bg-blue-500" borderCls="border-l-blue-500" orders={enProceso} onClick={setSelected} actionLabel="Marcar Completado" />
      )}
      {pendientes.length > 0 && (
        <Section title="Pendientes" accentCls="bg-amber-500" borderCls="border-l-amber-500" orders={pendientes} onClick={setSelected} actionLabel="Iniciar Trabajo" />
      )}
      {enProceso.length === 0 && pendientes.length === 0 && (
        <EmptyState icon={ClipboardList} title="Sin órdenes asignadas" description="No tienes órdenes pendientes en este momento." />
      )}
      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Section({ title, accentCls, borderCls, orders, onClick, actionLabel }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-1 h-5 rounded-full ${accentCls}`} />
        <h3 className="font-semibold text-matrix-text">{title}</h3>
        <span className="text-xs text-matrix-muted">({orders.length})</span>
      </div>
      <div className="space-y-2 rounded-xl border border-matrix-primary/20 bg-black/60 p-3">
        {orders.map((o) => (
          <div key={o.id} className={`grid grid-cols-1 items-center gap-3 rounded-xl border border-matrix-primary/20 bg-black/55 px-4 py-3 transition hover:border-matrix-primary/45 hover:bg-matrix-primary/[0.035] lg:grid-cols-[minmax(260px,1.6fr)_minmax(170px,1fr)_minmax(210px,1fr)_90px_110px_120px_150px] ${borderCls}`}>
            <div className="min-w-0">
              <p className="font-mono text-[11px] text-matrix-muted">{o.order_number}</p>
              <p className="font-semibold text-matrix-text">{typeLabels[o.type] || o.type}</p>
              {o.description && <p className="mt-1 truncate text-xs text-matrix-muted">{o.description}</p>}
            </div>
            <p className="truncate text-sm text-matrix-text">{o.client_name}</p>
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-matrix-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{o.client_address || '-'}</span>
            </div>
            <StatusBadge status={o.priority} />
            <StatusBadge status={o.status} />
            <p className="text-xs text-matrix-muted">{formatDate(o.scheduled_date) || '-'}</p>
            <button onClick={() => onClick(o)} className="rounded-md border border-matrix-primary/25 px-3 py-1.5 text-xs font-medium text-matrix-primary transition hover:bg-matrix-primary/10">
              {actionLabel}
            </button>
          </div>
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
        <div className="bg-matrix-primary/5 border border-matrix-primary/20 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-matrix-muted">Cliente:</span> <span className="font-medium text-matrix-text">{order.client_name}</span></div>
          <div className="flex justify-between"><span className="text-matrix-muted">Tipo:</span> <span className="font-medium text-matrix-text">{typeLabels[order.type] || order.type}</span></div>
          <div className="flex justify-between"><span className="text-matrix-muted">Dirección:</span> <span className="font-medium text-matrix-text text-right">{order.client_address}</span></div>
          <div className="flex justify-between"><span className="text-matrix-muted">Fecha:</span> <span className="font-medium text-matrix-text">{formatDate(order.scheduled_date) || '—'}</span></div>
          {order.description && (
            <div className="pt-2 border-t border-matrix-primary/15">
              <p className="text-xs text-matrix-muted mb-1">Descripción</p>
              <p className="text-sm text-matrix-text">{order.description}</p>
            </div>
          )}
        </div>

        <div>
          <label className={LABEL}>Nuevo estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT}>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En Proceso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label className={LABEL}>Notas de resolución</label>
          <textarea
            rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Describir el trabajo realizado..."
            className={INPUT}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-matrix-primary/15">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-matrix-primary/30 text-sm font-medium text-matrix-muted hover:text-matrix-text hover:bg-matrix-primary/5 transition">Cancelar</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending} className="px-5 py-2 rounded-md bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50 uppercase tracking-wider">
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
      <div className="space-y-2 rounded-xl border border-matrix-primary/20 bg-black/60 p-3">
        {incidents.map((i) => (
          <div key={i.id} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-matrix-primary/20 bg-black/55 px-4 py-3 transition hover:border-matrix-primary/45 hover:bg-matrix-primary/[0.035] lg:grid-cols-[minmax(260px,1.6fr)_minmax(170px,1fr)_150px_90px_110px_140px_110px]">
            <div className="min-w-0">
              <p className="truncate font-semibold text-matrix-text">{i.title}</p>
              {i.description && <p className="mt-1 truncate text-xs text-matrix-muted">{i.description}</p>}
            </div>
            <p className="truncate text-sm text-matrix-text">{i.client_name}</p>
            <p className="text-xs text-matrix-muted">{categoryLabels[i.category] || i.category}</p>
            <StatusBadge status={i.priority} />
            <StatusBadge status={i.status} />
            <p className="text-xs text-matrix-muted">{formatDateTime(i.created_date)}</p>
            <button onClick={() => setSelected(i)} className="rounded-md border border-matrix-primary/25 px-3 py-1.5 text-xs font-medium text-matrix-primary transition hover:bg-matrix-primary/10">
              Atender
            </button>
          </div>
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
        <div className="bg-matrix-primary/5 border border-matrix-primary/20 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-matrix-muted">Título:</span> <span className="font-medium text-matrix-text">{incident.title}</span></div>
          <div className="flex justify-between"><span className="text-matrix-muted">Cliente:</span> <span className="font-medium text-matrix-text">{incident.client_name}</span></div>
          <div className="flex justify-between"><span className="text-matrix-muted">Categoría:</span> <span className="font-medium text-matrix-text">{categoryLabels[incident.category]}</span></div>
          {incident.description && (
            <div className="pt-2 border-t border-matrix-primary/15">
              <p className="text-xs text-matrix-muted mb-1">Descripción</p>
              <p className="text-sm text-matrix-text">{incident.description}</p>
            </div>
          )}
        </div>

        <div>
          <label className={LABEL}>Estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT}>
            <option value="abierta">Abierta</option>
            <option value="en_atencion">En Atención</option>
            <option value="resuelta">Resuelta</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </div>

        <div>
          <label className={LABEL}>Resolución aplicada</label>
          <textarea rows={4} value={resolution} onChange={(e) => setResolution(e.target.value)}
            placeholder="Describir solución..." className={INPUT} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-matrix-primary/15">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-matrix-primary/30 text-sm font-medium text-matrix-muted hover:text-matrix-text hover:bg-matrix-primary/5 transition">Cancelar</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending} className="px-5 py-2 rounded-md bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50 uppercase tracking-wider">
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
    <div className="space-y-2 rounded-xl border border-matrix-primary/20 bg-black/60 p-3">
      {completed.map((o) => (
        <div key={o.id} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-matrix-primary/20 bg-black/55 px-4 py-3 transition hover:border-matrix-primary/45 hover:bg-matrix-primary/[0.035] lg:grid-cols-[minmax(260px,1.6fr)_minmax(170px,1fr)_110px_120px_minmax(260px,1.4fr)]">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-matrix-muted">{o.order_number}</p>
            <p className="font-semibold text-matrix-text">{typeLabels[o.type] || o.type}</p>
          </div>
          <p className="truncate text-sm text-matrix-text">{o.client_name}</p>
          <StatusBadge status={o.status} />
          <p className="text-xs text-matrix-muted">{formatDate(o.completed_date)}</p>
          <p className="truncate text-xs text-matrix-muted">{o.resolution_notes || '-'}</p>
        </div>
      ))}
    </div>
  );
}

