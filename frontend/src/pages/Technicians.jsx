import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, HardHat } from 'lucide-react';
import { api } from '@/api/localClient';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import AccessDenied from '@/components/shared/AccessDenied';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TechnicianForm from '@/components/technicians/TechnicianForm';
import { specialtyLabels } from '@/lib/utils';

export default function Technicians() {
  const perms = usePermissions();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: api.technicians.list,
    enabled: perms.canViewTechnicians,
  });

  const createMut = useMutation({
    mutationFn: (data) => api.technicians.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['technicians'] }); setModalOpen(false); setEditing(null); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.technicians.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['technicians'] }); setModalOpen(false); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.technicians.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['technicians'] }); setConfirm(null); },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return technicians;
    return technicians.filter((t) =>
      (t.full_name || '').toLowerCase().includes(q) ||
      (t.dni || '').toLowerCase().includes(q)
    );
  }, [technicians, search]);

  if (!perms.canViewTechnicians) return <AccessDenied />;

  const onSubmit = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  return (
    <div>
      <PageHeader
        title="Técnicos"
        subtitle={`${technicians.length} técnico${technicians.length !== 1 ? 's' : ''} registrado${technicians.length !== 1 ? 's' : ''}`}
        actions={
          perms.canCreate && (
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="inline-flex items-center gap-2 bg-matrix-primary text-black rounded-md px-3 py-2 text-sm font-bold hover:bg-matrix-hover transition uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> Nuevo Técnico
            </button>
          )
        }
      />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-matrix-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o DNI..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition placeholder:text-matrix-muted/40"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-matrix-muted">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={HardHat} title="Sin técnicos" description="No hay técnicos que coincidan con tu búsqueda." />
      ) : (
        <div className="space-y-2 rounded-xl border border-matrix-primary/20 bg-black/60 p-3">
          {filtered.map((t) => (
            <div key={t.id} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-matrix-primary/20 bg-black/55 px-4 py-3 transition hover:border-matrix-primary/45 hover:bg-matrix-primary/[0.035] lg:grid-cols-[minmax(220px,1.4fr)_130px_140px_minmax(160px,1fr)_minmax(160px,1fr)_120px_80px]">
              <div className="min-w-0">
                <p className="truncate font-semibold text-matrix-text">{t.full_name}</p>
                <p className="mt-1 truncate text-xs text-matrix-muted">{t.email || 'Sin email'}</p>
              </div>
              <p className="font-mono text-xs text-matrix-muted">{t.dni}</p>
              <p className="text-xs text-matrix-text">{t.phone}</p>
              <p className="text-xs font-medium text-matrix-text">{specialtyLabels[t.specialty] || t.specialty}</p>
              <p className="truncate text-xs text-matrix-muted">{t.zone || 'Sin zona'}</p>
              <StatusBadge status={t.status} />
              <div className="flex justify-end gap-1">
                {perms.canEdit && (
                  <button onClick={() => { setEditing(t); setModalOpen(true); }}
                    className="rounded-md p-2 text-matrix-muted transition hover:bg-matrix-primary/10 hover:text-matrix-primary" title="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {perms.canDelete && (
                  <button onClick={() => setConfirm(t)}
                    className="rounded-md p-2 text-matrix-muted transition hover:bg-red-500/10 hover:text-red-400" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Editar técnico' : 'Nuevo técnico'}
      >
        <TechnicianForm
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

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => deleteMut.mutate(confirm.id)}
        title="Eliminar técnico"
        message={`¿Estás seguro de eliminar a "${confirm?.full_name}"?`}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
