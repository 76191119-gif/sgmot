import { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const DEMO_GOOGLE_CLIENT_ID = '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';

/**
 * Renderiza el botón oficial de Google Sign-In (Google Identity Services).
 * Si VITE_GOOGLE_CLIENT_ID no está configurado, muestra botón deshabilitado.
 * Si se usa el client id de demostración, renderiza un botón de demo.
 *
 * onCredential: (idToken) => void
 */
export default function GoogleSignInButton({ onCredential, text = 'signin_with' }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    if (GOOGLE_CLIENT_ID === DEMO_GOOGLE_CLIENT_ID) {
      if (ref.current) {
        ref.current.innerHTML = `
          <button 
            type="button"
            style="
              width: 320px;
              height: 40px;
              background: #4285f4;
              color: white;
              border: none;
              border-radius: 4px;
              font-family: Roboto, sans-serif;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              transition: background-color 0.2s;
            "
            onmouseover="this.style.backgroundColor='#357ae8'"
            onmouseout="this.style.backgroundColor='#4285f4'"
            onclick="window.handleGoogleSignIn()"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google (demo)
          </button>
        `;

        window.handleGoogleSignIn = () => {
          const mockCredential = generateMockGoogleToken();
          onCredential(mockCredential);
        };

        setReady(true);
      }
      return;
    }

    // Cargar el script de Google Identity Services real
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
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp) => {
          if (resp.credential) onCredential(resp.credential);
        },
        ux_mode: 'popup',
      });
      if (ref.current) {
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
    }
  }, [onCredential, text]);

  // Función para generar token simulado
  const generateMockGoogleToken = () => {
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      iss: 'accounts.google.com',
      aud: GOOGLE_CLIENT_ID,
      sub: '1234567890',
      email: 'usuario.demo@gmail.com',
      email_verified: true,
      name: 'Usuario Demo Google',
      picture: 'https://lh3.googleusercontent.com/a/default-user',
      given_name: 'Usuario',
      family_name: 'Demo',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }));
    const signature = btoa('mock_signature_for_demo');
    return `${header}.${payload}.${signature}`;
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="space-y-3">
        {/* Botón deshabilitado para mostrar que Google está disponible */}
        <button
          type="button"
          disabled
          className="w-full bg-gray-600/50 text-gray-400 rounded-md py-2.5 px-4 text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2 border border-gray-600/30"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>
        {/* Mensaje informativo */}
        <div className="text-[11px] text-matrix-muted text-center py-2 px-3 border border-dashed border-matrix-primary/20 rounded-md">
          💡 Configura <span className="font-mono">VITE_GOOGLE_CLIENT_ID</span> en <span className="font-mono">.env.local</span> para habilitar el login con Google
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div ref={ref} />
      {!ready && <div className="text-xs text-matrix-muted">Cargando Google…</div>}
    </div>
  );
}
