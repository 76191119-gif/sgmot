import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';

const INPUT = "w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary focus:ring-1 focus:ring-matrix-primary/50 transition text-matrix-text placeholder:text-matrix-muted/40";
const LABEL = "block text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider";
const SELECT = `${INPUT} cursor-pointer`;

export default function WorkOrderForm({ initial, onSubmit, onCancel, loading }) {
  const { user } = useAuth();
  const isEdit    = Boolean(initial?.id);
  const isAdmin   = user?.role === 'admin';
  const isTecnico = user?.role === 'tecnico';

  // Solo admins pueden listar clientes y técnicos
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

  // Auto-rellenar nombre y dirección al elegir cliente (solo admin)
  useEffect(() => {
    if (!isAdmin || !data.client_id) return;
    const c = clients.find((x) => String(x.id) === String(data.client_id));
    if (c) setData((d) => ({ ...d, client_name: c.full_name, client_address: c.address }));
  }, [data.client_id, clients, isAdmin]);

  // Auto-rellenar nombre técnico (solo admin)
  useEffect(() => {
    if (!isAdmin) return;
    if (!data.technician_id) { set('technician_name', ''); return; }
    const t = technicians.find((x) => String(x.id) === String(data.technician_id));
    if (t) setData((d) => ({ ...d, technician_name: t.full_name }));
  }, [data.technician_id, technicians, isAdmin]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Tipo de servicio */}
        <div>
          <label className={LABEL}>Tipo de servicio *</label>
          <select className={SELECT} required value={data.type} onChange={(e) => set('type', e.target.value)}
            disabled={isTecnico}>
            <option value="nueva_instalacion">Nueva Instalación</option>
            <option value="instalacion">Instalación / Reinstalación</option>
            <option value="soporte">Soporte Técnico</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="retiro">Retiro de Equipo</option>
          </select>
        </div>

        {/* Prioridad */}
        <div>
          <label className={LABEL}>Prioridad</label>
          <select className={SELECT} value={data.priority} onChange={(e) => set('priority', e.target.value)}
            disabled={isTecnico}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>

        {/* Cliente — selector para admin, solo lectura para técnico */}
        {isAdmin ? (
          <div>
            <label className={LABEL}>Cliente *</label>
            <select className={SELECT} required value={data.client_id} onChange={(e) => set('client_id', e.target.value)}>
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} — {c.dni}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className={LABEL}>Cliente</label>
            <input className={INPUT} value={data.client_name} readOnly disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
        )}

        {/* Técnico asignado — solo admin */}
        {isAdmin && (
          <div>
            <label className={LABEL}>Técnico asignado</label>
            <select className={SELECT} value={data.technician_id || ''} onChange={(e) => set('technician_id', e.target.value)}>
              <option value="">Sin asignar</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name} — {t.specialty}</option>
              ))}
            </select>
          </div>
        )}

        {/* Fecha programada — solo admin */}
        {isAdmin && (
          <div>
            <label className={LABEL}>Fecha programada</label>
            <input type="date" className={INPUT} value={data.scheduled_date || ''}
              onChange={(e) => set('scheduled_date', e.target.value)} />
          </div>
        )}

        {/* Estado */}
        <div>
          <label className={LABEL}>Estado</label>
          <select className={SELECT} value={data.status} onChange={(e) => set('status', e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En Proceso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        {/* Descripción */}
        <div className="sm:col-span-2">
          <label className={LABEL}>Descripción del trabajo</label>
          <textarea rows={3} className={INPUT} value={data.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Describe el trabajo a realizar..."
            readOnly={isTecnico && !isEdit}
          />
        </div>

        {/* Notas de resolución — técnico y admin al editar */}
        {isEdit && (
          <div className="sm:col-span-2">
            <label className={LABEL}>Notas de resolución</label>
            <textarea rows={3} className={INPUT} value={data.resolution_notes}
              onChange={(e) => set('resolution_notes', e.target.value)}
              placeholder="Describe lo realizado, materiales usados, observaciones..."
            />
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-3 border-t border-matrix-primary/20">
        <button
          type="button" onClick={onCancel}
          className="px-4 py-2 rounded-md border border-matrix-primary/30 text-sm font-medium text-matrix-muted hover:text-matrix-text hover:bg-matrix-primary/5 transition"
        >
          Cancelar
        </button>
        <button
          type="submit" disabled={loading}
          className="px-5 py-2 rounded-md bg-matrix-primary text-black text-sm font-bold hover:bg-matrix-hover transition disabled:opacity-50 uppercase tracking-wider"
        >
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear orden'}
        </button>
      </div>
    </form>
  );
}
