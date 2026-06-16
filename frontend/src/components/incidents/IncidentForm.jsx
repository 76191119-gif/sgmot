import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';
import { incidentCategoryOptions } from '@/lib/utils';

const INPUT = "w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary focus:ring-1 focus:ring-matrix-primary/50 transition text-matrix-text placeholder:text-matrix-muted/40";
const LABEL = "block text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider";
const SELECT = `${INPUT} cursor-pointer`;

export default function IncidentForm({ initial, onSubmit, onCancel, loading }) {
  const { user } = useAuth();
  const isEdit = Boolean(initial?.id);
  const isAdmin = user?.role === 'admin';
  const isCliente = user?.role === 'cliente';

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: api.clients.list,
    enabled: isAdmin,
  });
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: api.technicians.list,
    enabled: isAdmin,
  });

  const [data, setData] = useState({
    title: initial?.title || '',
    client_id: initial?.client_id || '',
    client_name: initial?.client_name || '',
    technician_id: initial?.technician_id || '',
    technician_name: initial?.technician_name || '',
    category: initial?.category || 'sin_servicio',
    priority: initial?.priority || 'media',
    status: initial?.status || 'abierta',
    description: initial?.description || '',
    resolution: initial?.resolution || '',
  });

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  useEffect(() => {
    if (!isAdmin || !data.client_id) return;
    const c = clients.find((x) => String(x.id) === String(data.client_id));
    if (c) setData((d) => ({ ...d, client_name: c.full_name }));
  }, [data.client_id, clients, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (!data.technician_id) {
      setData((d) => ({ ...d, technician_name: '' }));
      return;
    }
    const t = technicians.find((x) => String(x.id) === String(data.technician_id));
    if (t) setData((d) => ({ ...d, technician_name: t.full_name }));
  }, [data.technician_id, technicians, isAdmin]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-4">
      <div>
        <label className={LABEL}>Titulo *</label>
        <input
          className={INPUT}
          required
          value={data.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Ej: Sin internet desde ayer"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isAdmin && (
          <div>
            <label className={LABEL}>Cliente *</label>
            <select className={SELECT} required value={data.client_id} onChange={(e) => set('client_id', e.target.value)}>
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} - {c.dni}</option>
              ))}
            </select>
          </div>
        )}

        {!isAdmin && isEdit && (
          <div>
            <label className={LABEL}>Cliente</label>
            <input className={INPUT} value={data.client_name} readOnly disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
        )}

        <div>
          <label className={LABEL}>Categoria *</label>
          <select className={SELECT} required value={data.category} onChange={(e) => set('category', e.target.value)}>
            {incidentCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>Prioridad</label>
          <select className={SELECT} value={data.priority} onChange={(e) => set('priority', e.target.value)}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Critica</option>
          </select>
        </div>

        {isAdmin && (
          <div>
            <label className={LABEL}>Tecnico asignado</label>
            <select className={SELECT} value={data.technician_id || ''} onChange={(e) => set('technician_id', e.target.value)}>
              <option value="">Sin asignar...</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name} - {t.specialty}</option>
              ))}
            </select>
          </div>
        )}

        {isEdit && !isCliente && (
          <div>
            <label className={LABEL}>Estado</label>
            <select className={SELECT} value={data.status} onChange={(e) => set('status', e.target.value)}>
              <option value="abierta">Abierta</option>
              <option value="en_atencion">En Atencion</option>
              <option value="resuelta">Resuelta</option>
              <option value="cerrada">Cerrada</option>
            </select>
          </div>
        )}

        <div className="sm:col-span-2">
          <label className={LABEL}>Descripcion del problema</label>
          <textarea
            rows={3}
            className={INPUT}
            value={data.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Describe el problema con el mayor detalle posible..."
          />
        </div>

        {isEdit && !isCliente && (
          <div className="sm:col-span-2">
            <label className={LABEL}>Resolucion aplicada</label>
            <textarea
              rows={3}
              className={INPUT}
              value={data.resolution}
              onChange={(e) => set('resolution', e.target.value)}
              placeholder="Describe la solucion aplicada..."
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-matrix-primary/20">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md border border-matrix-primary/30 text-sm font-medium text-matrix-muted hover:text-matrix-text hover:bg-matrix-primary/5 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-md bg-matrix-primary text-black text-sm font-bold hover:bg-matrix-hover transition disabled:opacity-50 uppercase tracking-wider"
        >
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear incidencia'}
        </button>
      </div>
    </form>
  );
}
