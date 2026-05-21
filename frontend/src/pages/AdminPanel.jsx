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
import { typeLabels, categoryLabels, planLabels, specialtyLabels, formatDate, getInitials } from '@/lib/utils';

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
      <div className="relative overflow-hidden bg-gradient-to-br from-black via-[#001a05] to-black border border-matrix-primary/30 rounded-2xl p-6 mb-6 bg-matrix-grid">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(0,255,65,0.15) 0%, transparent 50%)' }} />
        <div className="relative">
          <p className="text-[10px] text-matrix-muted uppercase tracking-[0.3em] font-mono mb-1">▶ ADMIN CONSOLE</p>
          <h1 className="text-2xl font-brand font-bold text-matrix-primary text-glow-green tracking-wider">PANEL DE ADMINISTRACIÓN</h1>
          <p className="text-sm text-matrix-text/70 mt-1">Vista general del sistema SGMOT · Control total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6 overflow-x-auto">
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
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
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
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-4">Distribución de Órdenes</h3>
              <div className="space-y-3">
                {Object.entries(orderStatusCounts).map(([key, count]) => {
                  const pct = orders.length ? (count / orders.length) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <StatusBadge status={key} />
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Órdenes recientes */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Órdenes Recientes</h3>
                <Link to="/work-orders" className="text-xs text-primary hover:underline">Ver todas</Link>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin órdenes</p>
              ) : (
                <ul className="divide-y divide-border">
                  {orders.slice(0, 5).map((o) => (
                    <li key={o.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-muted-foreground">{o.order_number}</p>
                        <p className="text-sm font-medium truncate">{o.client_name}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Incidencias recientes */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Incidencias Recientes</h3>
                <Link to="/incidents" className="text-xs text-primary hover:underline">Ver todas</Link>
              </div>
              {incidents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin incidencias</p>
              ) : (
                <ul className="divide-y divide-border">
                  {incidents.slice(0, 5).map((i) => (
                    <li key={i.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{i.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{i.client_name}</p>
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
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-input rounded-md bg-background">
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En Proceso</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nueva Orden
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? <EmptyState icon={ClipboardList} title="Sin órdenes" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">N° Orden</th>
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Técnico</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Prioridad</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-right px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                    <td className="px-4 py-3">{o.client_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.technician_name || '—'}</td>
                    <td className="px-4 py-3">{typeLabels[o.type] || o.type}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={o.priority} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(o.scheduled_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(o); setOpen(true); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setConfirm(o)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-input rounded-md bg-background">
          <option value="todos">Todos los estados</option>
          <option value="abierta">Abierta</option>
          <option value="en_atencion">En Atención</option>
          <option value="resuelta">Resuelta</option>
          <option value="cerrada">Cerrada</option>
        </select>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nueva Incidencia
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? <EmptyState icon={AlertTriangle} title="Sin incidencias" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Título</th>
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Categoría</th>
                  <th className="text-left px-4 py-3">Prioridad</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-right px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium max-w-[240px] truncate">{i.title}</td>
                    <td className="px-4 py-3">{i.client_name}</td>
                    <td className="px-4 py-3">{categoryLabels[i.category] || i.category}</td>
                    <td className="px-4 py-3"><StatusBadge status={i.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(i.created_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(i); setOpen(true); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setConfirm(i)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const createMut = useMutation({ mutationFn: (d) => api.clients.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setOpen(false); setEditing(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => api.clients.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setOpen(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: (id) => api.clients.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setConfirm(null); } });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter((c) =>
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.dni || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? <EmptyState icon={Users} title="Sin clientes" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">DNI</th>
                  <th className="text-left px-4 py-3">Teléfono</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-right px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.dni}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                    <td className="px-4 py-3">{planLabels[c.plan] || c.plan}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(c); setOpen(true); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setConfirm(c)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nuevo Técnico
        </button>
      </div>

      {filtered.length === 0 ? <EmptyState icon={HardHat} title="Sin técnicos" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {getInitials(t.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{t.full_name}</p>
                  <p className="text-xs text-muted-foreground">{specialtyLabels[t.specialty] || t.specialty}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="text-xs text-muted-foreground space-y-1 mb-3">
                <p><span className="font-medium text-foreground">DNI:</span> {t.dni}</p>
                <p><span className="font-medium text-foreground">Tel:</span> {t.phone}</p>
                {t.zone && <p><span className="font-medium text-foreground">Zona:</span> {t.zone}</p>}
              </div>
              <div className="flex gap-2 pt-3 border-t border-border">
                <button onClick={() => { setEditing(t); setOpen(true); }} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-input text-xs font-medium hover:bg-muted">
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button onClick={() => setConfirm(t)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50">
                  <Trash2 className="w-3 h-3" /> Eliminar
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
