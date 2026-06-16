import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, AlertTriangle, Users, HardHat, UserCog,
  CheckCircle2, Search, Plus, Pencil, Trash2, TrendingUp,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { useToast } from '@/lib/ToastContext';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import OrdersChart from '@/components/dashboard/OrdersChart';
import WorkOrderForm from '@/components/orders/WorkOrderForm';
import IncidentForm from '@/components/incidents/IncidentForm';
import ClientForm from '@/components/clients/ClientForm';
import TechnicianForm from '@/components/technicians/TechnicianForm';
import { typeLabels, categoryLabels, planLabels, specialtyLabels, formatDate } from '@/lib/utils';

const TABS = [
  { id: 'overview',    label: 'Resumen',     icon: LayoutDashboard },
  { id: 'orders',      label: 'Órdenes',     icon: ClipboardList },
  { id: 'incidents',   label: 'Incidencias', icon: AlertTriangle },
  { id: 'clients',     label: 'Clientes',    icon: Users },
  { id: 'technicians', label: 'Técnicos',    icon: HardHat },
];

export default function AdminPanel() {
  const [tab, setTab] = useState('overview');
  const qc = useQueryClient();

  const { data: clients = [] }     = useQuery({ queryKey: ['clients'],     queryFn: api.clients.list });
  const { data: technicians = [] } = useQuery({ queryKey: ['technicians'], queryFn: api.technicians.list });
  const { data: orders = [] }      = useQuery({ queryKey: ['work_orders'], queryFn: api.workOrders.list });
  const { data: incidents = [] }   = useQuery({ queryKey: ['incidents'],   queryFn: api.incidents.list });

  // KPIs
  const activeClients     = clients.filter((c) => c.status === 'activo').length;
  const availableTechs    = technicians.filter((t) => t.status === 'disponible').length;
  const activeOrders      = orders.filter((o) => ['pendiente', 'en_proceso'].includes(o.status)).length;
  const openIncidents     = incidents.filter((i) => ['abierta', 'en_atencion'].includes(i.status)).length;
  const completedOrders   = orders.filter((o) => o.status === 'completado').length;
  const completionRate    = orders.length ? Math.round((completedOrders / orders.length) * 100) : 0;

  const orderStatusCounts = {
    pendiente:  orders.filter((o) => o.status === 'pendiente').length,
    en_proceso: orders.filter((o) => o.status === 'en_proceso').length,
    completado: completedOrders,
    cancelado:  orders.filter((o) => o.status === 'cancelado').length,
  };

  return (
    <div>
      {/* Header Matrix */}
      <div className="cyber-glass relative overflow-hidden rounded-2xl border border-[#22304A] p-6 mb-6 bg-matrix-grid shadow-2xl">
        <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(57,255,20,0.10) 0%, transparent 50%)' }} />
        <div className="relative">
          <p className="text-[10px] text-matrix-muted uppercase tracking-[0.3em] font-mono mb-1">▶ ADMIN CONSOLE</p>
          <h1 className="text-2xl font-brand font-bold text-matrix-primary text-glow-green tracking-wider">PANEL DE ADMINISTRACIÓN</h1>
          <p className="text-sm text-matrix-text/70 mt-1">Vista general del sistema SGMOT · Control total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-matrix-primary/20 mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${active
                    ? 'border-matrix-primary text-matrix-primary'
                    : 'border-transparent text-matrix-muted hover:text-matrix-text hover:border-matrix-primary/40'}`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Resumen */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Clientes Activos"      value={activeClients}  icon={Users}         color="primary" subtitle={`${clients.length} total`} />
            <StatCard label="Técnicos Disponibles"  value={availableTechs} icon={HardHat}       color="green"   subtitle={`${technicians.length} total`} />
            <StatCard label="Órdenes Activas"       value={activeOrders}   icon={ClipboardList} color="yellow"  subtitle={`${orders.length} total`} />
            <StatCard label="Incidencias Abiertas"  value={openIncidents}  icon={AlertTriangle} color="red"     subtitle={`${incidents.length} total`} />
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm">Tasa de completado: </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-matrix-primary/20 text-matrix-primary border border-matrix-primary/40 uppercase tracking-wider">
              {completionRate}%
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <OrdersChart orders={orders} />
            </div>
            <div className="bg-black/60 border border-matrix-primary/20 rounded-xl p-5">
              <h3 className="font-semibold mb-4 text-matrix-text">Distribución de Órdenes</h3>
              <div className="space-y-3">
                {Object.entries(orderStatusCounts).map(([key, count]) => {
                  const pct = orders.length ? (count / orders.length) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <StatusBadge status={key} />
                        <span className="font-medium text-matrix-text">{count}</span>
                      </div>
                      <div className="h-1.5 bg-matrix-primary/10 rounded-full overflow-hidden">
                        <div className="h-full bg-matrix-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Órdenes recientes */}
            <div className="bg-black/60 border border-matrix-primary/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-matrix-text">Órdenes Recientes</h3>
                <Link to="/work-orders" className="text-xs text-matrix-primary hover:underline">Ver todas</Link>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-matrix-muted text-center py-6">Sin órdenes</p>
              ) : (
                <ul className="divide-y divide-matrix-primary/[0.08]">
                  {orders.slice(0, 5).map((o) => (
                    <li key={o.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-matrix-muted">{o.order_number}</p>
                        <p className="text-sm font-medium truncate text-matrix-text">{o.client_name}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Incidencias recientes */}
            <div className="bg-black/60 border border-matrix-primary/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-matrix-text">Incidencias Recientes</h3>
                <Link to="/incidents" className="text-xs text-matrix-primary hover:underline">Ver todas</Link>
              </div>
              {incidents.length === 0 ? (
                <p className="text-sm text-matrix-muted text-center py-6">Sin incidencias</p>
              ) : (
                <ul className="divide-y divide-matrix-primary/[0.08]">
                  {incidents.slice(0, 5).map((i) => (
                    <li key={i.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate text-matrix-text">{i.title}</p>
                        <p className="text-xs text-matrix-muted truncate">{i.client_name}</p>
                      </div>
                      <StatusBadge status={i.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'orders'      && <OrdersTab      orders={orders}      qc={qc} />}
      {tab === 'incidents'   && <IncidentsTab   incidents={incidents} qc={qc} />}
      {tab === 'clients'     && <ClientsTab     clients={clients}    qc={qc} />}
      {tab === 'technicians' && <TechniciansTab technicians={technicians} qc={qc} />}
    </div>
  );
}

/* ----------------------- TABS INTERNOS ----------------------- */

function OrdersTab({ orders, qc }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const createMut = useMutation({ mutationFn: (d) => api.workOrders.create(d),    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work_orders'] }); setOpen(false); setEditing(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => api.workOrders.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['work_orders'] }); setOpen(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: (id) => api.workOrders.delete(id),  onSuccess: () => { qc.invalidateQueries({ queryKey: ['work_orders'] }); setConfirm(null); } });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) =>
      (!q || (o.client_name || '').toLowerCase().includes(q) || (o.order_number || '').toLowerCase().includes(q)) &&
      (statusFilter === 'todos' || o.status === statusFilter)
    );
  }, [orders, search, statusFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-matrix-muted" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition placeholder:text-matrix-muted/40"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition cursor-pointer">
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En Proceso</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 bg-matrix-primary text-black rounded-md px-3 py-2 text-sm font-bold hover:bg-matrix-hover transition uppercase tracking-wider">
          <Plus className="w-4 h-4" /> Nueva Orden
        </button>
      </div>

      <div className="bg-black/60 border border-matrix-primary/20 rounded-xl overflow-hidden">
        {filtered.length === 0 ? <EmptyState icon={ClipboardList} title="Sin órdenes" /> : (
          <div className="space-y-2 p-3">
            {filtered.map((o) => (
              <div key={o.id} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-matrix-primary/20 bg-black/55 px-4 py-3 transition hover:border-matrix-primary/45 hover:bg-matrix-primary/[0.035] lg:grid-cols-[minmax(240px,1.5fr)_minmax(170px,1fr)_minmax(150px,0.9fr)_minmax(140px,0.8fr)_110px_90px_120px_80px]">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-matrix-muted">{o.order_number}</p>
                  <p className="truncate font-semibold text-matrix-text">{typeLabels[o.type] || o.type}</p>
                </div>
                <p className="truncate text-sm text-matrix-text">{o.client_name}</p>
                <p className="truncate text-xs text-matrix-muted">{o.technician_name || 'Sin asignar'}</p>
                <p className="truncate text-xs text-matrix-text">{typeLabels[o.type] || o.type}</p>
                <StatusBadge status={o.status} />
                <StatusBadge status={o.priority} />
                <p className="text-xs text-matrix-muted">{formatDate(o.scheduled_date) || '-'}</p>
                <div className="flex justify-end gap-1">
                  <button onClick={() => { setEditing(o); setOpen(true); }} className="rounded-md p-2 text-matrix-muted transition hover:bg-matrix-primary/10 hover:text-matrix-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setConfirm(o)} className="rounded-md p-2 text-matrix-muted transition hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? 'Editar orden' : 'Nueva orden'} maxWidth="max-w-3xl">
        <WorkOrderForm
          initial={editing}
          onSubmit={(data) => editing ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data)}
          onCancel={() => { setOpen(false); setEditing(null); }}
          loading={createMut.isPending || updateMut.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)} onClose={() => setConfirm(null)}
        onConfirm={() => deleteMut.mutate(confirm.id)}
        title="Eliminar orden"
        message={`¿Eliminar la orden ${confirm?.order_number}?`}
        loading={deleteMut.isPending}
      />
    </div>
  );
}

function IncidentsTab({ incidents, qc }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const createMut = useMutation({ mutationFn: (d) => api.incidents.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setOpen(false); setEditing(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => api.incidents.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setOpen(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: (id) => api.incidents.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setConfirm(null); } });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return incidents.filter((i) =>
      (!q || (i.title || '').toLowerCase().includes(q) || (i.client_name || '').toLowerCase().includes(q)) &&
      (statusFilter === 'todos' || i.status === statusFilter)
    );
  }, [incidents, search, statusFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-matrix-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition placeholder:text-matrix-muted/40" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition cursor-pointer">
          <option value="todos">Todos los estados</option>
          <option value="abierta">Abierta</option>
          <option value="en_atencion">En Atención</option>
          <option value="resuelta">Resuelta</option>
          <option value="cerrada">Cerrada</option>
        </select>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 bg-matrix-primary text-black rounded-md px-3 py-2 text-sm font-bold hover:bg-matrix-hover transition uppercase tracking-wider">
          <Plus className="w-4 h-4" /> Nueva Incidencia
        </button>
      </div>

      <div className="bg-black/60 border border-matrix-primary/20 rounded-xl overflow-hidden">
        {filtered.length === 0 ? <EmptyState icon={AlertTriangle} title="Sin incidencias" /> : (
          <div className="space-y-2 p-3">
            {filtered.map((i) => (
              <div key={i.id} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-matrix-primary/20 bg-black/55 px-4 py-3 transition hover:border-matrix-primary/45 hover:bg-matrix-primary/[0.035] lg:grid-cols-[minmax(260px,1.7fr)_minmax(170px,1fr)_150px_90px_110px_120px_80px]">
                <p className="truncate font-semibold text-matrix-text">{i.title}</p>
                <p className="truncate text-sm text-matrix-text">{i.client_name}</p>
                <p className="text-xs text-matrix-muted">{categoryLabels[i.category] || i.category}</p>
                <StatusBadge status={i.priority} />
                <StatusBadge status={i.status} />
                <p className="text-xs text-matrix-muted">{formatDate(i.created_date)}</p>
                <div className="flex justify-end gap-1">
                  <button onClick={() => { setEditing(i); setOpen(true); }} className="rounded-md p-2 text-matrix-muted transition hover:bg-matrix-primary/10 hover:text-matrix-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setConfirm(i)} className="rounded-md p-2 text-matrix-muted transition hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? 'Editar incidencia' : 'Nueva incidencia'}>
        <IncidentForm
          initial={editing}
          onSubmit={(data) => editing ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data)}
          onCancel={() => { setOpen(false); setEditing(null); }}
          loading={createMut.isPending || updateMut.isPending}
        />
      </Modal>

      <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={() => deleteMut.mutate(confirm.id)} title="Eliminar incidencia" message={`¿Eliminar "${confirm?.title}"?`} loading={deleteMut.isPending} />
    </div>
  );
}

function ClientsTab({ clients, qc }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const createMut = useMutation({ mutationFn: (d) => api.clients.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setOpen(false); setEditing(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => api.clients.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setOpen(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: (id) => api.clients.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setConfirm(null); } });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return clients.filter((c) =>
      (!q || (c.full_name || '').toLowerCase().includes(q) || (c.dni || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q)) &&
      (statusFilter === 'todos' || c.status === statusFilter)
    );
  }, [clients, search, statusFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-matrix-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition placeholder:text-matrix-muted/40" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition cursor-pointer">
          <option value="todos">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="suspendido">Suspendido</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 bg-matrix-primary text-black rounded-md px-3 py-2 text-sm font-bold hover:bg-matrix-hover transition uppercase tracking-wider">
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      <div className="bg-black/60 border border-matrix-primary/20 rounded-xl overflow-hidden">
        {filtered.length === 0 ? <EmptyState icon={Users} title="Sin clientes" /> : (
          <div className="space-y-2 p-3">
            {filtered.map((c) => (
              <div key={c.id} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-matrix-primary/20 bg-black/55 px-4 py-3 transition hover:border-matrix-primary/45 hover:bg-matrix-primary/[0.035] lg:grid-cols-[minmax(240px,1.5fr)_120px_130px_170px_110px_80px]">
                <p className="truncate font-semibold text-matrix-text">{c.full_name}</p>
                <p className="font-mono text-xs text-matrix-muted">{c.dni}</p>
                <p className="text-xs text-matrix-muted">{c.phone}</p>
                <p className="text-xs text-matrix-text">{planLabels[c.plan] || c.plan}</p>
                <StatusBadge status={c.status} />
                <div className="flex justify-end gap-1">
                  <button onClick={() => { setEditing(c); setOpen(true); }} className="rounded-md p-2 text-matrix-muted transition hover:bg-matrix-primary/10 hover:text-matrix-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setConfirm(c)} className="rounded-md p-2 text-matrix-muted transition hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
        <ClientForm
          initial={editing}
          onSubmit={(data) => editing ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data)}
          onCancel={() => { setOpen(false); setEditing(null); }}
          loading={createMut.isPending || updateMut.isPending}
        />
      </Modal>

      <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={() => deleteMut.mutate(confirm.id)} title="Eliminar cliente" message={`¿Eliminar a "${confirm?.full_name}"?`} loading={deleteMut.isPending} />
    </div>
  );
}

function TechniciansTab({ technicians, qc }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const createMut = useMutation({ mutationFn: (d) => api.technicians.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['technicians'] }); setOpen(false); setEditing(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => api.technicians.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['technicians'] }); setOpen(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: (id) => api.technicians.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['technicians'] }); setConfirm(null); } });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return technicians;
    return technicians.filter((t) => (t.full_name || '').toLowerCase().includes(q) || (t.dni || '').toLowerCase().includes(q));
  }, [technicians, search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-matrix-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition placeholder:text-matrix-muted/40" />
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 bg-matrix-primary text-black rounded-md px-3 py-2 text-sm font-bold hover:bg-matrix-hover transition uppercase tracking-wider">
          <Plus className="w-4 h-4" /> Nuevo Técnico
        </button>
      </div>

      {filtered.length === 0 ? <EmptyState icon={HardHat} title="Sin técnicos" /> : (
        <div className="space-y-2 rounded-xl border border-matrix-primary/20 bg-black/60 p-3">
          {filtered.map((t) => (
            <div key={t.id} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-matrix-primary/20 bg-black/55 px-4 py-3 transition hover:border-matrix-primary/45 hover:bg-matrix-primary/[0.035] lg:grid-cols-[minmax(240px,1.5fr)_120px_130px_170px_minmax(160px,1fr)_110px_80px]">
              <div className="min-w-0">
                <p className="truncate font-semibold text-matrix-text">{t.full_name}</p>
                <p className="truncate text-xs text-matrix-muted">{t.email || 'Sin email'}</p>
              </div>
              <p className="font-mono text-xs text-matrix-muted">{t.dni}</p>
              <p className="text-xs text-matrix-muted">{t.phone}</p>
              <p className="text-xs text-matrix-text">{specialtyLabels[t.specialty] || t.specialty}</p>
              <p className="truncate text-xs text-matrix-muted">{t.zone || 'Sin zona'}</p>
              <StatusBadge status={t.status} />
              <div className="flex justify-end gap-1">
                <button onClick={() => { setEditing(t); setOpen(true); }} className="rounded-md p-2 text-matrix-muted transition hover:bg-matrix-primary/10 hover:text-matrix-primary">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setConfirm(t)} className="rounded-md p-2 text-matrix-muted transition hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? 'Editar técnico' : 'Nuevo técnico'}>
        <TechnicianForm
          initial={editing}
          onSubmit={(data) => editing ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data)}
          onCancel={() => { setOpen(false); setEditing(null); }}
          loading={createMut.isPending || updateMut.isPending}
        />
      </Modal>

      <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={() => deleteMut.mutate(confirm.id)} title="Eliminar técnico" message={`¿Eliminar a "${confirm?.full_name}"?`} loading={deleteMut.isPending} />
    </div>
  );
}

