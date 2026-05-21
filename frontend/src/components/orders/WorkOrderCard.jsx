import { User, MapPin, Wrench, Calendar, Pencil, Trash2, ChevronDown } from 'lucide-react';
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

export default function WorkOrderCard({ order, onEdit, onDelete, onChangeStatus }) {
  const perms = usePermissions();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:shadow-primary/5 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-mono text-muted-foreground">{order.order_number}</p>
          <p className="font-semibold text-sm mt-0.5">{typeLabels[order.type] || order.type}</p>
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          <StatusBadge status={order.priority} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-foreground/80">
          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{order.client_name || 'Sin cliente'}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground/80">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{order.client_address || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground/80">
          <Wrench className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{order.technician_name || 'Sin asignar'}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground/80">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span>{formatDate(order.scheduled_date) || '—'}</span>
        </div>
      </div>

      {order.description && (
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{order.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border">
        {perms.canChangeOrderStatus && onChangeStatus ? (
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-md border border-input hover:bg-muted"
            >
              Cambiar estado <ChevronDown className="w-3 h-3" />
            </button>
            {open && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-card border border-border rounded-md shadow-lg z-10 py-1">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { onChangeStatus(s.value); setOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : <div />}

        <div className="flex items-center gap-1">
          {perms.canEdit && onEdit && (
            <button onClick={() => onEdit(order)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Editar">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {perms.canDelete && onDelete && (
            <button onClick={() => onDelete(order)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600" title="Eliminar">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
