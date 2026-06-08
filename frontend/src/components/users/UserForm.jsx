import { useState } from 'react';
import { Camera, Eye, EyeOff, Info, Loader2, Lock, Mail, Shield, Trash2, User } from 'lucide-react';
import { getInitials } from '@/lib/utils';

const INPUT = 'w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary focus:ring-1 focus:ring-matrix-primary/50 transition text-matrix-text placeholder:text-matrix-muted/40';
const SELECT = `${INPUT} cursor-pointer`;
const LABEL = 'flex items-center gap-1.5 text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider';

const ROLE_CLS = {
  admin: 'border-matrix-primary/60 text-matrix-primary',
  tecnico: 'border-matrix-primary/40 text-matrix-primary/80',
  cliente: 'border-cyan-500/50 text-cyan-400',
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const max = 420;
        const scale = Math.min(max / img.width, max / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UserForm({ initial, onSubmit, onCancel, loading }) {
  const isEdit = Boolean(initial?.id);
  const [data, setData] = useState({
    full_name: initial?.full_name || '',
    email: initial?.email || '',
    photo_url: initial?.photo_url || '',
    role: initial?.role || 'cliente',
    password: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const handlePhoto = async (file) => {
    setPhotoError('');
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      setPhotoError('Usa una imagen PNG, JPG o WEBP.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoError('La imagen original no debe superar 3 MB.');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      set('photo_url', dataUrl);
    } catch {
      setPhotoError('No se pudo procesar la imagen.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      full_name: data.full_name,
      email: data.email,
      photo_url: data.photo_url,
      role: data.role,
    };
    if (data.password) payload.password = data.password;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-[180px_1fr]">
        <div className="rounded-xl border border-matrix-primary/20 bg-matrix-primary/5 p-4 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-matrix-primary/35 bg-black/60 text-2xl font-bold text-matrix-primary">
            {data.photo_url ? (
              <img src={data.photo_url} alt={data.full_name || 'Usuario'} className="h-full w-full object-cover" />
            ) : (
              getInitials(data.full_name || 'Usuario')
            )}
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-matrix-primary/30 px-3 py-2 text-xs font-semibold text-matrix-primary transition hover:bg-matrix-primary/10">
            <Camera className="h-4 w-4" />
            Agregar foto
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
          </label>
          {data.photo_url && (
            <button type="button" onClick={() => set('photo_url', '')} className="mt-2 inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200">
              <Trash2 className="h-3 w-3" /> Quitar
            </button>
          )}
          {photoError && <p className="mt-2 text-xs text-red-300">{photoError}</p>}
        </div>

        <div className="space-y-5">
          <section>
            <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-matrix-muted/60">
              <span className="h-px flex-1 bg-matrix-primary/20" />
              Identidad
              <span className="h-px flex-1 bg-matrix-primary/20" />
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}><User className="h-3 w-3" /> Nombre completo *</label>
                <input className={INPUT} required value={data.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Nombre y apellidos" />
              </div>
              <div>
                <label className={LABEL}><Mail className="h-3 w-3" /> Email *</label>
                <input type="email" className={INPUT} required value={data.email} onChange={(e) => set('email', e.target.value)} placeholder="usuario@ejemplo.com" />
              </div>
            </div>
          </section>

          <section>
            <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-matrix-muted/60">
              <span className="h-px flex-1 bg-matrix-primary/20" />
              Acceso y permisos
              <span className="h-px flex-1 bg-matrix-primary/20" />
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}><Shield className="h-3 w-3" /> Rol *</label>
                <select className={`${SELECT} border-2 ${ROLE_CLS[data.role] || ''}`} required value={data.role} onChange={(e) => set('role', e.target.value)}>
                  <option value="cliente">Cliente</option>
                  <option value="tecnico">Tecnico</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>
                  <Lock className="h-3 w-3" />
                  {isEdit ? 'Nueva contrasena (opcional)' : 'Contrasena *'}
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className={`${INPUT} pr-10`}
                    required={!isEdit}
                    minLength={8}
                    placeholder={isEdit ? 'Dejar vacio para mantener' : 'Minimo 8 caracteres'}
                    value={data.password}
                    onChange={(e) => set('password', e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-matrix-muted transition hover:text-matrix-primary" tabIndex={-1}>
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-matrix-primary/20 bg-matrix-primary/5 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-matrix-primary" />
        <p className="text-xs leading-relaxed text-matrix-muted">
          La foto se optimiza antes de guardar. La ficha operativa del cliente o tecnico se muestra en la tarjeta del usuario cuando exista.
        </p>
      </div>

      <div className="flex justify-end gap-2 border-t border-matrix-primary/20 pt-3">
        <button type="button" onClick={onCancel} className="rounded-md border border-matrix-primary/30 px-4 py-2 text-sm font-medium text-matrix-muted transition hover:bg-matrix-primary/5 hover:text-matrix-text">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-matrix-primary px-5 py-2 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-matrix-hover disabled:opacity-50">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : isEdit ? 'Guardar cambios' : 'Crear usuario'}
        </button>
      </div>
    </form>
  );
}
