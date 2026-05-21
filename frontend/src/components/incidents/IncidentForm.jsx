import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/localClient';

const INPUT = "w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring";
const LABEL = "block text-xs font-medium mb-1 text-foreground/80";

export default function IncidentForm({ initial, onSubmit, onCancel, loading }) {
  const isEdit = Boolean(initial?.id);
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: api.clients.list });

  const [data, setData] = useState({
    title:       initial?.title       || '',
    client_id:   initial?.client_id   || '',
    client_name: initial?.client_name || '',
    category:    initial?.category    || 'sin_servicio',
    priority:    initial?.priority    || 'media',
    status:      initial?.status      || 'abierta',
    description: initial?.description || '',
    resolution:  initial?.resolution  || '',
  });

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  useEffect(() => {
    if (!data.client_id) return;
    const c = clients.find((x) => String(x.id) === String(data.client_id));
    if (c) setData((d) => ({ ...d, client_name: c.full_name }));
  }, [data.client_id, clients]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-4">
      <div>
        <label className={LABEL}>Título *</label>
        <input className={INPUT} required value={data.title} onChange={(e) => set('title', e.target.value)} placeholder="Ej: Sin internet desde ayer" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Cliente *</label>
          <select className={INPUT} required value={data.client_id} onChange={(e) => set('client_id', e.target.value)}>
            <option value="">Seleccionar...</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Categoría *</label>
          <select className={INPUT} required value={data.category} onChange={(e) => set('category', e.target.value)}>
            <option value="sin_servicio">Sin Servicio</option>
            <option value="lentitud">Lentitud</option>
            <option value="corte_fibra">Corte de Fibra</option>
            <option value="equipo_danado">Equipo Dañado</option>
            <option value="configuracion">Configuración</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Prioridad</label>
          <select className={INPUT} value={data.priority} onChange={(e) => set('priority', e.target.value)}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
        {isEdit && (
          <div>
            <label className={LABEL}>Estado</label>
            <select className={INPUT} value={data.status} onChange={(e) => set('status', e.target.value)}>
              <option value="abierta">Abierta</option>
              <option value="en_atencion">En Atención</option>
              <option value="resuelta">Resuelta</option>
              <option value="cerrada">Cerrada</option>
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className={LABEL}>Descripción</label>
          <textarea rows={3} className={INPUT} value={data.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        {isEdit && (
          <div className="sm:col-span-2">
            <label className={LABEL}>Resolución aplicada</label>
            <textarea rows={3} className={INPUT} value={data.resolution} onChange={(e) => set('resolution', e.target.value)} />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border border-input text-sm font-medium hover:bg-muted">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear incidencia'}
        </button>
      </div>
    </form>
  );
}
