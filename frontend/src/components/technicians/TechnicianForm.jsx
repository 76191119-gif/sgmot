import { useState } from 'react';
import {
  User, IdCard, Phone, Mail, Wrench, MapPin, Radio, Loader2,
} from 'lucide-react';

const INPUT  = "w-full bg-black/60 border border-matrix-primary/30 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-matrix-primary focus:ring-1 focus:ring-matrix-primary/50 transition text-matrix-text placeholder:text-matrix-muted/40";
const SELECT = `${INPUT} cursor-pointer`;
const LABEL  = "flex items-center gap-1.5 text-[11px] font-medium mb-1.5 text-matrix-muted uppercase tracking-wider";

const STATUS_CLS = {
  disponible:    'border-emerald-500/50 text-emerald-400',
  en_campo:      'border-amber-500/50 text-amber-400',
  no_disponible: 'border-red-500/50 text-red-400',
};

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
            <label className={LABEL}><IdCard className="w-3 h-3" /> DNI *</label>
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
              placeholder="tecnico@sgmot.com" />
            <p className="text-[10px] text-matrix-muted/50 mt-1">
              Debe coincidir con el email de su cuenta de usuario
            </p>
          </div>
        </div>
      </div>

      {/* ── Operativo ── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-matrix-muted/60 mb-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-matrix-primary/20" />
          Datos operativos
          <span className="h-px flex-1 bg-matrix-primary/20" />
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}><Wrench className="w-3 h-3" /> Especialidad *</label>
            <select className={SELECT} required value={data.specialty}
              onChange={(e) => set('specialty', e.target.value)}>
              <option value="instalacion">Instalación</option>
              <option value="soporte">Soporte Técnico</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="fibra_optica">Fibra Óptica</option>
            </select>
          </div>
          <div>
            <label className={LABEL}><Radio className="w-3 h-3" /> Estado</label>
            <select
              className={`${SELECT} border-2 ${STATUS_CLS[data.status] || ''}`}
              value={data.status}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value="disponible">Disponible</option>
              <option value="en_campo">En Campo</option>
              <option value="no_disponible">No Disponible</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}><MapPin className="w-3 h-3" /> Zona de cobertura</label>
            <input className={INPUT} value={data.zone}
              onChange={(e) => set('zone', e.target.value)}
              placeholder="Ej: Zona Norte, Zona Sur..." />
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
            : isEdit ? 'Guardar cambios' : 'Crear técnico'}
        </button>
      </div>
    </form>
  );
}
