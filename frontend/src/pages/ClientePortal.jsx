import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Home, ClipboardList, AlertTriangle, MapPin, Wrench, AlertCircle,
  CheckCircle2, Loader, Phone,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';
import { typeLabels, categoryLabels, planLabels, formatDate, formatDateTime } from '@/lib/utils';

const PLAN_COLORS = {
  basico_30mbps:       'bg-slate-500/20 text-slate-300 border-slate-500/40',
  estandar_60mbps:     'bg-blue-500/20 text-blue-300 border-blue-500/40',
  premium_100mbps:     'bg-purple-500/20 text-purple-300 border-purple-500/40',
  empresarial_200mbps: 'bg-matrix-primary/20 text-matrix-primary border-matrix-primary/40',
};

const TABS = [
  { id: 'home',      label: 'Inicio',         icon: Home },
  { id: 'orders',    label: 'Mis Órdenes',    icon: ClipboardList },
  { id: 'incidents', label: 'Mis Incidencias', icon: AlertTriangle },
];

export default function ClientePortal() {
  const { user } = useAuth();
  const [tab, setTab] = useState('home');
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);

  const { data: clients = [] }   = useQuery({ queryKey: ['clients'],     queryFn: api.clients.list });
  const { data: orders = [] }    = useQuery({ queryKey: ['work_orders'], queryFn: api.workOrders.list });
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'],   queryFn: api.incidents.list });

  // Buscar el cliente que corresponde al usuario logueado
  const myClient = clients.find((c) => c.email === user?.email);

  const activeOrders   = orders.filter((o) => ['pendiente', 'en_proceso'].includes(o.status)).length;
  const completed      = orders.filter((o) => o.status === 'completado').length;
  const openIncidents  = incidents.filter((i) => ['abierta', 'en_atencion'].includes(i.status)).length;

  return (
    <div>
      {/* Header Matrix */}
      <div className="relative overflow-hidden bg-gradient-to-br from-black via-[#001a05] to-black border border-matrix-primary/30 rounded-2xl p-6 mb-6 bg-matrix-grid">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(0,255,255,0.15) 0%, transparent 50%)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[10px] text-matrix-muted uppercase tracking-[0.3em] font-mono mb-1">▶ PORTAL CLIENTE</p>
            <h1 className="text-2xl font-brand font-bold text-matrix-primary text-glow-green tracking-wider">{user?.full_name}</h1>
            {myClient && (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md border uppercase tracking-wider ${PLAN_COLORS[myClient.plan] || PLAN_COLORS.basico_30mbps}`}>
                    {planLabels[myClient.plan]}
                  </span>
                  <StatusBadge status={myClient.status} />
                </div>
                <p className="text-sm text-matrix-text/70 mt-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {myClient.address}
                </p>
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Mini label="Activas"      value={activeOrders}  />
            <Mini label="Completadas"  value={completed}     />
            <Mini label="Incidencias"  value={openIncidents} />
          </div>
        </div>
      </div>

      {/* Botones rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setOrderModalOpen(true)}
          className="bg-black/60 border border-matrix-primary/25 rounded-xl p-4 text-left hover:border-matrix-primary/50 hover:bg-black/70 transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-matrix-primary/10 border border-matrix-primary/25 text-matrix-primary flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm text-matrix-text">Solicitar Servicio</p>
            <p className="text-xs text-matrix-muted">Instalación, soporte o mantenimiento</p>
          </div>
        </button>
        <button
          onClick={() => setIncidentModalOpen(true)}
          className="bg-black/60 border border-amber-500/25 rounded-xl p-4 text-left hover:border-amber-500/50 hover:bg-black/70 transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm text-matrix-text">Reportar Problema</p>
            <p className="text-xs text-matrix-muted">Algo no funciona como debería</p>
          </div>
        </button>
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

      {tab === 'home' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentOrdersCard orders={orders} />
          <RecentIncidentsCard incidents={incidents} />
        </div>
      )}

      {tab === 'orders' && <OrdersList orders={orders} onNew={() => setOrderModalOpen(true)} />}
      {tab === 'incidents' && <IncidentsList incidents={incidents} onNew={() => setIncidentModalOpen(true)} />}

      {orderModalOpen && (
        <RequestServiceModal
          client={myClient}
          onClose={() => setOrderModalOpen(false)}
        />
      )}
      {incidentModalOpen && (
        <ReportProblemModal
          client={myClient}
          onClose={() => setIncidentModalOpen(false)}
        />
      )}
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="bg-black/40 backdrop-blur border border-matrix-primary/30 rounded-xl px-3 py-2 text-center">
      <p className="text-[10px] text-matrix-muted uppercase tracking-wider">{label}</p>
      <p className="text-xl font-brand font-bold text-matrix-primary text-glow-green">{value}</p>
    </div>
  );
}

function RecentOrdersCard({ orders }) {
  const recent = orders.slice(0, 4);
  return (
    <div className="bg-black/60 border border-matrix-primary/20 rounded-xl p-5">
      <h3 className="font-semibold mb-4 text-matrix-text">Órdenes Recientes</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-matrix-muted text-center py-6">Sin órdenes</p>
      ) : (
        <ul className="divide-y divide-matrix-primary/[0.08]">
          {recent.map((o) => (
            <li key={o.id} className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-matrix-text">{typeLabels[o.type] || o.type}</p>
                <p className="text-xs font-mono text-matrix-muted">{o.order_number}</p>
              </div>
              <StatusBadge status={o.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentIncidentsCard({ incidents }) {
  const recent = incidents.slice(0, 4);
  return (
    <div className="bg-black/60 border border-matrix-primary/20 rounded-xl p-5">
      <h3 className="font-semibold mb-4 text-matrix-text">Incidencias Recientes</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-matrix-muted text-center py-6">Sin incidencias</p>
      ) : (
        <ul className="divide-y divide-matrix-primary/[0.08]">
          {recent.map((i) => (
            <li key={i.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-matrix-text truncate">{i.title}</p>
                <p className="text-xs text-matrix-muted">{categoryLabels[i.category]}</p>
              </div>
              <StatusBadge status={i.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrdersList({ orders, onNew }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-matrix-muted">{orders.length} orden{orders.length !== 1 ? 'es' : ''}</p>
        <button onClick={onNew} className="inline-flex items-center gap-2 bg-matrix-primary text-black rounded-md px-3 py-2 text-sm font-bold hover:bg-matrix-hover transition uppercase tracking-wider">
          <Wrench className="w-4 h-4" /> Nueva Solicitud
        </button>
      </div>
      {orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin órdenes" description="No tienes órdenes registradas." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-black/60 border border-matrix-primary/20 rounded-xl p-4 hover:border-matrix-primary/35 transition">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono text-matrix-muted">{o.order_number}</p>
                  <p className="font-semibold text-sm mt-0.5 text-matrix-text">{typeLabels[o.type] || o.type}</p>
                  {o.description && <p className="text-xs text-matrix-muted mt-1">{o.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-matrix-muted">
                    {o.technician_name && <span className="inline-flex items-center gap-1"><Wrench className="w-3 h-3" /> {o.technician_name}</span>}
                    {o.scheduled_date && <span>📅 {formatDate(o.scheduled_date)}</span>}
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col gap-1 items-end">
                  <StatusBadge status={o.priority} />
                  <StatusBadge status={o.status} />
                </div>
              </div>
              {o.resolution_notes && (
                <div className="mt-3 bg-matrix-primary/10 border border-matrix-primary/30 rounded-md p-3">
                  <p className="text-xs font-semibold text-matrix-primary mb-1">Resolución del técnico</p>
                  <p className="text-xs text-matrix-text">{o.resolution_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IncidentsList({ incidents, onNew }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-matrix-muted">{incidents.length} incidencia{incidents.length !== 1 ? 's' : ''}</p>
        <button onClick={onNew} className="inline-flex items-center gap-2 bg-amber-500 text-white rounded-md px-3 py-2 text-sm font-bold hover:bg-amber-600 transition uppercase tracking-wider">
          <AlertCircle className="w-4 h-4" /> Reportar Problema
        </button>
      </div>
      {incidents.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Sin incidencias" description="No tienes incidencias reportadas." />
      ) : (
        <div className="space-y-3">
          {incidents.map((i) => (
            <div key={i.id} className="bg-black/60 border border-matrix-primary/20 rounded-xl p-4 hover:border-matrix-primary/35 transition">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-matrix-text">{i.title}</p>
                  <p className="text-xs text-matrix-muted mt-0.5">{categoryLabels[i.category]}</p>
                  {i.description && <p className="text-xs text-matrix-muted mt-1">{i.description}</p>}
                  <p className="text-xs text-matrix-muted/60 mt-2">{formatDateTime(i.created_date)}</p>
                </div>
                <div className="flex flex-row sm:flex-col gap-1 items-end">
                  <StatusBadge status={i.priority} />
                  <StatusBadge status={i.status} />
                </div>
              </div>
              {i.resolution && (
                <div className="mt-3 bg-matrix-primary/10 border border-matrix-primary/30 rounded-md p-3">
                  <p className="text-xs font-semibold text-matrix-primary mb-1">Resolución aplicada</p>
                  <p className="text-xs text-matrix-text">{i.resolution}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- MODALES DE SOLICITUD ---------------- */

function RequestServiceModal({ client, onClose }) {
  const qc = useQueryClient();
  const [type, setType] = useState('soporte');
  const [priority, setPriority] = useState('media');
  const [description, setDescription] = useState('');

  const mut = useMutation({
    mutationFn: () => api.workOrders.create({
      type, priority, description,
      client_id: client?.id,
      client_name: client?.full_name,
      client_address: client?.address,
      status: 'pendiente',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work_orders'] }); onClose(); },
  });

  if (!client) {
    return (
      <Modal open={true} onClose={onClose} title="Solicitar Servicio">
        <p className="text-sm text-matrix-muted">No se encontró tu ficha de cliente. Contacta al administrador.</p>
      </Modal>
    );
  }

  return (
    <Modal open={true} onClose={onClose} title="Solicitar Servicio">
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider">Tipo de servicio</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary transition text-matrix-text cursor-pointer">
              <option value="soporte">Soporte Técnico</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="retiro">Retiro de Equipo</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider">Prioridad</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary transition text-matrix-text cursor-pointer">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider">Describe lo que necesitas</label>
          <textarea
            rows={4} required value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary transition text-matrix-text placeholder:text-matrix-muted/40"
            placeholder="Detalla tu solicitud..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-matrix-primary/15">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-matrix-primary/30 text-sm font-medium text-matrix-muted hover:text-matrix-text hover:bg-matrix-primary/5 transition">Cancelar</button>
          <button type="submit" disabled={mut.isPending} className="px-5 py-2 rounded-md bg-matrix-primary text-black text-sm font-bold hover:bg-matrix-hover transition disabled:opacity-50 uppercase tracking-wider">
            {mut.isPending ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReportProblemModal({ client, onClose }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('sin_servicio');
  const [priority, setPriority] = useState('media');
  const [description, setDescription] = useState('');

  const mut = useMutation({
    mutationFn: () => api.incidents.create({
      title, category, priority, description,
      client_id: client?.id,
      client_name: client?.full_name,
      status: 'abierta',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); onClose(); },
  });

  if (!client) {
    return (
      <Modal open={true} onClose={onClose} title="Reportar Problema">
        <p className="text-sm text-matrix-muted">No se encontró tu ficha de cliente. Contacta al administrador.</p>
      </Modal>
    );
  }

  return (
    <Modal open={true} onClose={onClose} title="Reportar Problema">
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider">Título *</label>
          <input
            required value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Sin internet desde la mañana"
            className="w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary transition text-matrix-text placeholder:text-matrix-muted/40"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider">Categoría</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary transition text-matrix-text cursor-pointer">
              <option value="sin_servicio">Sin Servicio</option>
              <option value="lentitud">Lentitud</option>
              <option value="corte_fibra">Corte de Fibra</option>
              <option value="equipo_danado">Equipo Dañado</option>
              <option value="configuracion">Configuración</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider">Prioridad</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary transition text-matrix-text cursor-pointer">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider">Descripción</label>
          <textarea
            rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el problema con detalle..."
            className="w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary transition text-matrix-text placeholder:text-matrix-muted/40"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-matrix-primary/15">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-matrix-primary/30 text-sm font-medium text-matrix-muted hover:text-matrix-text hover:bg-matrix-primary/5 transition">Cancelar</button>
          <button type="submit" disabled={mut.isPending} className="px-5 py-2 rounded-md bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition disabled:opacity-50 uppercase tracking-wider">
            {mut.isPending ? 'Enviando...' : 'Reportar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
