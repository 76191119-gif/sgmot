import { User, MapPin, Wrench, Calendar, Pencil, Trash2, ChevronDown, PackagePlus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import StatusBadge from '@/components/shared/StatusBadge';
import { typeLabels, formatDate } from '@/lib/utils';
import { usePermissions } from '@/lib/usePermissions';

const STATUSES = [
  { value: 'pendiente',  label: 'Pendiente' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado',  label: 'Cancelado' },
];

// Colores de borde superior por tipo de orden
const TYPE_ACCENT = {
  nueva_instalacion: 'border-t-matrix-primary',
  instalacion:       'border-t-emerald-500',
  soporte:           'border-t-blue-500',
  mantenimiento:     'border-t-amber-500',
  retiro:            'border-t-red-500',
};

export default function WorkOrderCard({ order, onEdit, onDelete, onChangeStatus }) {
  const perms = usePermissions();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isNuevaInst = order.type === 'nueva_instalacion';
  const accentCls   = TYPE_ACCENT[order.type] || 'border-t-matrix-primary/30';

  return (
    <div className={`relative bg-black/60 border border-matrix-primary/20 border-t-2 ${accentCls} rounded-xl p-4 hover:border-matrix-primary/40 hover:bg-black/70 transition-all duration-200`}
      style={{ boxShadow: isNuevaInst ? '0 0 20px rgba(0,255,65,0.06)' : 'none' }}>

      {/* Badge especial para nueva instalación */}
      {isNuevaInst && (
        <div className="absolute -top-2.5 left-4">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-matrix-primary text-black uppercase tracking-wider">
            <PackagePlus className="w-2.5 h-2.5" /> Nueva Instalación
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`flex items-start justify-between gap-3 mb-3 ${isNuevaInst ? 'mt-1' : ''}`}>
        <div className="min-w-0">
          <p className="text-[10px] font-mono text-matrix-muted">{order.order_number}</p>
          <p className={`font-bold text-sm mt-0.5 ${isNuevaInst ? 'text-matrix-primary' : 'text-matrix-text'}`}>
            {typeLabels[order.type] || order.type}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 justify-end shrink-0">
          <StatusBadge status={order.priority} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Detalles */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-matrix-text/80">
          <User className="w-3.5 h-3.5 text-matrix-muted shrink-0" />
          <span className="truncate">{order.client_name || 'Sin cliente'}</span>
        </div>
        <div className="flex items-center gap-2 text-matrix-text/70">
          <MapPin className="w-3.5 h-3.5 text-matrix-muted shrink-0" />
          <span className="truncate text-xs">{order.client_address || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-matrix-text/70">
          <Wrench className="w-3.5 h-3.5 text-matrix-muted shrink-0" />
          <span className="truncate text-xs">
            {order.technician_name
              ? order.technician_name
              : <span className="text-amber-400/70 italic">Sin asignar</span>}
          </span>
        </div>
        <div className="flex items-center gap-2 text-matrix-text/60">
          <Calendar className="w-3.5 h-3.5 text-matrix-muted shrink-0" />
          <span className="text-xs">{formatDate(order.scheduled_date) || '—'}</span>
        </div>
      </div>

      {order.description && (
        <p className="text-xs text-matrix-muted mt-3 line-clamp-2 leading-relaxed">{order.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-matrix-primary/15">
        {perms.canChangeOrderStatus && onChangeStatus ? (
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-matrix-primary/30 text-matrix-muted hover:text-matrix-primary hover:border-matrix-primary/60 hover:bg-matrix-primary/8 transition"
            >
              Estado <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-black/95 border border-matrix-primary/30 rounded-lg shadow-xl z-10 py-1 overflow-hidden"
                style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.8), 0 0 15px rgba(0,255,65,0.08)' }}>
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { onChangeStatus(s.value); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs transition hover:bg-matrix-primary/10 hover:text-matrix-primary ${
                      order.status === s.value ? 'text-matrix-primary bg-matrix-primary/5' : 'text-matrix-muted'
                    }`}
                  >
                    {order.status === s.value ? '✓ ' : ''}{s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : <div />}

        <div className="flex items-center gap-1">
          {perms.canEdit && onEdit && (
            <button onClick={() => onEdit(order)}
              className="p-1.5 rounded-md hover:bg-matrix-primary/10 text-matrix-muted hover:text-matrix-primary transition"
              title="Editar">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {perms.canDelete && onDelete && (
            <button onClick={() => onDelete(order)}
              className="p-1.5 rounded-md hover:bg-red-500/10 text-matrix-muted hover:text-red-400 transition"
              title="Eliminar">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
