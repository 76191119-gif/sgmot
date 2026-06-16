import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, Calendar, ChevronDown, Pencil, Plus, Search, Trash2, Wrench,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import IncidentForm from '@/components/incidents/IncidentForm';
import { categoryLabels, formatDate, incidentCategoryOptions } from '@/lib/utils';

const STATUSES = [
  { value: 'abierta', label: 'Abierta' },
  { value: 'en_atencion', label: 'En Atencion' },
  { value: 'resuelta', label: 'Resuelta' },
  { value: 'cerrada', label: 'Cerrada' },
];

export default function Incidents() {
  const perms = usePermissions();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [catFilter, setCatFilter] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: api.incidents.list,
  });

  const createMut = useMutation({
    mutationFn: (data) => api.incidents.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      setModalOpen(false);
      setEditing(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.incidents.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      setModalOpen(false);
      setEditing(null);
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, data }) => api.incidents.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.incidents.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      setConfirm(null);
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return incidents.filter((i) => {
      const matchSearch =
        !q ||
        (i.title || '').toLowerCase().includes(q) ||
        (i.client_name || '').toLowerCase().includes(q) ||
        (i.technician_name || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'todos' || i.status === statusFilter;
      const matchCat = catFilter === 'todos' || i.category === catFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [incidents, search, statusFilter, catFilter]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (incident) => {
    setEditing(incident);
    setModalOpen(true);
  };

  const onSubmit = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  return (
    <div>
      <PageHeader
        title="Incidencias"
        subtitle={`${incidents.length} incidencia${incidents.length !== 1 ? 's' : ''} registrada${incidents.length !== 1 ? 's' : ''}`}
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-matrix-primary text-black rounded-md px-3 py-2 text-sm font-bold hover:bg-matrix-hover transition uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Nueva Incidencia
          </button>
        }
      />

      <div className="bg-black/60 border border-matrix-primary/20 rounded-xl p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-matrix-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por titulo, cliente o tecnico..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition placeholder:text-matrix-muted/40"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition cursor-pointer"
        >
          <option value="todos">Todos los estados</option>
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition cursor-pointer"
        >
          <option value="todos">Todas las categorias</option>
          {incidentCategoryOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-matrix-muted">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Sin incidencias" description="No hay incidencias que coincidan con los filtros." />
      ) : (
        <div className="space-y-2 rounded-xl border border-matrix-primary/20 bg-black/60 p-3">
          {filtered.map((incident) => (
            <IncidentRow
              key={incident.id}
              incident={incident}
              canEdit={perms.canEdit}
              canDelete={perms.canDelete}
              canChangeStatus={perms.canEdit}
              onEdit={() => openEdit(incident)}
              onDelete={() => setConfirm(incident)}
              onChangeStatus={(newStatus) => statusMut.mutate({
                id: incident.id,
                data: { ...incident, status: newStatus },
              })}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Editar incidencia' : 'Reportar incidencia'}
      >
        <IncidentForm
          initial={editing}
          onSubmit={onSubmit}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          loading={createMut.isPending || updateMut.isPending}
        />
        {(createMut.error || updateMut.error) && (
          <p className="mt-3 text-xs text-red-400">
            {createMut.error?.error || updateMut.error?.error || 'Error al guardar'}
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => deleteMut.mutate(confirm.id)}
        title="Eliminar incidencia"
        message={`Eliminar la incidencia "${confirm?.title}"? Esta accion no se puede deshacer.`}
        loading={deleteMut.isPending}
      />
    </div>
  );
}

function IncidentRow({ incident, canEdit, canDelete, canChangeStatus, onEdit, onDelete, onChangeStatus }) {
  return (
    <div className="grid grid-cols-1 items-center gap-3 rounded-xl border border-matrix-primary/20 bg-black/55 px-4 py-3 transition hover:border-matrix-primary/45 hover:bg-matrix-primary/[0.035] lg:grid-cols-[minmax(260px,1.6fr)_minmax(180px,1fr)_minmax(190px,1fr)_minmax(150px,0.8fr)_90px_170px_130px_80px]">
      <div>
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-matrix-muted">INC-{String(incident.id).padStart(5, '0')}</p>
          <p className="mt-0.5 font-semibold text-matrix-text">{incident.title}</p>
          {incident.description && <p className="mt-1 max-w-[300px] truncate text-xs text-matrix-muted">{incident.description}</p>}
        </div>
      </div>
      <p className="text-sm text-matrix-text">{incident.client_name || '-'}</p>
      <div>
        <div className="flex max-w-[220px] items-center gap-1.5 text-xs text-matrix-muted">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{categoryLabels[incident.category] || incident.category}</span>
        </div>
      </div>
      <div>
        <div className="flex max-w-[180px] items-center gap-1.5 text-xs text-matrix-muted">
          <Wrench className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{incident.technician_name || 'Sin asignar'}</span>
        </div>
      </div>
      <StatusBadge status={incident.priority} />
      <div>
        {canChangeStatus ? (
          <div className="relative inline-flex items-center">
            <select
              value={incident.status}
              onChange={(e) => onChangeStatus(e.target.value)}
              className="h-8 min-w-[130px] appearance-none rounded-md border border-matrix-primary/25 bg-black/60 py-1 pl-2.5 pr-8 text-xs font-medium uppercase tracking-wider text-matrix-text outline-none transition hover:border-matrix-primary/50 focus:border-matrix-primary"
            >
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-matrix-muted" />
          </div>
        ) : (
          <StatusBadge status={incident.status} />
        )}
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-xs text-matrix-muted">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(incident.created_date) || '-'}
        </div>
      </div>
      <div>
        <div className="flex justify-end gap-1">
          {canEdit && (
            <button onClick={onEdit} className="rounded-md p-2 text-matrix-muted transition hover:bg-matrix-primary/10 hover:text-matrix-primary" title="Editar">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button onClick={onDelete} className="rounded-md p-2 text-matrix-muted transition hover:bg-red-500/10 hover:text-red-400" title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
