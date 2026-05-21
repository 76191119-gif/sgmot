import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Loader2, MapPin, Mail, Lock, User as UserIcon, Phone, IdCard, Home,
  Wifi, AlertCircle, CheckCircle2, Crosshair, Map as MapIcon, ArrowLeft, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useGeolocation } from '@/lib/useGeolocation';
import MapPreview from '@/components/shared/MapPreview';

const PLANS = [
  { value: 'basico_30mbps',      label: 'Básico',       speed: '30 Mbps',  price: 'S/ 59',  desc: 'Para uso ligero' },
  { value: 'estandar_60mbps',    label: 'Estándar',     speed: '60 Mbps',  price: 'S/ 89',  desc: 'Streaming HD + trabajo' },
  { value: 'premium_100mbps',    label: 'Premium',      speed: '100 Mbps', price: 'S/ 129', desc: 'Gaming + 4K' },
  { value: 'empresarial_200mbps',label: 'Empresarial',  speed: '200 Mbps', price: 'S/ 249', desc: 'Para negocios' },
];

const INPUT = "w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary focus:ring-1 focus:ring-matrix-primary/50 transition";
const LABEL = "block text-xs font-medium mb-1.5 text-matrix-muted uppercase tracking-wider flex items-center gap-1.5";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const geo = useGeolocation();

  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    full_name: '', dni: '', phone: '', email: '',
    password: '', password2: '',
    address: '', district: '',
    plan: 'estandar_60mbps',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  // Auto-prefill address/district desde reverse geocode
  useEffect(() => {
    if (geo.address?.formatted) {
      setData((d) => ({
        ...d,
        address: d.address || geo.address.formatted,
        district: d.district || geo.address.district || '',
      }));
    }
  }, [geo.address]); // eslint-disable-line

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!data.full_name || !data.dni || !data.phone || !data.email || !data.password) {
        setError('Completa todos los campos obligatorios.');
        return false;
      }
      if (data.password !== data.password2) {
        setError('Las contraseñas no coinciden.');
        return false;
      }
      if (data.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        setError('Email no válido.');
        return false;
      }
    }
    if (step === 2) {
      if (!data.address) {
        setError('La dirección es obligatoria. Usa el botón GPS o escríbela.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep((s) => s + 1); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError('');
    try {
      const payload = {
        full_name: data.full_name,
        dni: data.dni,
        phone: data.phone,
        email: data.email,
        password: data.password,
        address: data.address,
        district: data.district,
        plan: data.plan,
        latitude:  geo.coords?.latitude  ?? null,
        longitude: geo.coords?.longitude ?? null,
      };
      await register(payload);
      navigate('/');
    } catch (err) {
      setError(err.error || 'Error al crear la cuenta. Intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/login-bg.png')",
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      <div className="relative w-full max-w-2xl py-6">
        <div className="text-center mb-5">
          <img src="/logo.png" alt="SGMOT" className="w-20 h-20 mx-auto rounded-full animate-glow-pulse mb-3" />
          <p className="text-matrix-muted text-xs uppercase tracking-[0.3em]">SGMOT</p>
          <p className="text-matrix-text/70 text-xs mt-1">Sistema de Gestión y Monitoreo de Órdenes de Trabajo</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition
                ${s < step  ? 'bg-matrix-primary text-black border-matrix-primary'
                : s === step ? 'bg-black text-matrix-primary border-matrix-primary glow-green-sm'
                            : 'bg-black text-matrix-muted border-matrix-primary/30'}`}>
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-10 h-px ${s < step ? 'bg-matrix-primary' : 'bg-matrix-primary/30'}`} />}
            </div>
          ))}
        </div>

        <div
          className="bg-black/85 backdrop-blur-md border border-matrix-primary/40 rounded-2xl p-6 sm:p-8"
          style={{ boxShadow: '0 0 30px rgba(0,255,65,0.15), inset 0 0 30px rgba(0,255,65,0.03)' }}
        >
          <div className="mb-5">
            <h2 className="text-xl font-brand font-bold text-matrix-primary text-glow-green tracking-wider">
              {step === 1 && '▶ DATOS DE LA CUENTA'}
              {step === 2 && '▶ TU UBICACIÓN'}
              {step === 3 && '▶ ELIGE TU PLAN'}
            </h2>
            <p className="text-xs text-matrix-muted mt-1">
              Paso {step} de 3 — {step === 1 && 'Información personal'}{step === 2 && 'Geolocalización exacta para tu instalación'}{step === 3 && 'Plan de internet'}
            </p>
            <div className="h-px bg-gradient-to-r from-transparent via-matrix-primary/60 to-transparent mt-3" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg p-3 mb-4 flex items-center gap-2 glow-red">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}><UserIcon className="w-3 h-3" /> Nombre completo *</label>
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
              <div>
                <label className={LABEL}><Mail className="w-3 h-3" /> Email *</label>
                <input type="email" className={INPUT} required value={data.email} onChange={(e) => set('email', e.target.value)} placeholder="tucorreo@ejemplo.com" autoComplete="username" />
              </div>
              <div>
                <label className={LABEL}><Lock className="w-3 h-3" /> Contraseña *</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={`${INPUT} pr-10`} 
                    required 
                    minLength={6} 
                    value={data.password} 
                    onChange={(e) => set('password', e.target.value)} 
                    autoComplete="new-password" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-matrix-muted hover:text-matrix-primary transition-all duration-200 hover:scale-110 focus:outline-none focus:text-matrix-primary"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 animate-in fade-in-0 zoom-in-95 duration-200" />
                    ) : (
                      <Eye className="w-4 h-4 animate-in fade-in-0 zoom-in-95 duration-200" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL}><Lock className="w-3 h-3" /> Confirmar contraseña *</label>
                <div className="relative">
                  <input 
                    type={showPassword2 ? "text" : "password"} 
                    className={`${INPUT} pr-10`} 
                    required 
                    value={data.password2} 
                    onChange={(e) => set('password2', e.target.value)} 
                    autoComplete="new-password" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword2(!showPassword2)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-matrix-muted hover:text-matrix-primary transition-all duration-200 hover:scale-110 focus:outline-none focus:text-matrix-primary"
                    tabIndex={-1}
                  >
                    {showPassword2 ? (
                      <EyeOff className="w-4 h-4 animate-in fade-in-0 zoom-in-95 duration-200" />
                    ) : (
                      <Eye className="w-4 h-4 animate-in fade-in-0 zoom-in-95 duration-200" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-matrix-primary/5 border border-matrix-primary/30 rounded-lg p-4 text-sm">
                <p className="font-semibold text-matrix-primary mb-1 flex items-center gap-2">
                  <Crosshair className="w-4 h-4" /> Geolocalización GPS
                </p>
                <p className="text-matrix-muted text-xs">
                  Permite a nuestros técnicos llegar exactamente a tu ubicación. Tu navegador te pedirá permiso.
                </p>
              </div>

              <button
                type="button"
                onClick={geo.locate}
                disabled={geo.loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-matrix-primary text-black rounded-md py-3 text-sm font-bold hover:bg-matrix-hover transition glow-green-sm hover:glow-green disabled:opacity-50 uppercase tracking-wider"
              >
                {geo.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {geo.loading ? 'Obteniendo ubicación...' : geo.coords ? '✓ Ubicación obtenida — reintentar' : 'Obtener mi ubicación GPS'}
              </button>

              {geo.error && (
                <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs rounded-md p-2.5 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{geo.error} Puedes escribir la dirección manualmente.</span>
                </div>
              )}

              {geo.coords && (
                <>
                  <MapPreview latitude={geo.coords.latitude} longitude={geo.coords.longitude} height={200} />
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-black/40 border border-matrix-primary/20 rounded-md p-2">
                      <p className="text-matrix-muted">Latitud</p>
                      <p className="font-mono text-matrix-primary">{geo.coords.latitude.toFixed(6)}</p>
                    </div>
                    <div className="bg-black/40 border border-matrix-primary/20 rounded-md p-2">
                      <p className="text-matrix-muted">Longitud</p>
                      <p className="font-mono text-matrix-primary">{geo.coords.longitude.toFixed(6)}</p>
                    </div>
                    {geo.coords.accuracy && (
                      <div className="col-span-2 bg-black/40 border border-matrix-primary/20 rounded-md p-2">
                        <p className="text-matrix-muted">Precisión: <span className="text-matrix-primary font-mono">±{Math.round(geo.coords.accuracy)} m</span></p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="sm:col-span-2">
                  <label className={LABEL}><Home className="w-3 h-3" /> Dirección *</label>
                  <input className={INPUT} required value={data.address} onChange={(e) => set('address', e.target.value)} placeholder="Calle, número, referencia" />
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
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-matrix-muted uppercase tracking-wider mb-2">Selecciona tu plan</p>
              {PLANS.map((p) => (
                <label
                  key={p.value}
                  className={`block cursor-pointer rounded-lg border-2 p-4 transition ${
                    data.plan === p.value
                      ? 'border-matrix-primary bg-matrix-primary/10 glow-green-sm'
                      : 'border-matrix-primary/20 hover:border-matrix-primary/50'
                  }`}
                >
                  <input type="radio" name="plan" value={p.value} checked={data.plan === p.value}
                    onChange={(e) => set('plan', e.target.value)} className="sr-only" />
                  <div className="flex items-center gap-3">
                    <Wifi className={`w-6 h-6 shrink-0 ${data.plan === p.value ? 'text-matrix-primary' : 'text-matrix-muted'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-brand font-bold text-matrix-text">{p.label}</p>
                        <p className="text-matrix-primary font-bold text-lg">{p.price}<span className="text-xs text-matrix-muted">/mes</span></p>
                      </div>
                      <p className="text-xs text-matrix-muted">{p.speed} · {p.desc}</p>
                    </div>
                  </div>
                </label>
              ))}

              <div className="mt-5 p-4 bg-black/60 border border-matrix-primary/30 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-matrix-muted mb-2">Resumen</p>
                <div className="text-xs space-y-1 text-matrix-text">
                  <p><span className="text-matrix-muted">Nombre:</span> {data.full_name}</p>
                  <p><span className="text-matrix-muted">Email:</span> <span className="font-mono">{data.email}</span></p>
                  <p><span className="text-matrix-muted">Dirección:</span> {data.address}</p>
                  {geo.coords && (
                    <p><span className="text-matrix-muted">📍 GPS:</span> <span className="font-mono text-matrix-primary">{geo.coords.latitude.toFixed(5)}, {geo.coords.longitude.toFixed(5)}</span></p>
                  )}
                  <p><span className="text-matrix-muted">Plan:</span> {PLANS.find((p) => p.value === data.plan)?.label}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-6 pt-4 border-t border-matrix-primary/20">
            {step > 1 ? (
              <button onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-matrix-primary/40 text-sm font-medium text-matrix-text hover:bg-matrix-primary/10 transition uppercase tracking-wider">
                <ArrowLeft className="w-4 h-4" /> Atrás
              </button>
            ) : (
              <Link to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-matrix-primary/40 text-sm font-medium text-matrix-text hover:bg-matrix-primary/10 transition uppercase tracking-wider">
                <ArrowLeft className="w-4 h-4" /> Login
              </Link>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <button onClick={handleNext}
                className="px-5 py-2 rounded-md bg-matrix-primary text-black text-sm font-bold hover:bg-matrix-hover transition glow-green-sm uppercase tracking-wider">
                Siguiente ▶
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="px-5 py-2 rounded-md bg-matrix-primary text-black text-sm font-bold hover:bg-matrix-hover transition glow-green disabled:opacity-50 uppercase tracking-wider flex items-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Creando...' : '✓ Crear mi cuenta'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
