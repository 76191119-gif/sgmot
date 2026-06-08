import { useState } from 'react';
import {
  User, IdCard, Phone, Mail, Home, Map as MapIcon,
  Wifi, Activity, FileText, Loader2,
} from 'lucide-react';

const INPUT  = "w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary focus:ring-1 focus:ring-matrix-primary/50 transition text-matrix-text placeholder:text-matrix-muted/40";
const SELECT = `${INPUT} cursor-pointer`;
const LABEL  = "flex items-center gap-1.5 text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider";

const PLAN_LABELS = {
  basico_30mbps:       'Básico — 30 Mbps',
  estandar_60mbps:     'Estándar — 60 Mbps',
  premium_100mbps:     'Premium — 100 Mbps',
  empresarial_200mbps: 'Empresarial — 200 Mbps',
};

const STATUS_CLS = {
  activo:     'bg-emerald-500/10 border-emerald-500/40 text-emerald-400',
  suspendido: 'bg-amber-500/10 border-amber-500/40 text-amber-400',
  retirado:   'bg-red-500/10 border-red-500/40 text-red-400',
};

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

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-5">

      {/* ── Datos personales ── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-matrix-muted/60 mb-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-matrix-primary/20" />
          Datos personales
          <span className="h-px flex-1 bg-matrix-primary/20" />
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}><User className="w-3 h-3" /> Nombre completo *</label>
            <input className={INPUT} required value={data.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              placeholder="Nombre y apellidos" />
          </div>
          <div>
            <label className={LABEL}><IdCard className="w-3 h-3" /> DNI / RUC *</label>
            <input className={INPUT} required value={data.dni}
              onChange={(e) => set('dni', e.target.value)}
              placeholder="12345678" />
          </div>
          <div>
            <label className={LABEL}><Phone className="w-3 h-3" /> Teléfono *</label>
            <input className={INPUT} required value={data.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="987654321" />
          </div>
          <div>
            <label className={LABEL}><Mail className="w-3 h-3" /> Email</label>
            <input type="email" className={INPUT} value={data.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="cliente@ejemplo.com" />
          </div>
        </div>
      </div>

      {/* ── Ubicación ── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-matrix-muted/60 mb-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-matrix-primary/20" />
          Ubicación
          <span className="h-px flex-1 bg-matrix-primary/20" />
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={LABEL}><Home className="w-3 h-3" /> Dirección *</label>
            <input className={INPUT} required value={data.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Calle, número, referencia" />
          </div>
          <div>
            <label className={LABEL}><MapIcon className="w-3 h-3" /> Distrito</label>
            <input className={INPUT} value={data.district}
              onChange={(e) => set('district', e.target.value)}
              placeholder="Ej: Wanchaq" />
          </div>
        </div>
      </div>

      {/* ── Servicio ── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-matrix-muted/60 mb-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-matrix-primary/20" />
          Servicio
          <span className="h-px flex-1 bg-matrix-primary/20" />
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}><Wifi className="w-3 h-3" /> Plan contratado *</label>
            <select className={SELECT} required value={data.plan} onChange={(e) => set('plan', e.target.value)}>
              {Object.entries(PLAN_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          {isEdit && (
            <div>
              <label className={LABEL}><Activity className="w-3 h-3" /> Estado</label>
              <select
                className={`${SELECT} border-2 ${STATUS_CLS[data.status] || ''}`}
                value={data.status}
                onChange={(e) => set('status', e.target.value)}
              >
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
                <option value="retirado">Retirado</option>
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className={LABEL}><FileText className="w-3 h-3" /> Notas internas</label>
            <textarea rows={2} className={INPUT} value={data.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Observaciones, referencias adicionales..." />
          </div>
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="flex justify-end gap-2 pt-3 border-t border-matrix-primary/20">
        <button
          type="button" onClick={onCancel}
          className="px-4 py-2 rounded-md border border-matrix-primary/30 text-sm font-medium text-matrix-muted hover:text-matrix-text hover:bg-matrix-primary/5 transition"
        >
          Cancelar
        </button>
        <button
          type="submit" disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-matrix-primary text-black text-sm font-bold hover:bg-matrix-hover transition disabled:opacity-50 uppercase tracking-wider"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            : isEdit ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </div>
    </form>
  );
}
