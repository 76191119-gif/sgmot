import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Pencil, Trash2, AlertTriangle, ShieldAlert,
  Clock, CheckCircle2, XCircle, Filter,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import IncidentForm from '@/components/incidents/IncidentForm';
import { categoryLabels, formatDate } from '@/lib/utils';

const STATUS_ICON = {
  abierta:     { Icon: ShieldAlert,  cls: 'text-red-400' },
  en_atencion: { Icon: Clock,        cls: 'text-amber-400' },
  resuelta:    { Icon: CheckCircle2, cls: 'text-emerald-400' },
  cerrada:     { Icon: XCircle,      cls: 'text-matrix-muted' },
};

const PRIORITY_CLS = {
  baja:    'bg-slate-500/15 text-slate-400 border-slate-500/30',
  media:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  alta:    'bg-orange-500/15 text-orange-400 border-orange-500/30',
  critica: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const INPUT_FILTER = "px-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition";

export default function Incidents() {
  const perms = usePermissions();
  const qc    = useQueryClient();

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [catFilter,    setCatFilter]    = useState('todos');
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [confirm,      setConfirm]      = useState(null);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: api.incidents.list,
  });

  const createMut = useMutation({
    mutationFn: (data) => api.incidents.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setModalOpen(false); setEditing(null); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.incidents.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setModalOpen(false); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.incidents.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setConfirm(null); },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return incidents.filter((i) => {
      const matchSearch =
        !q ||
        (i.title       || '').toLowerCase().includes(q) ||
        (i.client_name || '').toLowerCase().includes(q) ||
        (i.technician_name || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'todos' || i.status   === statusFilter;
      const matchCat    = catFilter    === 'todos' || i.category === catFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [incidents, search, statusFilter, catFilter]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (i)  => { setEditing(i);   setModalOpen(true); };
  const onSubmit   = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else         createMut.mutate(data);
  };

  // Contadores por estado
  const counts = useMemo(() => ({
    abierta:     incidents.filter((i) => i.status === 'abierta').length,
    en_atencion: incidents.filter((i) => i.status === 'en_atencion').length,
    resuelta:    incidents.filter((i) => i.status === 'resuelta').length,
  }), [incidents]);

  return (
    <div>
      <PageHeader
        title="Incidencias"
        subtitle={`${incidents.length} incidencia${incidents.length !== 1 ? 's' : ''} registrada${incidents.length !== 1 ? 's' : ''}`}
        actions={
          /* Todos los roles pueden reportar una incidencia */
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-matrix-primary text-black rounded-md px-3 py-2 text-sm font-bold hover:bg-matrix-hover transition uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Nueva Incidencia
          </button>
        }
      />

      {/* ── KPI chips ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'abierta',     label: 'Abiertas',     cls: 'border-red-500/40 text-red-400 bg-red-500/8' },
          { key: 'en_atencion', label: 'En Atención',  cls: 'border-amber-500/40 text-amber-400 bg-amber-500/8' },
          { key: 'resuelta',    label: 'Resueltas',    cls: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/8' },
        ].map(({ key, label, cls }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? 'todos' : key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${cls} ${statusFilter === key ? 'ring-1 ring-current' : 'opacity-70 hover:opacity-100'}`}
          >
            {label}
            <span className="font-bold">{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="bg-black/60 border border-matrix-primary/20 rounded-xl p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-matrix-muted" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o cliente..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition placeholder:text-matrix-muted/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-matrix-muted shrink-0" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={INPUT_FILTER}>
            <option value="todos">Todos los estados</option>
            <option value="abierta">Abierta</option>
            <option value="en_atencion">En Atención</option>
            <option value="resuelta">Resuelta</option>
            <option value="cerrada">Cerrada</option>
          </select>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className={INPUT_FILTER}>
            <option value="todos">Todas las categorías</option>
            <option value="sin_servicio">Sin Servicio</option>
            <option value="lentitud">Lentitud</option>
            <option value="corte_fibra">Corte de Fibra</option>
            <option value="equipo_danado">Equipo Dañado</option>
            <option value="configuracion">Configuración</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-black/60 border border-matrix-primary/20 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-matrix-muted">Cargando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Sin incidencias" description="No hay incidencias que coincidan con los filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-matrix-primary/20">
                <tr className="text-[11px] uppercase text-matrix-muted tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold">Título</th>
                  <th className="text-left px-4 py-3 font-semibold">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold">Categoría</th>
                  {perms.isAdmin && <th className="text-left px-4 py-3 font-semibold">Tecnico</th>}
                  <th className="text-left px-4 py-3 font-semibold">Prioridad</th>
                  <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                  <th className="text-right px-4 py-3 font-semibold w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-matrix-primary/[0.08]">
                {filtered.map((i) => {
                  const sc = STATUS_ICON[i.status] || STATUS_ICON.abierta;
                  const pc = PRIORITY_CLS[i.priority] || PRIORITY_CLS.media;
                  return (
                    <tr key={i.id} className="hover:bg-matrix-primary/[0.03] transition">
                      <td className="px-4 py-3">
                        <sc.Icon className={`w-4 h-4 ${sc.cls}`} />
                      </td>
                      <td className="px-4 py-3 font-medium text-matrix-text max-w-[220px] truncate">{i.title}</td>
                      <td className="px-4 py-3 text-matrix-muted text-xs">{i.client_name}</td>
                      <td className="px-4 py-3 text-xs text-matrix-muted">{categoryLabels?.[i.category] || i.category}</td>
                      {perms.isAdmin && (
                        <td className="px-4 py-3 text-xs text-matrix-muted">{i.technician_name || 'Sin asignar'}</td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wide ${pc}`}>
                          {i.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-matrix-muted/70">{formatDate(i.created_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {perms.canEdit && (
                            <button
                              onClick={() => openEdit(i)}
                              className="p-1.5 rounded-md hover:bg-matrix-primary/10 text-matrix-muted hover:text-matrix-primary transition"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {perms.canDelete && (
                            <button
                              onClick={() => setConfirm(i)}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-matrix-muted hover:text-red-400 transition"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Editar incidencia' : 'Reportar incidencia'}
      >
        <IncidentForm
          initial={editing}
          onSubmit={onSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          loading={createMut.isPending || updateMut.isPending}
        />
        {(createMut.error || updateMut.error) && (
          <p className="mt-3 text-xs text-red-400">
            {createMut.error?.error || updateMut.error?.error || 'Error al guardar'}
          </p>
        )}
      </Modal>

      {/* ── Confirm delete ── */}
      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => deleteMut.mutate(confirm.id)}
        title="Eliminar incidencia"
        message={`¿Eliminar la incidencia "${confirm?.title}"? Esta acción no se puede deshacer.`}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
