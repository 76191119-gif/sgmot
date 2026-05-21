import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '@/api/localClient';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import IncidentForm from '@/components/incidents/IncidentForm';
import { categoryLabels, formatDate } from '@/lib/utils';

export default function Incidents() {
  const perms = usePermissions();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

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
        (i.title || '').toLowerCase().includes(q) ||
        (i.client_name || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'todos' || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [incidents, search, statusFilter]);

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
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" /> Nueva Incidencia
          </button>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título o cliente..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <select
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-input rounded-md bg-background"
          >
            <option value="todos">Todos los estados</option>
            <option value="abierta">Abierta</option>
            <option value="en_atencion">En Atención</option>
            <option value="resuelta">Resuelta</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Sin incidencias" description="No hay incidencias que coincidan con los filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Título</th>
                  <th className="text-left px-4 py-3 font-semibold">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold">Categoría</th>
                  <th className="text-left px-4 py-3 font-semibold">Prioridad</th>
                  <th className="text-left px-4 py-3 font-semibold">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                  <th className="text-right px-4 py-3 font-semibold w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium max-w-[260px] truncate">{i.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.client_name}</td>
                    <td className="px-4 py-3">{categoryLabels[i.category] || i.category}</td>
                    <td className="px-4 py-3"><StatusBadge status={i.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(i.created_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {perms.canEdit && (
                          <button
                            onClick={() => { setEditing(i); setModalOpen(true); }}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {perms.canDelete && (
                          <button
                            onClick={() => setConfirm(i)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-600" title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Editar incidencia' : 'Nueva incidencia'}
      >
        <IncidentForm
          initial={editing}
          onSubmit={onSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          loading={createMut.isPending || updateMut.isPending}
        />
        {(createMut.error || updateMut.error) && (
          <p className="mt-3 text-xs text-destructive">
            {createMut.error?.error || updateMut.error?.error || 'Error al guardar'}
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => deleteMut.mutate(confirm.id)}
        title="Eliminar incidencia"
        message={`¿Eliminar la incidencia "${confirm?.title}"?`}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
