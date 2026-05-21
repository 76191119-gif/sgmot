import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const INPUT = "w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring";
const LABEL = "block text-xs font-medium mb-1 text-foreground/80";

export default function UserForm({ initial, onSubmit, onCancel, loading }) {
  const isEdit = Boolean(initial?.id);
  const [data, setData] = useState({
    full_name: initial?.full_name || '',
    email:     initial?.email     || '',
    role:      initial?.role      || 'cliente',
    password:  '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { full_name: data.full_name, email: data.email, role: data.role };
    if (data.password) payload.password = data.password;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Nombre completo *</label>
          <input className={INPUT} required value={data.full_name} onChange={(e) => set('full_name', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Email *</label>
          <input type="email" className={INPUT} required value={data.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Rol *</label>
          <select className={INPUT} required value={data.role} onChange={(e) => set('role', e.target.value)}>
            <option value="cliente">Cliente</option>
            <option value="tecnico">Técnico</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>
            {isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} 
              className={`${INPUT} pr-10`}
              required={!isEdit} 
              minLength={4}
              placeholder={isEdit ? 'Dejar vacío para mantener' : 'Mínimo 4 caracteres'}
              value={data.password}
              onChange={(e) => set('password', e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110 focus:outline-none focus:text-primary"
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
      </div>

      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-md p-3 text-xs text-cyan-300">
        💡 <strong>Tip:</strong> Para que un técnico o cliente vea su panel personalizado, su email debe coincidir
        con el email de su ficha en la tabla de Técnicos o Clientes.
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border border-input text-sm font-medium hover:bg-muted">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
        </button>
      </div>
    </form>
  );
}
