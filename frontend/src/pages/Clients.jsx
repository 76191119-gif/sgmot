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

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, DNI o teléfono..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="Sin clientes" description="No hay clientes que coincidan con tu búsqueda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold">DNI</th>
                  <th className="text-left px-4 py-3 font-semibold">Teléfono</th>
                  <th className="text-left px-4 py-3 font-semibold">Dirección</th>
                  <th className="text-left px-4 py-3 font-semibold">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold">Estado</th>
                  <th className="text-right px-4 py-3 font-semibold w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.dni}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{c.address}</td>
                    <td className="px-4 py-3">{planLabels[c.plan] || c.plan}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {perms.canEdit && (
                          <button
                            onClick={() => { setEditing(c); setModalOpen(true); }}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {perms.canDelete && (
                          <button
                            onClick={() => setConfirm(c)}
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
