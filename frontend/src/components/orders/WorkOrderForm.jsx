import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/localClient';

const INPUT = "w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring";
const LABEL = "block text-xs font-medium mb-1 text-foreground/80";

export default function WorkOrderForm({ initial, onSubmit, onCancel, loading }) {
  const isEdit = Boolean(initial?.id);
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: api.clients.list });
  const { data: technicians = [] } = useQuery({ queryKey: ['technicians'], queryFn: api.technicians.list });

  const [data, setData] = useState({
    type:             initial?.type             || 'instalacion',
    client_id:        initial?.client_id        || '',
    client_name:      initial?.client_name      || '',
    client_address:   initial?.client_address   || '',
    technician_id:    initial?.technician_id    || '',
    technician_name:  initial?.technician_name  || '',
    status:           initial?.status           || 'pendiente',
    priority:         initial?.priority         || 'media',
    scheduled_date:   initial?.scheduled_date   || '',
    description:      initial?.description      || '',
    resolution_notes: initial?.resolution_notes || '',
  });

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  // Auto-rellenar nombre y dirección al elegir cliente
  useEffect(() => {
    if (!data.client_id) return;
    const c = clients.find((x) => String(x.id) === String(data.client_id));
    if (c) setData((d) => ({ ...d, client_name: c.full_name, client_address: c.address }));
  }, [data.client_id, clients]);

  // Auto-rellenar nombre técnico
  useEffect(() => {
    if (!data.technician_id) { set('technician_name', ''); return; }
    const t = technicians.find((x) => String(x.id) === String(data.technician_id));
    if (t) setData((d) => ({ ...d, technician_name: t.full_name }));
  }, [data.technician_id, technicians]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Tipo de servicio *</label>
          <select className={INPUT} required value={data.type} onChange={(e) => set('type', e.target.value)}>
            <option value="instalacion">Instalación</option>
            <option value="soporte">Soporte Técnico</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="retiro">Retiro de Equipo</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Prioridad</label>
          <select className={INPUT} value={data.priority} onChange={(e) => set('priority', e.target.value)}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Cliente *</label>
          <select className={INPUT} required value={data.client_id} onChange={(e) => set('client_id', e.target.value)}>
            <option value="">Seleccionar...</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name} — {c.dni}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Técnico asignado</label>
          <select className={INPUT} value={data.technician_id || ''} onChange={(e) => set('technician_id', e.target.value)}>
            <option value="">Sin asignar</option>
            {technicians.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Fecha programada</label>
          <input type="date" className={INPUT} value={data.scheduled_date || ''} onChange={(e) => set('scheduled_date', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Estado</label>
          <select className={INPUT} value={data.status} onChange={(e) => set('status', e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En Proceso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Descripción del trabajo</label>
          <textarea rows={3} className={INPUT} value={data.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        {isEdit && (
          <div className="sm:col-span-2">
            <label className={LABEL}>Notas de resolución</label>
            <textarea rows={3} className={INPUT} value={data.resolution_notes} onChange={(e) => set('resolution_notes', e.target.value)} placeholder="Describir lo realizado..." />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border border-input text-sm font-medium hover:bg-muted">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear orden'}
        </button>
      </div>
    </form>
  );
}
