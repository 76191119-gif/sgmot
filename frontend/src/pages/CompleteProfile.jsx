import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Crosshair,
  Home,
  IdCard,
  Loader2,
  LogOut,
  Map as MapIcon,
  MapPin,
  Phone,
  Wifi,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';
import { useGeolocation } from '@/lib/useGeolocation';
import MapPreview from '@/components/shared/MapPreview';

const PLANS = [
  { value: 'basico_30mbps', label: 'Basico', speed: '30 Mbps', price: 'S/ 59', desc: 'Para uso ligero' },
  { value: 'estandar_60mbps', label: 'Estandar', speed: '60 Mbps', price: 'S/ 89', desc: 'Streaming HD + trabajo' },
  { value: 'premium_100mbps', label: 'Premium', speed: '100 Mbps', price: 'S/ 129', desc: 'Gaming + 4K' },
  { value: 'empresarial_200mbps', label: 'Empresarial', speed: '200 Mbps', price: 'S/ 249', desc: 'Para negocios' },
];

const INPUT = 'w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary focus:ring-1 focus:ring-matrix-primary/50 transition text-matrix-text placeholder:text-matrix-muted/40';
const LABEL = 'block text-xs font-medium mb-1.5 text-matrix-muted uppercase tracking-wider flex items-center gap-1.5';

export default function CompleteProfile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const geo = useGeolocation();

  const [data, setData] = useState({
    full_name: user?.full_name || '',
    dni: '',
    phone: '',
    address: '',
    district: '',
    plan: 'estandar_60mbps',
  });
  const [error, setError] = useState('');

  if (user && user.role !== 'cliente') return <Navigate to="/" replace />;

  useEffect(() => {
    if (geo.address?.formatted) {
      setData((current) => ({
        ...current,
        address: geo.address.formatted,
        district: geo.address.district || current.district || '',
      }));
    }
  }, [geo.address]);

  const set = (key, value) => setData((current) => ({ ...current, [key]: value }));

  const mut = useMutation({
    mutationFn: (vars) => api.auth.completeProfile(vars),
    onSuccess: () => {
      refreshUser({ profile_complete: true, full_name: data.full_name });
      queryClient.invalidateQueries({ queryKey: ['me-client'] });
      navigate('/');
    },
    onError: (e) => {
      const msg = e?.error || e?.message || (typeof e === 'string' ? e : JSON.stringify(e));
      setError(msg || 'Error al guardar');
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const payload = {
      ...data,
      full_name: (data.full_name || '').trim(),
      dni: (data.dni || '').trim(),
      phone: (data.phone || '').trim(),
      address: (data.address || '').trim(),
      district: (data.district || '').trim(),
      latitude: geo.coords?.latitude ?? null,
      longitude: geo.coords?.longitude ?? null,
    };

    if (!payload.dni || !payload.phone || !payload.address) {
      setError('Completa todos los campos obligatorios: DNI, telefono y direccion.');
      return;
    }

    if (!/^[0-9A-Za-z-]{4,20}$/.test(payload.dni)) {
      setError('DNI invalido. Usa solo numeros, letras o guiones (4-20 caracteres).');
      return;
    }

    if (!/^[0-9+\-()\s]{6,20}$/.test(payload.phone)) {
      setError('Telefono invalido. Revisa el numero.');
      return;
    }

    mut.mutate(payload);
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#03060A] p-4">
      <div className="absolute inset-0 bg-matrix-grid opacity-50" />

      <div className="relative mx-auto max-w-3xl py-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SGMOT" className="h-12 w-12 rounded-full" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-matrix-primary">SGMOT</p>
              <p className="text-sm text-matrix-text">Hola, {user?.full_name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </div>

        <div
          className="cyber-glass rounded-2xl p-6 shadow-2xl sm:p-8"
          style={{ boxShadow: '0 25px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(57,255,20,0.08)' }}
        >
          <h1 className="font-brand text-xl font-bold tracking-wider text-matrix-primary text-glow-green">
            &gt; COMPLETA TU PERFIL
          </h1>
          <p className="mt-1 text-xs text-matrix-muted">
            Necesitamos algunos datos mas para activar tu cuenta de cliente.
          </p>
          <div className="mb-5 mt-3 h-px bg-gradient-to-r from-transparent via-matrix-primary/60 to-transparent" />

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400 glow-red">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <section>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-matrix-primary">Datos personales</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>Nombre completo</label>
                  <input className={INPUT} required value={data.full_name} onChange={(e) => set('full_name', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}><IdCard className="h-3 w-3" /> DNI / RUC *</label>
                  <input className={INPUT} required value={data.dni} onChange={(e) => set('dni', e.target.value)} placeholder="12345678" />
                </div>
                <div>
                  <label className={LABEL}><Phone className="h-3 w-3" /> Telefono *</label>
                  <input className={INPUT} required value={data.phone} onChange={(e) => set('phone', e.target.value)} placeholder="987654321" />
                </div>
              </div>
            </section>

            <section>
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-matrix-primary">
                <MapPin className="h-3.5 w-3.5" /> Ubicacion de instalacion
              </p>

              <div className="mb-3 rounded-lg border border-matrix-primary/25 bg-matrix-primary/5 p-4">
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-matrix-primary">
                  <Crosshair className="h-4 w-4" /> Geolocalizacion GPS
                </p>
                <p className="text-xs leading-relaxed text-matrix-muted">
                  Necesitamos tu ubicacion exacta para que el tecnico llegue a instalarte el servicio.
                  Tu navegador te pedira permiso.
                </p>
              </div>

              <button
                type="button"
                onClick={geo.locate}
                disabled={geo.loading}
                className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-matrix-primary py-3 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-matrix-hover disabled:opacity-50"
                style={{ boxShadow: geo.coords ? '0 8px 20px rgba(37,99,235,0.16)' : 'none' }}
              >
                {geo.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Obteniendo ubicacion...
                  </>
                ) : geo.coords ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Ubicacion obtenida - Reobtener
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" /> Obtener mi ubicacion GPS
                  </>
                )}
              </button>

              {geo.error && (
                <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{geo.error} Puedes escribir la direccion manualmente.</span>
                </div>
              )}

              {geo.coords && (
                <div className="mb-3 space-y-2">
                  <MapPreview latitude={geo.coords.latitude} longitude={geo.coords.longitude} height={200} />
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded border border-matrix-primary/20 bg-black/40 p-2">
                      <p className="text-[10px] text-matrix-muted">Latitud</p>
                      <p className="font-mono text-matrix-primary">{geo.coords.latitude.toFixed(6)}</p>
                    </div>
                    <div className="rounded border border-matrix-primary/20 bg-black/40 p-2">
                      <p className="text-[10px] text-matrix-muted">Longitud</p>
                      <p className="font-mono text-matrix-primary">{geo.coords.longitude.toFixed(6)}</p>
                    </div>
                    <div className="rounded border border-matrix-primary/20 bg-black/40 p-2">
                      <p className="text-[10px] text-matrix-muted">Precision</p>
                      <p className="font-mono text-matrix-primary">
                        {geo.coords.accuracy ? `${Math.round(geo.coords.accuracy)}m` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className={LABEL}><Home className="h-3 w-3" /> Direccion *</label>
                  <input className={INPUT} required value={data.address} onChange={(e) => set('address', e.target.value)} placeholder="Av. Principal 123" />
                  {geo.address && data.address && (
                    <p className="mt-1 text-[10px] text-matrix-primary">Autocompletado desde GPS</p>
                  )}
                </div>
                <div>
                  <label className={LABEL}><MapIcon className="h-3 w-3" /> Distrito</label>
                  <input className={INPUT} value={data.district} onChange={(e) => set('district', e.target.value)} placeholder="Miraflores" />
                  {geo.address?.raw && (
                    <p className="mt-1 text-[10px] text-matrix-muted">
                      GPS: <span className="text-matrix-primary">
                        {geo.address.raw.city_district || geo.address.raw.suburb || geo.address.raw.city || '-'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section>
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-matrix-primary">
                <Wifi className="h-3.5 w-3.5" /> Plan de internet
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PLANS.map((plan) => (
                  <label
                    key={plan.value}
                    className={`cursor-pointer rounded-lg border-2 p-3 transition ${
                      data.plan === plan.value
                        ? 'border-matrix-primary bg-matrix-primary/10 glow-green-sm'
                        : 'border-matrix-primary/20 hover:border-matrix-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.value}
                      checked={data.plan === plan.value}
                      onChange={(e) => set('plan', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-brand text-sm font-bold text-matrix-text">{plan.label}</p>
                        <p className="text-[10px] text-matrix-muted">{plan.speed} - {plan.desc}</p>
                      </div>
                      <p className="text-sm font-bold text-matrix-primary">
                        {plan.price}<span className="text-[10px] text-matrix-muted">/m</span>
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <div className="flex justify-end border-t border-matrix-primary/20 pt-2">
              <button
                type="submit"
                disabled={mut.isPending}
                className="flex items-center gap-2 rounded-md bg-matrix-primary px-5 py-2 text-sm font-bold uppercase tracking-wider text-black transition glow-green hover:bg-matrix-hover disabled:opacity-50"
              >
                {mut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Crear cuenta
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
