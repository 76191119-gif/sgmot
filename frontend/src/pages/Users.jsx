import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Users as UsersIcon, Shield, Wrench, UserCircle } from 'lucide-react';
import { api } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import AccessDenied from '@/components/shared/AccessDenied';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import UserForm from '@/components/users/UserForm';
import { formatDate, getInitials } from '@/lib/utils';

const ROLE_BADGES = {
  admin:   { label: 'Administrador', Icon: Shield,     cls: 'bg-matrix-primary/15 text-matrix-primary border-matrix-primary/40' },
  tecnico: { label: 'Técnico',       Icon: Wrench,     cls: 'bg-matrix-primary/15 text-matrix-primary border-matrix-primary/40' },
  cliente: { label: 'Cliente',       Icon: UserCircle, cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' },
};

export default function Users() {
  const perms = usePermissions();
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
    enabled: perms.canManageUsers,
  });

  const createMut = useMutation({
    mutationFn: (d) => api.users.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModalOpen(false); setEditing(null); toast.success('Usuario creado correctamente'); },
    onError: (e) => toast.error(e.error || 'Error al crear usuario'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.users.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModalOpen(false); setEditing(null); toast.success('Usuario actualizado'); },
    onError: (e) => toast.error(e.error || 'Error al actualizar'),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.users.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setConfirm(null); toast.success('Usuario eliminado'); },
    onError: (e) => { toast.error(e.error || 'Error al eliminar'); setConfirm(null); },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) =>
      (!q || (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)) &&
      (roleFilter === 'todos' || u.role === roleFilter)
    );
  }, [users, search, roleFilter]);

  if (!perms.canManageUsers) return <AccessDenied />;

  const counts = {
    admin:   users.filter((u) => u.role === 'admin').length,
    tecnico: users.filter((u) => u.role === 'tecnico').length,
    cliente: users.filter((u) => u.role === 'cliente').length,
  };

  return (
    <div>
      <PageHeader
        title="Gestión de Usuarios"
        subtitle={`${users.length} usuario${users.length !== 1 ? 's' : ''} con acceso al sistema`}
        actions={
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" /> Nuevo Usuario
          </button>
        }
      />

      {/* KPIs por rol */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {['admin', 'tecnico', 'cliente'].map((r) => {
          const cfg = ROLE_BADGES[r];
          const RIcon = cfg.Icon;
          return (
            <div key={r} className={`rounded-xl border p-3 flex items-center gap-3 ${cfg.cls}`}>
              <RIcon className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs font-medium opacity-80">{cfg.label}s</p>
                <p className="text-lg font-bold">{counts[r]}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <select
            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-input rounded-md bg-background"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="tecnico">Técnicos</option>
            <option value="cliente">Clientes</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={UsersIcon} title="Sin usuarios" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Rol</th>
                  <th className="text-left px-4 py-3 font-semibold">Creado</th>
                  <th className="text-right px-4 py-3 font-semibold w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => {
                  const cfg = ROLE_BADGES[u.role] || ROLE_BADGES.cliente;
                  const RIcon = cfg.Icon;
                  const isMe = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {getInitials(u.full_name)}
                          </div>
                          <div>
                            <p className="font-medium">{u.full_name}</p>
                            {isMe && <p className="text-[10px] text-primary font-semibold">TÚ</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border ${cfg.cls}`}>
                          <RIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.created_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => { setEditing(u); setModalOpen(true); }}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!isMe && (
                            <button
                              onClick={() => setConfirm(u)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-red-600" title="Eliminar"
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

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? `Editar usuario · ${editing.full_name}` : 'Nuevo usuario'}
      >
        <UserForm
          initial={editing}
          onSubmit={(data) => editing ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data)}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          loading={createMut.isPending || updateMut.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => deleteMut.mutate(confirm.id)}
        title="Eliminar usuario"
        message={`¿Eliminar al usuario "${confirm?.full_name}" (${confirm?.email})? Perderá acceso al sistema.`}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
