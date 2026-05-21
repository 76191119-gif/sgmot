import { useState } from 'react';

const INPUT = "w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring";
const LABEL = "block text-xs font-medium mb-1 text-foreground/80";

export default function ClientForm({ initial, onSubmit, onCancel, loading }) {
  const isEdit = Boolean(initial?.id);
  const [data, setData] = useState({
    full_name: initial?.full_name || '',
    dni:       initial?.dni       || '',
    phone:     initial?.phone     || '',
    email:     initial?.email     || '',
    address:   initial?.address   || '',
    district:  initial?.district  || '',
    plan:      initial?.plan      || 'basico_30mbps',
    status:    initial?.status    || 'activo',
    notes:     initial?.notes     || '',
  });

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Nombre completo *</label>
          <input className={INPUT} required value={data.full_name} onChange={(e) => set('full_name', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>DNI / RUC *</label>
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
        <div className="sm:col-span-2">
          <label className={LABEL}>Dirección *</label>
          <input className={INPUT} required value={data.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Distrito</label>
          <input className={INPUT} value={data.district} onChange={(e) => set('district', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Plan contratado *</label>
          <select className={INPUT} required value={data.plan} onChange={(e) => set('plan', e.target.value)}>
            <option value="basico_30mbps">Básico 30 Mbps</option>
            <option value="estandar_60mbps">Estándar 60 Mbps</option>
            <option value="premium_100mbps">Premium 100 Mbps</option>
            <option value="empresarial_200mbps">Empresarial 200 Mbps</option>
          </select>
        </div>
        {isEdit && (
          <div>
            <label className={LABEL}>Estado</label>
            <select className={INPUT} value={data.status} onChange={(e) => set('status', e.target.value)}>
              <option value="activo">Activo</option>
              <option value="suspendido">Suspendido</option>
              <option value="retirado">Retirado</option>
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className={LABEL}>Notas</label>
          <textarea rows={2} className={INPUT} value={data.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border border-input text-sm font-medium hover:bg-muted">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </div>
    </form>
  );
}
