import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCircle,
  Users as UsersIcon,
  Wrench,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import AccessDenied from '@/components/shared/AccessDenied';
import Modal from '@/components/shared/Modal';
import UserForm from '@/components/users/UserForm';
import { formatDate, getInitials, planLabels } from '@/lib/utils';

const ROLE_BADGES = {
  admin: { label: 'Administrador', Icon: Shield, cls: 'bg-matrix-primary/15 text-matrix-primary border-matrix-primary/40' },
  tecnico: { label: 'Tecnico', Icon: Wrench, cls: 'bg-matrix-primary/15 text-matrix-primary border-matrix-primary/40' },
  cliente: { label: 'Cliente', Icon: UserCircle, cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' },
};

const STATUS_STYLE = {
  activo: 'text-matrix-primary border-matrix-primary/35 bg-matrix-primary/10',
  disponible: 'text-matrix-primary border-matrix-primary/35 bg-matrix-primary/10',
  suspendido: 'text-amber-300 border-amber-400/35 bg-amber-500/10',
  en_campo: 'text-cyan-300 border-cyan-400/35 bg-cyan-500/10',
  retirado: 'text-red-300 border-red-400/35 bg-red-500/10',
  no_disponible: 'text-red-300 border-red-400/35 bg-red-500/10',
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
  const [deletePassword, setDeletePassword] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
    enabled: perms.canManageUsers,
  });

  const createMut = useMutation({
    mutationFn: (d) => api.users.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      setEditing(null);
      toast.success('Usuario creado correctamente');
    },
    onError: (e) => toast.error(e.error || 'Error al crear usuario'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.users.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      setEditing(null);
      toast.success('Usuario actualizado');
    },
    onError: (e) => toast.error(e.error || 'Error al actualizar'),
  });

  const deleteMut = useMutation({
    mutationFn: ({ id, admin_password }) => api.users.delete(id, admin_password),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setConfirm(null);
      setDeletePassword('');
      toast.success('Usuario eliminado');
    },
    onError: (e) => {
      toast.error(e.error || 'Error al eliminar');
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const profile = u.profile || {};
      const haystack = [
        u.full_name,
        u.email,
        u.role,
        u.provider,
        profile.dni,
        profile.phone,
        profile.address,
        profile.district,
        profile.zone,
        profile.plan,
        profile.specialty,
      ].filter(Boolean).join(' ').toLowerCase();
      return (!q || haystack.includes(q)) && (roleFilter === 'todos' || u.role === roleFilter);
    });
  }, [users, search, roleFilter]);

  if (!perms.canManageUsers) return <AccessDenied />;

  const counts = {
    admin: users.filter((u) => u.role === 'admin').length,
    tecnico: users.filter((u) => u.role === 'tecnico').length,
    cliente: users.filter((u) => u.role === 'cliente').length,
  };

  return (
    <div>
      <PageHeader
        title="Gestion de Usuarios"
        subtitle={`${users.length} usuario${users.length !== 1 ? 's' : ''} con acceso al sistema`}
        actions={
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nuevo Usuario
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        {['admin', 'tecnico', 'cliente'].map((role) => {
          const cfg = ROLE_BADGES[role];
          const RIcon = cfg.Icon;
          return (
            <button key={role} type="button" onClick={() => setRoleFilter(roleFilter === role ? 'todos' : role)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${cfg.cls} ${roleFilter === role ? 'border-glow-green' : 'hover:bg-matrix-primary/5'}`}>
              <RIcon className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-xs font-medium opacity-80">{cfg.label}s</p>
                <p className="text-lg font-bold">{counts[role]}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-5 rounded-xl border border-matrix-primary/20 bg-black/60 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-matrix-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nombre, email, DNI, telefono, plan, zona..."
              className="w-full rounded-md border border-matrix-primary/25 bg-black/60 py-2 pl-9 pr-3 text-sm text-matrix-text transition placeholder:text-matrix-muted/40 focus:border-matrix-primary focus:outline-none"
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="cursor-pointer rounded-md border border-matrix-primary/25 bg-black/60 px-3 py-2 text-sm text-matrix-text transition focus:border-matrix-primary focus:outline-none">
            <option value="todos">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="tecnico">Tecnicos</option>
            <option value="cliente">Clientes</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-sm text-matrix-muted">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={UsersIcon} title="Sin usuarios" />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map((u) => (
            <UserProfileCard
              key={u.id}
              user={u}
              isMe={u.id === currentUser?.id}
              onEdit={() => { setEditing(u); setModalOpen(true); }}
              onDelete={() => { setConfirm(u); setDeletePassword(''); }}
            />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? `Editar usuario - ${editing.full_name}` : 'Nuevo usuario'} maxWidth="max-w-4xl">
        <UserForm
          initial={editing}
          onSubmit={(data) => editing ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data)}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          loading={createMut.isPending || updateMut.isPending}
        />
      </Modal>

      <Modal open={Boolean(confirm)} onClose={() => { setConfirm(null); setDeletePassword(''); }} title="Eliminar usuario" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="flex gap-3 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
            <div>
              <p className="font-semibold text-red-100">Accion sensible</p>
              <p className="mt-1 text-xs leading-relaxed text-red-100/75">
                Se eliminara el acceso de {confirm?.full_name} ({confirm?.email}). Para continuar, confirma tu contrasena de administrador.
              </p>
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-2 flex items-center gap-2 font-medium text-matrix-text">
              <Lock className="h-4 w-4 text-matrix-primary" /> Contrasena de administrador
            </span>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-md border border-matrix-primary/25 bg-black/70 px-3 py-2 text-matrix-text outline-none transition focus:border-matrix-primary"
              placeholder="Ingresa tu contrasena"
              autoFocus
            />
          </label>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => { setConfirm(null); setDeletePassword(''); }}
              className="rounded-md border border-matrix-primary/20 px-4 py-2 text-sm text-matrix-text transition hover:bg-matrix-primary/10"
              disabled={deleteMut.isPending}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => deleteMut.mutate({ id: confirm.id, admin_password: deletePassword })}
              disabled={!deletePassword.trim() || deleteMut.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function UserProfileCard({ user, isMe, onEdit, onDelete }) {
  const cfg = ROLE_BADGES[user.role] || ROLE_BADGES.cliente;
  const RIcon = cfg.Icon;
  const profile = user.profile;
  const status = profile?.status;

  return (
    <article className="overflow-hidden rounded-xl border border-matrix-primary/20 bg-black/60 transition hover:border-matrix-primary/40 hover:bg-matrix-primary/[0.035]">
      <div className="flex flex-col gap-4 border-b border-matrix-primary/10 p-4 sm:flex-row sm:items-start">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-matrix-primary/30 bg-matrix-primary/10 text-xl font-bold text-matrix-primary">
          {user.photo_url ? <img src={user.photo_url} alt={user.full_name} className="h-full w-full object-cover" /> : getInitials(user.full_name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-bold text-matrix-text">{user.full_name}</h3>
                {isMe && <span className="rounded-full bg-matrix-primary px-2 py-0.5 text-[10px] font-bold text-black">TU</span>}
              </div>
              <p className="mt-1 flex items-center gap-2 text-xs text-matrix-muted">
                <Mail className="h-3.5 w-3.5" /> <span className="truncate">{user.email}</span>
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={onEdit} className="rounded-md p-2 text-matrix-muted transition hover:bg-matrix-primary/10 hover:text-matrix-primary" title="Editar">
                <Pencil className="h-4 w-4" />
              </button>
              {!isMe && (
                <button onClick={onDelete} className="rounded-md p-2 text-matrix-muted transition hover:bg-red-500/10 hover:text-red-400" title="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${cfg.cls}`}>
              <RIcon className="h-3.5 w-3.5" /> {cfg.label}
            </span>
            <span className="rounded-md border border-matrix-primary/20 px-2 py-1 text-xs text-matrix-muted">
              {user.provider === 'google' ? 'Google OAuth' : 'Cuenta local'}
            </span>
            <span className={`rounded-md border px-2 py-1 text-xs ${user.profile_complete ? 'border-matrix-primary/30 text-matrix-primary' : 'border-amber-400/35 text-amber-300'}`}>
              {user.profile_complete ? 'Perfil completo' : 'Perfil pendiente'}
            </span>
            {status && <span className={`rounded-md border px-2 py-1 text-xs ${STATUS_STYLE[status] || 'border-matrix-primary/20 text-matrix-muted'}`}>{status}</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2">
        <InfoItem icon={Calendar} label="Creado" value={formatDate(user.created_date)} />
        <InfoItem icon={Calendar} label="Actualizado" value={formatDate(user.updated_date)} />

        {profile ? (
          profile.type === 'cliente' ? <ClientInfo profile={profile} /> : <TechnicianInfo profile={profile} />
        ) : (
          <div className="md:col-span-2 rounded-lg border border-dashed border-matrix-primary/20 p-3 text-xs text-matrix-muted">
            Sin ficha operativa vinculada. Al crear o sincronizar un cliente/tecnico con este email se mostrara aqui.
          </div>
        )}
      </div>
    </article>
  );
}

function ClientInfo({ profile }) {
  return (
    <>
      <InfoItem icon={UserCircle} label="DNI" value={profile.dni} />
      <InfoItem icon={Phone} label="Telefono" value={profile.phone} />
      <InfoItem icon={MapPin} label="Direccion" value={profile.address} wide />
      <InfoItem icon={MapPin} label="Distrito" value={profile.district} />
      <InfoItem icon={Shield} label="Plan" value={planLabels[profile.plan] || profile.plan} />
    </>
  );
}

function TechnicianInfo({ profile }) {
  return (
    <>
      <InfoItem icon={UserCircle} label="DNI" value={profile.dni} />
      <InfoItem icon={Phone} label="Telefono" value={profile.phone} />
      <InfoItem icon={Wrench} label="Especialidad" value={profile.specialty} />
      <InfoItem icon={MapPin} label="Zona" value={profile.zone} />
    </>
  );
}

function InfoItem({ icon: Icon, label, value, wide }) {
  return (
    <div className={`rounded-lg border border-matrix-primary/10 bg-black/35 p-3 ${wide ? 'md:col-span-2' : ''}`}>
      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-matrix-muted">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="break-words text-sm font-medium text-matrix-text">{value || 'No registrado'}</p>
    </div>
  );
}
