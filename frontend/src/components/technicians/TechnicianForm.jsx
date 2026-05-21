import { useState } from 'react';

const INPUT = "w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring";
const LABEL = "block text-xs font-medium mb-1 text-foreground/80";

export default function TechnicianForm({ initial, onSubmit, onCancel, loading }) {
  const isEdit = Boolean(initial?.id);
  const [data, setData] = useState({
    full_name: initial?.full_name || '',
    dni:       initial?.dni       || '',
    phone:     initial?.phone     || '',
    email:     initial?.email     || '',
    specialty: initial?.specialty || 'instalacion',
    status:    initial?.status    || 'disponible',
    zone:      initial?.zone      || '',
  });
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Nombre completo *</label>
          <input className={INPUT} required value={data.full_name} onChange={(e) => set('full_name', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>DNI *</label>
          <input className={INPUT} required value={data.dni} onChange={(e) => set('dni', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Teléfono *</label>
          <input className={INPUT} required value={data.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Email</label>
          <input type="email" className={INPUT} value={data.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Especialidad *</label>
          <select className={INPUT} required value={data.specialty} onChange={(e) => set('specialty', e.target.value)}>
            <option value="instalacion">Instalación</option>
            <option value="soporte">Soporte</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="fibra_optica">Fibra Óptica</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Estado</label>
          <select className={INPUT} value={data.status} onChange={(e) => set('status', e.target.value)}>
            <option value="disponible">Disponible</option>
            <option value="en_campo">En Campo</option>
            <option value="no_disponible">No Disponible</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Zona de cobertura</label>
          <input className={INPUT} value={data.zone} onChange={(e) => set('zone', e.target.value)} placeholder="Ej: Zona Norte" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border border-input text-sm font-medium hover:bg-muted">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear técnico'}
        </button>
      </div>
    </form>
  );
}
