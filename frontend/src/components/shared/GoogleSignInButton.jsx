import { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const DEMO_GOOGLE_CLIENT_ID = '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';
const ALLOW_GOOGLE_DEMO = import.meta.env.VITE_ALLOW_GOOGLE_DEMO === 'true';
const GOOGLE_ENABLED = Boolean(GOOGLE_CLIENT_ID) && (GOOGLE_CLIENT_ID !== DEMO_GOOGLE_CLIENT_ID || ALLOW_GOOGLE_DEMO);

export default function GoogleSignInButton({ onCredential, onError, text = 'signin_with' }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!GOOGLE_ENABLED) return;
    setReady(false);
    setLoadError('');

    if (GOOGLE_CLIENT_ID === DEMO_GOOGLE_CLIENT_ID && ALLOW_GOOGLE_DEMO) {
      window.handleGoogleSignIn = () => onCredential(generateMockGoogleToken());
      if (ref.current) {
        ref.current.innerHTML = `
          <button type="button" onclick="window.handleGoogleSignIn()"
            style="width:320px;height:40px;background:#4285f4;color:white;border:0;border-radius:4px;font-family:Roboto,sans-serif;font-size:14px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
            Continuar con Google (demo)
          </button>
        `;
      }
      setReady(true);
      return;
    }

    let script = document.getElementById('google-gsi-client');
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const init = () => {
      if (!window.google?.accounts?.id) {
        setLoadError('No se pudo inicializar Google Sign-In');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp) => {
          if (resp.credential) {
            onCredential(resp.credential);
            return;
          }
          onError?.('Google no devolvio credencial. Revisa el origen autorizado del Client ID.');
        },
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (ref.current) {
        ref.current.innerHTML = '';
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'filled_blue',
          size: 'large',
          type: 'standard',
          text,
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 320,
        });
        setReady(true);
      }
    };

    if (window.google?.accounts?.id) {
      init();
    } else {
      script.addEventListener('load', init, { once: true });
      script.addEventListener('error', () => {
        const message = 'No se pudo cargar Google Sign-In. Revisa internet o bloqueadores del navegador.';
        setLoadError(message);
        onError?.(message);
      }, { once: true });
    }
  }, [onCredential, text]);

  const generateMockGoogleToken = () => {
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      iss: 'accounts.google.com',
      aud: GOOGLE_CLIENT_ID,
      sub: '1234567890',
      email: 'usuario.demo@gmail.com',
      email_verified: true,
      name: 'Usuario Demo Google',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));
    return `${header}.${payload}.${btoa('mock_signature_for_demo')}`;
  };

  if (!GOOGLE_ENABLED) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          disabled
          className="w-full bg-gray-600/50 text-gray-400 rounded-md py-2.5 px-4 text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2 border border-gray-600/30"
        >
          Continuar con Google
        </button>
        <div className="text-[11px] text-matrix-muted text-center py-2 px-3 border border-dashed border-matrix-primary/20 rounded-md">
          Configura <span className="font-mono">VITE_GOOGLE_CLIENT_ID</span> en <span className="font-mono">.env.local</span> para habilitar Google.
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div ref={ref} />
      {!ready && !loadError && <div className="text-xs text-matrix-muted">Cargando Google...</div>}
      {loadError && <div className="text-xs text-red-400 text-center">{loadError}</div>}
      {!loadError && ready && (
        <div className="sr-only">
          Origen actual: {window.location.origin}. Autoriza este origen en Google Cloud.
        </div>
      )}
    </div>
  );
}
