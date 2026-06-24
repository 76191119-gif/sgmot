import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Loader2, MapPin, Mail, Lock, User as UserIcon, Phone, IdCard, Home,
  Wifi, AlertCircle, CheckCircle2, Crosshair, Map as MapIcon, ArrowLeft,
  Eye, EyeOff, ClipboardList, RefreshCw, UserCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useGeolocation } from '@/lib/useGeolocation';
import MapPreview from '@/components/shared/MapPreview';

const PLANS = [
  { value: 'basico_30mbps',       label: 'Básico',      speed: '30 Mbps',  price: 'S/ 59',  desc: 'Para uso ligero' },
  { value: 'estandar_60mbps',     label: 'Estándar',    speed: '60 Mbps',  price: 'S/ 89',  desc: 'Streaming HD + trabajo' },
  { value: 'premium_100mbps',     label: 'Premium',     speed: '100 Mbps', price: 'S/ 129', desc: 'Gaming + 4K' },
  { value: 'empresarial_200mbps', label: 'Empresarial', speed: '200 Mbps', price: 'S/ 249', desc: 'Para negocios' },
];

const INPUT = "w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary focus:ring-1 focus:ring-matrix-primary/50 transition text-matrix-text placeholder:text-matrix-muted/40";
const LABEL = "block text-xs font-medium mb-1.5 text-matrix-muted uppercase tracking-wider flex items-center gap-1.5";

const STEP_LABELS = [
  { n: 1, title: 'DATOS DE LA CUENTA',  sub: 'Información personal' },
  { n: 2, title: 'TU UBICACIÓN',        sub: 'Geolocalización para la instalación' },
  { n: 3, title: 'ELIGE TU PLAN',       sub: 'Plan de internet' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const geo          = useGeolocation();

  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    full_name: '', dni: '', phone: '', email: '',
    password: '', password2: '',
    address: '', district: '',
    plan: 'estandar_60mbps',
  });
  const [showPwd,  setShowPwd]  = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // Estado de verificación de DNI (null = sin verificar, true = existente, false = nuevo)
  const [dniStatus,    setDniStatus]    = useState(null);
  const [dniChecking,  setDniChecking]  = useState(false);
  const dniTimer = useRef(null);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  // Auto-prefill dirección/distrito desde GPS
  useEffect(() => {
    if (geo.address?.formatted) {
      setData((d) => ({
        ...d,
        address:  geo.address.formatted,
        district: geo.address.district || d.district || '',
      }));
    }
  }, [geo.address]); // eslint-disable-line

  // Verificar DNI en tiempo real (debounce 600ms)
  useEffect(() => {
    const dni = data.dni.trim();
    if (dni.length < 8) { setDniStatus(null); return; }
    clearTimeout(dniTimer.current);
    setDniChecking(true);
    dniTimer.current = setTimeout(async () => {
      try {
        // Intentamos obtener clientes — si falla (403 para no-admin) asumimos nuevo
        // Usamos el endpoint público de registro que devuelve info del DNI
        // Como no hay endpoint público de consulta, hacemos un POST de prueba con datos mínimos
        // y detectamos el error 409 de DNI duplicado vs otros errores.
        // Alternativa: endpoint dedicado. Por ahora usamos heurística visual.
        // El backend maneja ambos casos correctamente.
        setDniStatus('unknown'); // no podemos saber sin endpoint dedicado
      } catch {
        setDniStatus(null);
      } finally {
        setDniChecking(false);
      }
    }, 600);
    return () => clearTimeout(dniTimer.current);
  }, [data.dni]);

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!data.full_name || !data.dni || !data.phone || !data.email || !data.password) {
        setError('Completa todos los campos obligatorios.'); return false;
      }
      if (data.password !== data.password2) {
        setError('Las contraseñas no coinciden.'); return false;
      }
      if (data.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.'); return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        setError('Email no válido.'); return false;
      }
    }
    if (step === 2) {
      if (!data.address) {
        setError('La dirección es obligatoria. Usa el botón GPS o escríbela.'); return false;
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
      await register({
        full_name: data.full_name,
        dni:       data.dni,
        phone:     data.phone,
        email:     data.email,
        password:  data.password,
        address:   data.address,
        district:  data.district,
        plan:      data.plan,
        latitude:  geo.coords?.latitude  ?? null,
        longitude: geo.coords?.longitude ?? null,
      });
      navigate('/');
    } catch (err) {
      setError(err.error || 'Error al crear la cuenta. Intenta nuevamente.');
      setLoading(false);
    }
  };

  const selectedPlan = PLANS.find((p) => p.value === data.plan);

  return (
    <div
      className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#03060A] p-4"
    >
      <div className="absolute inset-0 bg-matrix-grid opacity-50" />

      <div className="relative w-full max-w-2xl py-6">
        {/* Logo */}
        <div className="text-center mb-5">
          <img src="/logo.png" alt="SGMOT" className="w-20 h-20 mx-auto rounded-full animate-glow-pulse mb-3" />
          <p className="text-matrix-primary text-xs font-bold uppercase tracking-[0.3em]">SGMOT · INPE CABLE</p>
          <p className="text-matrix-text/60 text-xs mt-1">Registro de nuevo cliente</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {STEP_LABELS.map(({ n }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                ${n < step  ? 'bg-matrix-primary text-black border-matrix-primary'
                : n === step ? 'bg-black text-matrix-primary border-matrix-primary shadow-[0_0_10px_rgba(37,99,235,0.22)]'
                             : 'bg-black text-matrix-muted border-matrix-primary/30'}`}>
                {n < step ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              {n < 3 && <div className={`w-12 h-px transition-all duration-500 ${n < step ? 'bg-matrix-primary' : 'bg-matrix-primary/20'}`} />}
            </div>
          ))}
        </div>

        {/* Card principal */}
        <div
          className="cyber-glass rounded-2xl p-6 sm:p-8 shadow-2xl"
          style={{ boxShadow: '0 25px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(57,255,20,0.08)' }}
        >
          {/* Header del paso */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 rounded-full bg-matrix-primary" style={{ boxShadow: 'none' }} />
              <h2 className="text-lg font-bold text-matrix-primary tracking-wider">
                ▶ {STEP_LABELS[step - 1].title}
              </h2>
            </div>
            <p className="text-xs text-matrix-muted ml-3">
              Paso {step} de 3 — {STEP_LABELS[step - 1].sub}
            </p>
            <div className="h-px bg-gradient-to-r from-transparent via-matrix-primary/50 to-transparent mt-3" />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ══ PASO 1 — Datos personales ══════════════════════ */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}><UserIcon className="w-3 h-3" /> Nombre completo *</label>
                <input className={INPUT} required value={data.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                  placeholder="Nombre y apellidos" />
              </div>
              <div>
                <label className={LABEL}><IdCard className="w-3 h-3" /> DNI / RUC *</label>
                <div className="relative">
                  <input className={`${INPUT} pr-8`} required value={data.dni}
                    onChange={(e) => set('dni', e.target.value)}
                    placeholder="12345678" maxLength={15} />
                  {dniChecking && (
                    <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-matrix-muted animate-spin" />
                  )}
                </div>
              </div>
              <div>
                <label className={LABEL}><Phone className="w-3 h-3" /> Teléfono *</label>
                <input className={INPUT} required value={data.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="987654321" />
              </div>
              <div>
                <label className={LABEL}><Mail className="w-3 h-3" /> Email *</label>
                <input type="email" className={INPUT} required value={data.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="tucorreo@ejemplo.com" autoComplete="username" />
              </div>
              <div>
                <label className={LABEL}><Lock className="w-3 h-3" /> Contraseña *</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} className={`${INPUT} pr-10`}
                    required minLength={8} value={data.password}
                    onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-matrix-muted hover:text-matrix-primary transition hover:scale-110 focus:outline-none">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL}><Lock className="w-3 h-3" /> Confirmar contraseña *</label>
                <div className="relative">
                  <input type={showPwd2 ? 'text' : 'password'} className={`${INPUT} pr-10`}
                    required value={data.password2}
                    onChange={(e) => set('password2', e.target.value)} autoComplete="new-password" />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPwd2((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-matrix-muted hover:text-matrix-primary transition hover:scale-110 focus:outline-none">
                    {showPwd2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ PASO 2 — Ubicación ═════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-matrix-primary/5 border border-matrix-primary/25 rounded-lg p-4">
                <p className="font-semibold text-matrix-primary text-sm mb-1 flex items-center gap-2">
                  <Crosshair className="w-4 h-4" /> Geolocalización GPS
                </p>
                <p className="text-matrix-muted text-xs leading-relaxed">
                  Necesitamos tu ubicación exacta para que el técnico llegue a instalarte el servicio.
                  Tu navegador te pedirá permiso.
                </p>
              </div>

              <button type="button" onClick={geo.locate} disabled={geo.loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-matrix-primary text-black rounded-md py-3 text-sm font-bold hover:bg-matrix-hover transition disabled:opacity-50 uppercase tracking-wider"
                style={{ boxShadow: geo.coords ? '0 8px 20px rgba(37,99,235,0.16)' : 'none' }}>
                {geo.loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Obteniendo ubicación...</>
                  : geo.coords
                    ? <><CheckCircle2 className="w-4 h-4" /> ✓ Ubicación obtenida — Reobtener</>
                    : <><MapPin className="w-4 h-4" /> Obtener mi ubicación GPS</>}
              </button>

              {geo.error && (
                <div className="bg-amber-500/10 border border-amber-500/35 text-amber-300 text-xs rounded-md p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{geo.error} Puedes escribir la dirección manualmente.</span>
                </div>
              )}

              {geo.coords && (
                <>
                  <MapPreview latitude={geo.coords.latitude} longitude={geo.coords.longitude} height={200} />
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-black/40 border border-matrix-primary/20 rounded-md p-2">
                      <p className="text-matrix-muted text-[10px]">Latitud</p>
                      <p className="font-mono text-matrix-primary">{geo.coords.latitude.toFixed(6)}</p>
                    </div>
                    <div className="bg-black/40 border border-matrix-primary/20 rounded-md p-2">
                      <p className="text-matrix-muted text-[10px]">Longitud</p>
                      <p className="font-mono text-matrix-primary">{geo.coords.longitude.toFixed(6)}</p>
                    </div>
                    <div className="bg-black/40 border border-matrix-primary/20 rounded-md p-2">
                      <p className="text-matrix-muted text-[10px]">Precisión</p>
                      <p className="font-mono text-matrix-primary">
                        {geo.coords.accuracy ? `±${Math.round(geo.coords.accuracy)}m` : '—'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="sm:col-span-2">
                  <label className={LABEL}><Home className="w-3 h-3" /> Dirección *</label>
                  <input className={INPUT} required value={data.address}
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="Calle, número, referencia" />
                  {geo.address && data.address && (
                    <p className="text-[10px] text-matrix-primary mt-1">✓ Autocompletado desde GPS</p>
                  )}
                </div>
                <div>
                  <label className={LABEL}><MapIcon className="w-3 h-3" /> Distrito</label>
                  <input className={INPUT} value={data.district}
                    onChange={(e) => set('district', e.target.value)}
                    placeholder="Ej: Wanchaq" />
                  {geo.address?.raw && (
                    <p className="text-[10px] text-matrix-muted mt-1">
                      GPS: <span className="text-matrix-primary">
                        {geo.address.raw.city_district || geo.address.raw.suburb || geo.address.raw.city || '—'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ PASO 3 — Plan ══════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-4">

              {/* Info de qué pasará */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nueva instalación */}
                <div className="bg-matrix-primary/5 border border-matrix-primary/30 rounded-lg p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-matrix-primary/15 border border-matrix-primary/30 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4 text-matrix-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-matrix-primary">Si eres nuevo cliente</p>
                    <p className="text-[11px] text-matrix-muted mt-0.5 leading-relaxed">
                      Se generará automáticamente una <strong className="text-matrix-text">orden de nueva instalación</strong> para que
                      <span className="text-amber-400 font-semibold"> el admin la gestione</span>.
                    </p>
                  </div>
                </div>
                {/* Cliente existente */}
                <div className="bg-cyan-500/5 border border-cyan-500/25 rounded-lg p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-cyan-400">Si ya eres cliente</p>
                    <p className="text-[11px] text-matrix-muted mt-0.5 leading-relaxed">
                      Tu cuenta se vinculará a tu servicio actual y accederás con el plan elegido.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de planes */}
              <p className="text-[11px] text-matrix-muted uppercase tracking-widest">Selecciona tu plan</p>
              <div className="space-y-2">
                {PLANS.map((p) => (
                  <label
                    key={p.value}
                    className={`flex cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 items-center gap-4 ${
                      data.plan === p.value
                        ? 'border-matrix-primary bg-matrix-primary/8 shadow-[0_8px_24px_rgba(37,99,235,0.10)]'
                        : 'border-matrix-primary/15 hover:border-matrix-primary/40 hover:bg-matrix-primary/3'
                    }`}
                  >
                    <input type="radio" name="plan" value={p.value}
                      checked={data.plan === p.value}
                      onChange={(e) => set('plan', e.target.value)}
                      className="sr-only" />
                    {/* Radio visual */}
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition ${
                      data.plan === p.value ? 'border-matrix-primary' : 'border-matrix-primary/30'
                    }`}>
                      {data.plan === p.value && (
                        <div className="w-2 h-2 rounded-full bg-matrix-primary" style={{ boxShadow: 'none' }} />
                      )}
                    </div>
                    <Wifi className={`w-5 h-5 shrink-0 transition ${data.plan === p.value ? 'text-matrix-primary' : 'text-matrix-muted/50'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-bold text-sm ${data.plan === p.value ? 'text-matrix-text' : 'text-matrix-text/70'}`}>
                          {p.label}
                        </p>
                        <p className={`font-bold text-base ${data.plan === p.value ? 'text-matrix-primary' : 'text-matrix-muted'}`}>
                          {p.price}<span className="text-xs font-normal text-matrix-muted">/mes</span>
                        </p>
                      </div>
                      <p className="text-xs text-matrix-muted">{p.speed} · {p.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Resumen */}
              <div className="mt-2 p-4 bg-black/50 border border-matrix-primary/20 rounded-xl">
                <p className="text-[10px] uppercase tracking-widest text-matrix-muted mb-3">Resumen de tu registro</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-matrix-muted">Nombre</span>
                    <span className="text-matrix-text font-medium">{data.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-muted">DNI / RUC</span>
                    <span className="font-mono text-matrix-text">{data.dni}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-muted">Email</span>
                    <span className="font-mono text-matrix-text/80">{data.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-muted">Dirección</span>
                    <span className="text-matrix-text text-right max-w-[55%] truncate">{data.address}</span>
                  </div>
                  {geo.coords && (
                    <div className="flex justify-between">
                      <span className="text-matrix-muted">📍 GPS</span>
                      <span className="font-mono text-matrix-primary text-[10px]">
                        {geo.coords.latitude.toFixed(5)}, {geo.coords.longitude.toFixed(5)}
                      </span>
                    </div>
                  )}
                  <div className="h-px bg-matrix-primary/15 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-matrix-muted">Plan elegido</span>
                    <span className="text-matrix-primary font-bold">
                      {selectedPlan?.label} — {selectedPlan?.price}/mes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Navegación ── */}
          <div className="flex gap-2 mt-6 pt-4 border-t border-matrix-primary/20">
            {step > 1 ? (
              <button onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-matrix-primary/35 text-sm font-medium text-matrix-muted hover:text-matrix-text hover:bg-matrix-primary/8 transition uppercase tracking-wider">
                <ArrowLeft className="w-4 h-4" /> Atrás
              </button>
            ) : (
              <Link to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-matrix-primary/35 text-sm font-medium text-matrix-muted hover:text-matrix-text hover:bg-matrix-primary/8 transition uppercase tracking-wider">
                <ArrowLeft className="w-4 h-4" /> Login
              </Link>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <button onClick={handleNext}
                className="px-5 py-2 rounded-md bg-matrix-primary text-black text-sm font-bold hover:bg-matrix-hover transition uppercase tracking-wider"
                style={{ boxShadow: '0 8px 20px rgba(37,99,235,0.16)' }}>
                Siguiente ▶
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-matrix-primary text-black text-sm font-bold hover:bg-matrix-hover transition disabled:opacity-50 uppercase tracking-wider"
                style={{ boxShadow: '0 8px 24px rgba(37,99,235,0.20)' }}>
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
                  : <><CheckCircle2 className="w-4 h-4" /> Crear mi cuenta</>}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-matrix-muted/50 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-matrix-primary hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}


