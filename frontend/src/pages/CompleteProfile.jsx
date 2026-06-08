import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, MapPin, Phone, IdCard, Home, Wifi, AlertCircle, Crosshair,
  Map as MapIcon, ArrowLeft, LogOut,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';
import { useGeolocation } from '@/lib/useGeolocation';
import MapPreview from '@/components/shared/MapPreview';

const PLANS = [
  { value: 'basico_30mbps',      label: 'Básico',      speed: '30 Mbps',  price: 'S/ 59',  desc: 'Uso ligero' },
  { value: 'estandar_60mbps',    label: 'Estándar',    speed: '60 Mbps',  price: 'S/ 89',  desc: 'Streaming + trabajo' },
  { value: 'premium_100mbps',    label: 'Premium',     speed: '100 Mbps', price: 'S/ 129', desc: 'Gaming + 4K' },
  { value: 'empresarial_200mbps',label: 'Empresarial', speed: '200 Mbps', price: 'S/ 249', desc: 'Negocios' },
];

const INPUT = "w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary focus:ring-1 focus:ring-matrix-primary/50 transition";
const LABEL = "block text-xs font-medium mb-1.5 text-matrix-muted uppercase tracking-wider flex items-center gap-1.5";

export default function CompleteProfile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const geo = useGeolocation();

  const [data, setData] = useState({
    full_name: user?.full_name || '',
    dni: '', phone: '', address: '', district: '',
    plan: 'estandar_60mbps',
  });
  const [error, setError] = useState('');

  // Si el usuario no es cliente, no debería estar aquí
  if (user && user.role !== 'cliente') return <Navigate to="/" replace />;

  // Auto-prefill address con reverse geocode
  useEffect(() => {
    if (geo.address?.formatted && !data.address) {
      setData((d) => ({
        ...d,
        address: geo.address.formatted || d.address,
        district: geo.address.district || d.district,
      }));
    }
  }, [geo.address]); // eslint-disable-line

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationFn: (vars) => api.auth.completeProfile(vars),
    onSuccess: () => {
      refreshUser({ profile_complete: true, full_name: data.full_name });
      // Ensure ProtectedRoute sees the new client record
      queryClient.invalidateQueries({ queryKey: ['me-client'] });
      navigate('/');
    },
    onError: (e) => {
      const msg = e?.error || e?.message || (typeof e === 'string' ? e : JSON.stringify(e));
      setError(msg || 'Error al guardar');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    // Trim inputs
    const payload = {
      ...data,
      full_name: (data.full_name || '').trim(),
      dni: (data.dni || '').trim(),
      phone: (data.phone || '').trim(),
      address: (data.address || '').trim(),
      district: (data.district || '').trim(),
    };

    if (!payload.dni || !payload.phone || !payload.address) {
      setError('Completa todos los campos obligatorios: DNI, teléfono y dirección.');
      return;
    }
    // Simple DNI and phone validation
    if (!/^[0-9A-Za-z\-]{4,20}$/.test(payload.dni)) {
      setError('DNI inválido. Usa solo números, letras o guiones (4-20 caracteres).');
      return;
    }
    if (!/^[0-9+\-()\s]{6,20}$/.test(payload.phone)) {
      setError('Teléfono inválido. Revisa el número.');
      return;
    }

    // Send mutation with trimmed payload
    mut.mutate({ ...payload, latitude: geo.coords?.latitude ?? null, longitude: geo.coords?.longitude ?? null });
  };

  return (
    <div
      className="min-h-screen p-4 relative"
      style={{
        backgroundImage: "url('/login-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />

      <div className="relative max-w-3xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SGMOT" className="w-12 h-12 rounded-full" />
            <div>
              <p className="text-matrix-muted text-[10px] uppercase tracking-[0.3em]">SGMOT</p>
              <p className="text-matrix-text text-sm">Hola, {user?.full_name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-500/40 text-red-400 text-xs hover:bg-red-500/10 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>

        <div
          className="bg-black/85 backdrop-blur-md border border-matrix-primary/40 rounded-2xl p-6 sm:p-8"
          style={{ boxShadow: '0 0 30px rgba(0,255,65,0.15), inset 0 0 30px rgba(0,255,65,0.03)' }}
        >
          <h1 className="text-xl font-brand font-bold text-matrix-primary text-glow-green tracking-wider">
            ▶ COMPLETA TU PERFIL
          </h1>
          <p className="text-xs text-matrix-muted mt-1">
            Necesitamos algunos datos más para activar tu cuenta de cliente.
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-matrix-primary/60 to-transparent mt-3 mb-5" />

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg p-3 mb-4 flex items-center gap-2 glow-red">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Datos personales */}
            <div>
              <p className="text-xs font-bold text-matrix-primary uppercase tracking-wider mb-3">📋 Datos personales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Nombre completo</label>
                  <input className={INPUT} required value={data.full_name} onChange={(e) => set('full_name', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}><IdCard className="w-3 h-3" /> DNI / RUC *</label>
                  <input className={INPUT} required value={data.dni} onChange={(e) => set('dni', e.target.value)} placeholder="12345678" />
                </div>
                <div>
                  <label className={LABEL}><Phone className="w-3 h-3" /> Teléfono *</label>
                  <input className={INPUT} required value={data.phone} onChange={(e) => set('phone', e.target.value)} placeholder="987654321" />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <p className="text-xs font-bold text-matrix-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Ubicación de instalación
              </p>

              <button
                type="button"
                onClick={geo.locate}
                disabled={geo.loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-matrix-primary text-black rounded-md py-2.5 text-sm font-bold hover:bg-matrix-hover transition glow-green-sm hover:glow-green disabled:opacity-50 uppercase tracking-wider mb-3"
              >
                {geo.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                {geo.loading ? 'Obteniendo ubicación...' : geo.coords ? '✓ Reobtener ubicación' : 'Obtener mi ubicación GPS'}
              </button>

              {geo.error && (
                <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs rounded-md p-2.5 mb-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{geo.error} Puedes escribir la dirección manualmente.</span>
                </div>
              )}

              {geo.coords && (
                <div className="mb-3 space-y-2">
                  <MapPreview latitude={geo.coords.latitude} longitude={geo.coords.longitude} height={200} />
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-black/40 border border-matrix-primary/20 rounded p-2">
                      <span className="text-matrix-muted">Lat:</span> <span className="font-mono text-matrix-primary">{geo.coords.latitude.toFixed(6)}</span>
                    </div>
                    <div className="bg-black/40 border border-matrix-primary/20 rounded p-2">
                      <span className="text-matrix-muted">Lng:</span> <span className="font-mono text-matrix-primary">{geo.coords.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className={LABEL}><Home className="w-3 h-3" /> Dirección *</label>
                  <input className={INPUT} required value={data.address} onChange={(e) => set('address', e.target.value)} placeholder="Av. Principal 123" />
                  {geo.address && data.address && (
                    <p className="text-[10px] text-matrix-primary mt-1">✓ Autocompletado desde GPS</p>
                  )}
                </div>
                <div>
                  <label className={LABEL}><MapIcon className="w-3 h-3" /> Distrito</label>
                  <input className={INPUT} value={data.district} onChange={(e) => set('district', e.target.value)} placeholder="Miraflores" />
                </div>
              </div>
            </div>

            {/* Plan */}
            <div>
              <p className="text-xs font-bold text-matrix-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5" /> Plan de internet
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PLANS.map((p) => (
                  <label
                    key={p.value}
                    className={`cursor-pointer rounded-lg border-2 p-3 transition ${
                      data.plan === p.value
                        ? 'border-matrix-primary bg-matrix-primary/10 glow-green-sm'
                        : 'border-matrix-primary/20 hover:border-matrix-primary/50'
                    }`}
                  >
                    <input type="radio" name="plan" value={p.value} checked={data.plan === p.value}
                      onChange={(e) => set('plan', e.target.value)} className="sr-only" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-brand font-bold text-matrix-text text-sm">{p.label}</p>
                        <p className="text-[10px] text-matrix-muted">{p.speed} · {p.desc}</p>
                      </div>
                      <p className="text-matrix-primary font-bold text-sm">{p.price}<span className="text-[10px] text-matrix-muted">/m</span></p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-matrix-primary/20">
              <button
                type="submit" disabled={mut.isPending}
                className="px-5 py-2 rounded-md bg-matrix-primary text-black text-sm font-bold hover:bg-matrix-hover transition glow-green disabled:opacity-50 uppercase tracking-wider flex items-center gap-2"
              >
                {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {mut.isPending ? 'Guardando...' : '✓ Crear cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
