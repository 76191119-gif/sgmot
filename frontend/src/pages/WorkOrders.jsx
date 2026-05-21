import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { api } from '@/api/localClient';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import WorkOrderCard from '@/components/orders/WorkOrderCard';
import WorkOrderForm from '@/components/orders/WorkOrderForm';

export default function WorkOrders() {
  const perms = usePermissions();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['work_orders'],
    queryFn: api.workOrders.list,
  });

  const createMut = useMutation({
    mutationFn: (data) => api.workOrders.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work_orders'] }); setModalOpen(false); setEditing(null); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.workOrders.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work_orders'] }); setModalOpen(false); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.workOrders.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work_orders'] }); setConfirm(null); },
  });
  const statusMut = useMutation({
    mutationFn: ({ id, data }) => api.workOrders.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work_orders'] }),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      const matchSearch =
        !q ||
        (o.client_name || '').toLowerCase().includes(q) ||
        (o.order_number || '').toLowerCase().includes(q) ||
        (o.technician_name || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'todos' || o.status === statusFilter;
      const matchType = typeFilter === 'todos' || o.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [orders, search, statusFilter, typeFilter]);

  const onSubmit = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  return (
    <div>
      <PageHeader
        title="Órdenes de Trabajo"
        subtitle={`${orders.length} orden${orders.length !== 1 ? 'es' : ''} total${orders.length !== 1 ? 'es' : ''}`}
        actions={
          perms.canCreate && (
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90 transition"
            >
              <Plus className="w-4 h-4" /> Nueva Orden
            </button>
          )
        }
      />

      <div className="bg-card border border-border rounded-xl p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, número de orden o técnico..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-input rounded-md bg-background"
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En Proceso</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select
          value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-input rounded-md bg-background"
        >
          <option value="todos">Todos los tipos</option>
          <option value="instalacion">Instalación</option>
          <option value="soporte">Soporte</option>
          <option value="mantenimiento">Mantenimiento</option>
          <option value="retiro">Retiro</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin órdenes" description="No hay órdenes que coincidan con los filtros." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((order) => (
            <WorkOrderCard
              key={order.id}
              order={order}
              onEdit={perms.canEdit ? (o) => { setEditing(o); setModalOpen(true); } : null}
              onDelete={perms.canDelete ? (o) => setConfirm(o) : null}
              onChangeStatus={
                perms.canChangeOrderStatus
                  ? (newStatus) => statusMut.mutate({
                      id: order.id,
                      data: {
                        ...order,
                        status: newStatus,
                        completed_date: newStatus === 'completado' ? new Date().toISOString().slice(0, 10) : null,
                      },
                    })
                  : null
              }
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Editar orden' : 'Nueva orden de trabajo'}
        maxWidth="max-w-3xl"
      >
        <WorkOrderForm
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
        title="Eliminar orden"
        message={`¿Eliminar la orden ${confirm?.order_number}? Esta acción no se puede deshacer.`}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
