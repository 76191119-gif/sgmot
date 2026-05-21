import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, HardHat, Phone, MapPin } from 'lucide-react';
import { api } from '@/api/localClient';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import AccessDenied from '@/components/shared/AccessDenied';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TechnicianForm from '@/components/technicians/TechnicianForm';
import { specialtyLabels, getInitials } from '@/lib/utils';

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
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90 transition"
            >
              <Plus className="w-4 h-4" /> Nuevo Técnico
            </button>
          )
        }
      />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o DNI..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-card focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={HardHat} title="Sin técnicos" description="No hay técnicos que coincidan con tu búsqueda." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:shadow-primary/5 transition-all">
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

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">DNI:</span> {t.dni}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3" /> {t.phone}
                </div>
                {t.zone && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {t.zone}
                  </div>
                )}
              </div>

              {(perms.canEdit || perms.canDelete) && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                  {perms.canEdit && (
                    <button
                      onClick={() => { setEditing(t); setModalOpen(true); }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-input text-xs font-medium hover:bg-muted transition"
                    >
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                  )}
                  {perms.canDelete && (
                    <button
                      onClick={() => setConfirm(t)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  )}
                </div>
              )}
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
          <p className="mt-3 text-xs text-destructive">
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
