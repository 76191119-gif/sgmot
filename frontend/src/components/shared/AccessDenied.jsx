import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccessDenied({ message = 'No tienes permisos para acceder a esta sección.' }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Acceso denegado</h2>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
