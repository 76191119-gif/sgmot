import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import { api } from '@/api/localClient';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import AccessDenied from '@/components/shared/AccessDenied';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ClientForm from '@/components/clients/ClientForm';
import { planLabels } from '@/lib/utils';

export default function Clients() {
  const perms = usePermissions();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: api.clients.list,
    enabled: perms.canViewClients,
  });

  const createMut = useMutation({
    mutationFn: (data) => api.clients.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setModalOpen(false); setEditing(null); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.clients.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setModalOpen(false); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.clients.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setConfirm(null); },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter((c) =>
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.dni || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  }, [clients, search]);

  if (!perms.canViewClients) return <AccessDenied />;

  const onSubmit = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} cliente${clients.length !== 1 ? 's' : ''} registrado${clients.length !== 1 ? 's' : ''}`}
        actions={
          perms.canCreate && (
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90 transition"
            >
              <Plus className="w-4 h-4" /> Nuevo Cliente
            </button>
          )
        }
      />

      <div className="bg-black/60 border border-matrix-primary/20 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-matrix-primary/15">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-matrix-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, DNI o teléfono..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-matrix-primary/25 rounded-md bg-black/60 text-matrix-text focus:outline-none focus:border-matrix-primary transition placeholder:text-matrix-muted/40"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-matrix-muted">Cargando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="Sin clientes" description="No hay clientes que coincidan con tu búsqueda." />
        ) : (
          <div className="space-y-2 p-3">
            {filtered.map((c) => (
              <div key={c.id} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-matrix-primary/20 bg-black/55 px-4 py-3 transition hover:border-matrix-primary/45 hover:bg-matrix-primary/[0.035] lg:grid-cols-[minmax(220px,1.4fr)_120px_130px_minmax(220px,1.4fr)_170px_110px_80px]">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-matrix-text">{c.full_name}</p>
                  <p className="mt-1 truncate text-xs text-matrix-muted">{c.email || 'Sin email'}</p>
                </div>
                <p className="font-mono text-xs text-matrix-muted">{c.dni}</p>
                <p className="text-xs text-matrix-text">{c.phone}</p>
                <p className="truncate text-xs text-matrix-muted">{c.address}</p>
                <p className="text-xs font-medium text-matrix-text">{planLabels[c.plan] || c.plan}</p>
                <StatusBadge status={c.status} />
                <div className="flex justify-end gap-1">
                  {perms.canEdit && (
                    <button onClick={() => { setEditing(c); setModalOpen(true); }}
                      className="rounded-md p-2 text-matrix-muted transition hover:bg-matrix-primary/10 hover:text-matrix-primary" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {perms.canDelete && (
                    <button onClick={() => setConfirm(c)}
                      className="rounded-md p-2 text-matrix-muted transition hover:bg-red-500/10 hover:text-red-400" title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
      >
        <ClientForm
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
        title="Eliminar cliente"
        message={`¿Estás seguro de eliminar a "${confirm?.full_name}"? Esta acción no se puede deshacer.`}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
