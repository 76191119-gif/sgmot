import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  Crosshair,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Map as MapIcon,
  MapPin,
  Phone,
  Save,
  Shield,
  Trash2,
  User as UserIcon,
  UserCircle,
  Wifi,
  Wrench,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { useGeolocation } from '@/lib/useGeolocation';
import MapPreview from '@/components/shared/MapPreview';
import { formatDate, getInitials, planLabels } from '@/lib/utils';

const ROLE_INFO = {
  admin: { label: 'Administrador', Icon: Shield, cls: 'bg-matrix-primary/15 text-matrix-primary border-matrix-primary/40' },
  tecnico: { label: 'Tecnico', Icon: Wrench, cls: 'bg-matrix-primary/15 text-matrix-primary border-matrix-primary/40' },
  cliente: { label: 'Cliente', Icon: UserCircle, cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' },
};

const PLANS = [
  { value: 'basico_30mbps', label: 'Basico', speed: '30 Mbps', price: 'S/ 59' },
  { value: 'estandar_60mbps', label: 'Estandar', speed: '60 Mbps', price: 'S/ 89' },
  { value: 'premium_100mbps', label: 'Premium', speed: '100 Mbps', price: 'S/ 129' },
  { value: 'empresarial_200mbps', label: 'Empresarial', speed: '200 Mbps', price: 'S/ 249' },
];

const CARD = 'rounded-xl border border-matrix-primary/25 bg-black/60 p-5';
const INPUT = 'w-full rounded-md border border-matrix-primary/30 bg-black/60 px-3 py-2.5 text-sm text-matrix-text transition placeholder:text-matrix-muted/40 focus:border-matrix-primary focus:outline-none focus:ring-1 focus:ring-matrix-primary/50 disabled:cursor-not-allowed disabled:opacity-60';
const LABEL = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-matrix-muted';

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
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const geo = useGeolocation();

  const { data: me, isLoading } = useQuery({
    queryKey: ['me-profile', user?.id],
    queryFn: api.auth.me,
    enabled: Boolean(user?.id),
  });

  const profileUser = me || user || {};
  const profile = profileUser.profile;
  const isCliente = profileUser.role === 'cliente';
  const isTecnico = profileUser.role === 'tecnico';
  const canEditAccount = !isTecnico;

  const [fullName, setFullName] = useState(profileUser.full_name || '');
  const [email, setEmail] = useState(profileUser.email || '');
  const [photoUrl, setPhotoUrl] = useState(profileUser.photo_url || '');
  const [photoError, setPhotoError] = useState('');

  const [showPwdForm, setShowPwdForm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [plan, setPlan] = useState('estandar_60mbps');

  useEffect(() => {
    if (!profileUser.id) return;
    setFullName(profileUser.full_name || '');
    setEmail(profileUser.email || '');
    setPhotoUrl(profileUser.photo_url || '');
  }, [profileUser.id, profileUser.full_name, profileUser.email, profileUser.photo_url]);

  useEffect(() => {
    if (!profile) return;
    setAddress(profile.address || '');
    setDistrict(profile.district || '');
    setPlan(profile.plan || 'estandar_60mbps');
  }, [profile]);

  useEffect(() => {
    if (geo.address?.formatted) {
      setAddress(geo.address.formatted);
      if (geo.address.district) setDistrict(geo.address.district);
    }
  }, [geo.address]);

  const profileMut = useMutation({
    mutationFn: () => api.auth.updateProfile({ full_name: fullName, email, photo_url: photoUrl }),
    onSuccess: (res) => {
      const next = res.user || { ...profileUser, full_name: fullName, email, photo_url: photoUrl };
      refreshUser(next);
      qc.invalidateQueries({ queryKey: ['me-profile'] });
      toast.success('Perfil actualizado');
    },
    onError: (e) => toast.error(e.error || 'Error al actualizar perfil'),
  });

  const pwdMut = useMutation({
    mutationFn: () => api.auth.changePassword(currentPwd, newPwd),
    onSuccess: () => {
      toast.success('Contrasena cambiada correctamente');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setShowPwdForm(false);
    },
    onError: (e) => toast.error(e.error || 'Error al cambiar contrasena'),
  });

  const locationMut = useMutation({
    mutationFn: () => api.auth.completeProfile({
      full_name: fullName,
      dni: profile?.dni || '',
      phone: profile?.phone || '',
      address,
      district,
      plan,
      latitude: geo.coords?.latitude ?? profile?.latitude ?? null,
      longitude: geo.coords?.longitude ?? profile?.longitude ?? null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me-profile'] });
      toast.success('Ubicacion y plan actualizados');
    },
    onError: (e) => toast.error(e.error || 'Error al actualizar ubicacion'),
  });

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
      setPhotoUrl(await fileToDataUrl(file));
    } catch {
      setPhotoError('No se pudo procesar la imagen.');
    }
  };

  const saveProfile = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return toast.error('Completa nombre y email');
    profileMut.mutate();
  };

  const savePassword = (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) return toast.error('Las contrasenas nuevas no coinciden');
    if (newPwd.length < 8) return toast.error('Minimo 8 caracteres');
    pwdMut.mutate();
  };

  const saveClientInfo = (e) => {
    e.preventDefault();
    if (!address.trim()) return toast.error('La direccion es obligatoria');
    locationMut.mutate();
  };

  if (isLoading && !user) {
    return <div className="p-12 text-center text-sm text-matrix-muted">Cargando perfil...</div>;
  }

  const role = ROLE_INFO[profileUser.role] || ROLE_INFO.cliente;
  const RoleIcon = role.Icon;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <section className="cyber-glass rounded-2xl p-5 text-center shadow-2xl">
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-matrix-primary/10 blur-3xl" />
            <div className="relative">
              <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-matrix-primary/35 bg-[#111827] text-3xl font-bold text-matrix-primary glow-green-sm">
                {photoUrl ? <img src={photoUrl} alt={fullName} className="h-full w-full object-cover" /> : getInitials(fullName || profileUser.full_name || 'Usuario')}
              </div>

              {canEditAccount && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-matrix-primary/30 px-3 py-2 text-xs font-semibold text-matrix-primary transition hover:bg-matrix-primary/10">
                    <Camera className="h-4 w-4" /> Cambiar foto
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
                  </label>
                  {photoUrl && (
                    <button type="button" onClick={() => setPhotoUrl('')} className="inline-flex items-center gap-1 rounded-md border border-red-400/25 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10">
                      <Trash2 className="h-3 w-3" /> Quitar
                    </button>
                  )}
                </div>
              )}
              {photoError && <p className="mt-2 text-xs text-red-300">{photoError}</p>}

              <div className="mt-5 min-w-0">
                <p className="truncate text-xl font-bold text-matrix-text">{profileUser.full_name}</p>
                <p className="mt-1 truncate text-sm text-matrix-muted">{profileUser.email}</p>
              </div>

              <div className="mt-4 flex justify-center">
                <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold ${role.cls}`}>
                  <RoleIcon className="h-4 w-4" /> {role.label}
                </span>
              </div>
            </div>
          </section>

          <section className={CARD}>
            <SectionTitle icon={Shield} title="Resumen de cuenta" />
            <div className="space-y-3">
              <InfoTile icon={Calendar} label="Miembro desde" value={formatDate(profileUser.created_date)} />
              <InfoTile icon={Calendar} label="Actualizado" value={formatDate(profileUser.updated_date)} />
              <InfoTile icon={Shield} label="Proveedor" value={profileUser.provider === 'google' ? 'Google OAuth' : 'Cuenta local'} />
            </div>
          </section>

          {!isTecnico && (
            <SecurityCard
              showPwdForm={showPwdForm}
              setShowPwdForm={setShowPwdForm}
              currentPwd={currentPwd}
              setCurrentPwd={setCurrentPwd}
              newPwd={newPwd}
              setNewPwd={setNewPwd}
              confirmPwd={confirmPwd}
              setConfirmPwd={setConfirmPwd}
              showCurrent={showCurrent}
              setShowCurrent={setShowCurrent}
              showNew={showNew}
              setShowNew={setShowNew}
              savePassword={savePassword}
              loading={pwdMut.isPending}
            />
          )}
        </aside>

        <main className="space-y-5">
          <form onSubmit={saveProfile} className={CARD}>
            <SectionTitle icon={UserIcon} title="Informacion personal" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre completo">
                <input className={INPUT} value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!canEditAccount} required />
              </Field>
              <Field label="Email">
                <input className={INPUT} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canEditAccount} required />
              </Field>
            </div>
            {canEditAccount ? (
              <div className="mt-4 flex justify-end border-t border-matrix-primary/15 pt-4">
                <button type="submit" disabled={profileMut.isPending} className="inline-flex items-center gap-2 rounded-md bg-matrix-primary px-5 py-2 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-matrix-hover disabled:opacity-50">
                  {profileMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="h-4 w-4" /> Guardar cambios</>}
                </button>
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-matrix-primary/15 bg-matrix-primary/5 p-3 text-xs text-matrix-muted">
                Tu perfil de tecnico es administrado por el administrador del sistema.
              </p>
            )}
          </form>

          {isCliente && (
            <form onSubmit={saveClientInfo} className={CARD}>
              <SectionTitle icon={MapPin} title="Servicio, ubicacion y plan" />
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <InfoTile icon={UserCircle} label="DNI" value={profile?.dni} />
                <InfoTile icon={Phone} label="Telefono" value={profile?.phone} />
              </div>

              <button type="button" onClick={() => geo.locate()} disabled={geo.loading} className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-matrix-primary/40 bg-matrix-primary/10 py-2.5 text-sm font-semibold uppercase tracking-wider text-matrix-primary transition hover:bg-matrix-primary/20 disabled:opacity-50">
                {geo.loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Obteniendo GPS...</> : <><Crosshair className="h-4 w-4" /> Obtener ubicacion GPS</>}
              </button>
              {geo.error && <p className="mb-3 flex items-center gap-2 text-xs text-amber-300"><AlertCircle className="h-4 w-4" /> {geo.error}</p>}
              {(geo.coords || (profile?.latitude && profile?.longitude)) && (
                <div className="mb-4">
                  <MapPreview latitude={geo.coords?.latitude || profile?.latitude} longitude={geo.coords?.longitude || profile?.longitude} height={170} />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Direccion">
                  <input className={INPUT} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Direccion de servicio" required />
                </Field>
                <Field label="Distrito">
                  <input className={INPUT} value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Distrito" />
                </Field>
                <Field label="Plan">
                  <select className={INPUT} value={plan} onChange={(e) => setPlan(e.target.value)}>
                    {PLANS.map((p) => <option key={p.value} value={p.value}>{p.label} - {p.speed}</option>)}
                  </select>
                </Field>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {PLANS.map((p) => (
                  <button key={p.value} type="button" onClick={() => setPlan(p.value)} className={`rounded-lg border p-3 text-left transition ${plan === p.value ? 'border-matrix-primary bg-matrix-primary/10' : 'border-matrix-primary/15 hover:border-matrix-primary/35'}`}>
                    <p className="text-xs font-bold text-matrix-text">{p.label}</p>
                    <p className="text-[11px] text-matrix-muted">{p.speed}</p>
                    <p className="mt-1 text-xs font-bold text-matrix-primary">{p.price}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-end border-t border-matrix-primary/15 pt-4">
                <button type="submit" disabled={locationMut.isPending} className="inline-flex items-center gap-2 rounded-md bg-matrix-primary px-5 py-2 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-matrix-hover disabled:opacity-50">
                  {locationMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><CheckCircle2 className="h-4 w-4" /> Guardar servicio</>}
                </button>
              </div>
            </form>
          )}

          <ProfileDetails user={profileUser} profile={profile} />
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, compact }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'mb-5'}`}>
      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-matrix-primary/30 bg-matrix-primary/15">
        <Icon className="h-3.5 w-3.5 text-matrix-primary" />
      </div>
      <h2 className="text-sm font-bold uppercase tracking-wider text-matrix-primary">{title}</h2>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-matrix-primary/10 bg-black/35 p-3">
      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-matrix-muted">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="break-words text-sm font-medium text-matrix-text">{value || 'No registrado'}</p>
    </div>
  );
}

function ProfileDetails({ user, profile }) {
  return (
    <section className={CARD}>
      <SectionTitle icon={Shield} title="Informacion completa" />
      <div className="grid gap-3 md:grid-cols-2">
        <InfoTile icon={Mail} label="Email" value={user.email} />
        <InfoTile icon={Shield} label="Rol" value={ROLE_INFO[user.role]?.label || user.role} />
        <InfoTile icon={Shield} label="Proveedor" value={user.provider === 'google' ? 'Google OAuth' : 'Cuenta local'} />
        {profile ? (
          profile.specialty ? (
            <>
              <InfoTile icon={UserCircle} label="DNI" value={profile.dni} />
              <InfoTile icon={Phone} label="Telefono" value={profile.phone} />
              <InfoTile icon={Wrench} label="Especialidad" value={profile.specialty} />
              <InfoTile icon={MapPin} label="Zona" value={profile.zone} />
              <InfoTile icon={CheckCircle2} label="Estado" value={profile.status} />
            </>
          ) : (
            <>
              <InfoTile icon={UserCircle} label="DNI" value={profile.dni} />
              <InfoTile icon={Phone} label="Telefono" value={profile.phone} />
              <InfoTile icon={Home} label="Direccion" value={profile.address} />
              <InfoTile icon={MapIcon} label="Distrito" value={profile.district} />
              <InfoTile icon={Wifi} label="Plan" value={planLabels[profile.plan] || profile.plan} />
              <InfoTile icon={CheckCircle2} label="Estado" value={profile.status} />
            </>
          )
        ) : (
          <div className="rounded-lg border border-dashed border-matrix-primary/20 p-3 text-xs text-matrix-muted">
            No hay ficha operativa vinculada todavia.
          </div>
        )}
      </div>
    </section>
  );
}

function SecurityCard({
  showPwdForm,
  setShowPwdForm,
  currentPwd,
  setCurrentPwd,
  newPwd,
  setNewPwd,
  confirmPwd,
  setConfirmPwd,
  showCurrent,
  setShowCurrent,
  showNew,
  setShowNew,
  savePassword,
  loading,
}) {
  return (
    <section className={CARD}>
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle icon={Lock} title="Seguridad" compact />
        <button type="button" onClick={() => setShowPwdForm((v) => !v)} className="rounded-md border border-matrix-primary/30 p-2 text-matrix-primary transition hover:bg-matrix-primary/10" title="Cambiar contrasena">
          <KeyRound className="h-4 w-4" />
        </button>
      </div>
      {!showPwdForm ? (
        <div className="rounded-lg border border-matrix-primary/15 bg-black/35 p-3">
          <div className="mb-2 flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => <span key={i} className="h-2 w-2 rounded-full bg-matrix-primary/45" />)}
          </div>
          <p className="text-xs text-matrix-muted">Contrasena configurada</p>
        </div>
      ) : (
        <form onSubmit={savePassword} className="space-y-3">
          <PasswordInput label="Contrasena actual" value={currentPwd} onChange={setCurrentPwd} show={showCurrent} setShow={setShowCurrent} />
          <PasswordInput label="Nueva contrasena" value={newPwd} onChange={setNewPwd} show={showNew} setShow={setShowNew} />
          <Field label="Confirmar nueva contrasena">
            <input className={INPUT} type={showNew ? 'text' : 'password'} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required />
          </Field>
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-matrix-primary px-4 py-2 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-matrix-hover disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Cambiando...</> : <><Lock className="h-4 w-4" /> Cambiar contrasena</>}
          </button>
        </form>
      )}
    </section>
  );
}

function PasswordInput({ label, value, onChange, show, setShow }) {
  return (
    <Field label={label}>
      <div className="relative">
        <input className={`${INPUT} pr-10`} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} required />
        <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-matrix-muted transition hover:text-matrix-primary" tabIndex={-1}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );
}
