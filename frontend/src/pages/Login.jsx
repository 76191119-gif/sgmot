import { useCallback, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Lock, Mail, AlertCircle, UserPlus, Eye, EyeOff } from 'lucide-react';
import GoogleSignInButton from '@/components/shared/GoogleSignInButton';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = useCallback(async (idToken) => {
    setError('');
    setLoading(true);
    try {
      const res = await loginWithGoogle(idToken);
      // Si es un cliente nuevo / perfil incompleto → completar datos
      if (res.user.role === 'cliente' && !res.profile_complete) {
        navigate('/complete-profile');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.error || 'Error con Google');
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#03060A]"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-85"
        src="/cyberpunk.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[#03060A]/18" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,6,10,0.12)_42%,rgba(3,6,10,0.62)_100%)]" />
      <div className="absolute inset-0 bg-matrix-grid opacity-45 mix-blend-screen" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(57,255,20,0.07),transparent_24%,rgba(0,229,255,0.09)_100%)]" />

      <div className="relative w-full max-w-md">
        {/* Logo + título */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="SGMOT"
            className="w-28 h-28 mx-auto animate-glow-pulse rounded-full"
          />
          <p className="text-matrix-primary text-xs font-bold uppercase tracking-[0.3em] mt-3">SGMOT</p>
          <p className="text-matrix-text/70 text-xs mt-1">Sistema de Gestión y Monitoreo de Órdenes de Trabajo</p>
        </div>

        {/* Card */}
        <div
          className="login-glass rounded-2xl p-7 shadow-2xl"
        >
          <h2 className="text-lg font-brand font-bold mb-1 text-matrix-primary text-glow-green text-center tracking-wider">
            ACCESO AL SISTEMA
          </h2>
          <div className="h-px bg-gradient-to-r from-transparent via-matrix-primary/60 to-transparent mb-5" />

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg p-3 mb-4 flex items-center gap-2 glow-red">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-matrix-muted uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Email
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary focus:ring-1 focus:ring-matrix-primary/50 transition"
                required autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-matrix-muted uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-matrix-primary focus:ring-1 focus:ring-matrix-primary/50 transition"
                  required autoComplete="current-password"
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
            <button
              type="submit" disabled={loading}
              className="w-full bg-matrix-primary text-black rounded-md py-2.5 text-sm font-bold hover:bg-matrix-hover transition-all flex items-center justify-center gap-2 mt-3 uppercase tracking-wider glow-green-sm hover:glow-green disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Conectando...' : '▶ INGRESAR'}
            </button>
          </form>

          {/* Separador */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-matrix-primary/20" />
            <span className="text-[10px] text-matrix-muted uppercase tracking-widest">o continúa con</span>
            <div className="flex-1 h-px bg-matrix-primary/20" />
          </div>

          {/* Google Sign-In */}
          <GoogleSignInButton
            onCredential={handleGoogle}
            onError={setError}
            text="signin_with"
          />

          {/* Link a registro */}
          <div className="mt-6 pt-4 border-t border-matrix-primary/20 text-center">
            <p className="text-xs text-matrix-muted">¿No tienes cuenta?</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 mt-1.5 px-4 py-2 rounded-md border border-matrix-primary/40 text-matrix-primary text-sm font-semibold hover:bg-matrix-primary/10 hover:border-matrix-primary transition uppercase tracking-wider"
            >
              <UserPlus className="w-4 h-4" />
              Registrarse como cliente
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

