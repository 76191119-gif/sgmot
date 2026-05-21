import { CheckCircle2, Clock } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function TechnicianPerformance({ technicians = [], orders = [] }) {
  const stats = technicians.map((t) => {
    const assigned  = orders.filter((o) => String(o.technician_id) === String(t.id) || o.technician_name === t.full_name);
    const completed = assigned.filter((o) => o.status === 'completado').length;
    const pending   = assigned.filter((o) => o.status !== 'completado' && o.status !== 'cancelado').length;
    return { ...t, total: assigned.length, completed, pending };
  }).sort((a, b) => b.completed - a.completed);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold mb-4">Rendimiento de Técnicos</h3>
      {stats.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Sin técnicos registrados</p>
      ) : (
        <ul className="divide-y divide-border">
          {stats.map((t) => (
            <li key={t.id} className="py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {getInitials(t.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.full_name}</p>
                <p className="text-xs text-muted-foreground">Total asignadas: {t.total}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t.completed}
                </span>
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <Clock className="w-3.5 h-3.5" /> {t.pending}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
