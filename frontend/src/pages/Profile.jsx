import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User as UserIcon, Mail, Lock, Save, Shield, Wrench, UserCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import PageHeader from '@/components/shared/PageHeader';
import { getInitials } from '@/lib/utils';

const ROLE_INFO = {
  admin:   { label: 'Administrador', Icon: Shield,     color: 'bg-matrix-primary/15 text-matrix-primary border-matrix-primary/40' },
  tecnico: { label: 'Técnico',       Icon: Wrench,     color: 'bg-matrix-primary/15 text-matrix-primary border-matrix-primary/40' },
  cliente: { label: 'Cliente',       Icon: UserCircle, color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' },
};

const INPUT = "w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring";

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const profileMut = useMutation({
    mutationFn: () => api.auth.updateProfile({ full_name: fullName, email }),
    onSuccess: () => {
      // Actualizar localStorage
      const updated = { ...user, full_name: fullName, email };
      localStorage.setItem('sgmot_user', JSON.stringify(updated));
      qc.invalidateQueries();
      toast.success('Perfil actualizado correctamente');
      setTimeout(() => window.location.reload(), 600);
    },
    onError: (e) => toast.error(e.error || 'Error al actualizar perfil'),
  });

  const pwdMut = useMutation({
    mutationFn: () => api.auth.changePassword(currentPwd, newPwd),
    onSuccess: () => {
      toast.success('Contraseña cambiada correctamente');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    },
    onError: (e) => toast.error(e.error || 'Error al cambiar contraseña'),
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    profileMut.mutate();
  };

  const handlePwdSubmit = (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (newPwd.length < 4) {
      toast.error('La nueva contraseña debe tener al menos 4 caracteres');
      return;
    }
    pwdMut.mutate();
  };

  const info = ROLE_INFO[user?.role] || ROLE_INFO.cliente;
  const RIcon = info.Icon;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Mi Perfil" subtitle="Administra tu información personal y contraseña" />

      {/* Card resumen */}
      <div className="bg-card border border-border rounded-xl p-6 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
          {getInitials(user?.full_name || '')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg truncate">{user?.full_name}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border ${info.color}`}>
          <RIcon className="w-3.5 h-3.5" /> {info.label}
        </span>
      </div>

      {/* Información personal */}
      <form onSubmit={handleProfileSubmit} className="bg-card border border-border rounded-xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Información personal</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Nombre completo</label>
            <input className={INPUT} required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input className={INPUT} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border flex justify-end">
          <button
            type="submit" disabled={profileMut.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {profileMut.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      {/* Cambiar contraseña */}
      <form onSubmit={handlePwdSubmit} className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Cambiar contraseña</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">Contraseña actual</label>
            <div className="relative">
              <input 
                className={`${INPUT} pr-10`} 
                type={showCurrentPwd ? "text" : "password"} 
                required 
                value={currentPwd} 
                onChange={(e) => setCurrentPwd(e.target.value)} 
                autoComplete="current-password" 
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110 focus:outline-none focus:text-primary"
                tabIndex={-1}
              >
                {showCurrentPwd ? (
                  <EyeOff className="w-4 h-4 animate-in fade-in-0 zoom-in-95 duration-200" />
                ) : (
                  <Eye className="w-4 h-4 animate-in fade-in-0 zoom-in-95 duration-200" />
                )}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Nueva contraseña</label>
              <div className="relative">
                <input 
                  className={`${INPUT} pr-10`} 
                  type={showNewPwd ? "text" : "password"} 
                  required 
                  minLength={4} 
                  value={newPwd} 
                  onChange={(e) => setNewPwd(e.target.value)} 
                  autoComplete="new-password" 
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110 focus:outline-none focus:text-primary"
                  tabIndex={-1}
                >
                  {showNewPwd ? (
                    <EyeOff className="w-4 h-4 animate-in fade-in-0 zoom-in-95 duration-200" />
                  ) : (
                    <Eye className="w-4 h-4 animate-in fade-in-0 zoom-in-95 duration-200" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Mínimo 4 caracteres</p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Confirmar nueva contraseña</label>
              <div className="relative">
                <input 
                  className={`${INPUT} pr-10`} 
                  type={showConfirmPwd ? "text" : "password"} 
                  required 
                  value={confirmPwd} 
                  onChange={(e) => setConfirmPwd(e.target.value)} 
                  autoComplete="new-password" 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110 focus:outline-none focus:text-primary"
                  tabIndex={-1}
                >
                  {showConfirmPwd ? (
                    <EyeOff className="w-4 h-4 animate-in fade-in-0 zoom-in-95 duration-200" />
                  ) : (
                    <Eye className="w-4 h-4 animate-in fade-in-0 zoom-in-95 duration-200" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border flex justify-end">
          <button
            type="submit" disabled={pwdMut.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" /> {pwdMut.isPending ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
