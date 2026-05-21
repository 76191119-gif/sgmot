import { statusLabels } from '@/lib/utils';

// Tema Matrix: fondos translúcidos sobre dark, con texto y bordes neón
const STATUS_STYLES = {
  // Órdenes
  pendiente:     'bg-amber-500/15 text-amber-300 border-amber-500/40',
  en_proceso:    'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  completado:    'bg-matrix-primary/20 text-matrix-primary border-matrix-primary/50',
  cancelado:     'bg-red-500/15 text-red-300 border-red-500/40',
  // Clientes
  activo:        'bg-matrix-primary/20 text-matrix-primary border-matrix-primary/50',
  suspendido:    'bg-amber-500/15 text-amber-300 border-amber-500/40',
  retirado:      'bg-red-500/15 text-red-300 border-red-500/40',
  // Técnicos
  disponible:    'bg-matrix-primary/20 text-matrix-primary border-matrix-primary/50',
  en_campo:      'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  no_disponible: 'bg-red-500/15 text-red-300 border-red-500/40',
  // Incidencias
  abierta:       'bg-amber-500/15 text-amber-300 border-amber-500/40',
  en_atencion:   'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  resuelta:      'bg-matrix-primary/20 text-matrix-primary border-matrix-primary/50',
  cerrada:       'bg-slate-500/20 text-slate-400 border-slate-500/40',
  // Prioridades
  baja:          'bg-slate-500/20 text-slate-400 border-slate-500/40',
  media:         'bg-amber-500/15 text-amber-300 border-amber-500/40',
  alta:          'bg-orange-500/20 text-orange-300 border-orange-500/40',
  urgente:       'bg-red-500/15 text-red-300 border-red-500/40',
  critica:       'bg-red-500/20 text-red-400 border-red-500/50',
};

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;
  const cls = STATUS_STYLES[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/40';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border uppercase tracking-wider ${cls} ${className}`}>
      {statusLabels[status] || status}
    </span>
  );
}
