import { statusLabels } from '@/lib/utils';

const STATUS_STYLES = {
  pendiente: 'bg-[#FFD83D]/15 text-[#FFD83D] border-[#FFD83D]/45 shadow-[0_0_18px_rgba(255,216,61,0.10)]',
  en_proceso: 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/45 shadow-[0_0_18px_rgba(0,229,255,0.10)]',
  completado: 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/55 shadow-[0_0_18px_rgba(57,255,20,0.14)]',
  cancelado: 'bg-[#FF4D57]/15 text-[#FF4D57] border-[#FF4D57]/45 shadow-[0_0_18px_rgba(255,77,87,0.10)]',
  activo: 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/55 shadow-[0_0_18px_rgba(57,255,20,0.14)]',
  suspendido: 'bg-[#FFD83D]/15 text-[#FFD83D] border-[#FFD83D]/45',
  retirado: 'bg-[#FF4D57]/15 text-[#FF4D57] border-[#FF4D57]/45',
  disponible: 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/55',
  en_campo: 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/45',
  no_disponible: 'bg-[#FF4D57]/15 text-[#FF4D57] border-[#FF4D57]/45',
  abierta: 'bg-[#FFD83D]/15 text-[#FFD83D] border-[#FFD83D]/45',
  en_atencion: 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/45',
  resuelta: 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/55',
  cerrada: 'bg-[#6D8B78]/18 text-[#A7C7B2] border-[#6D8B78]/45',
  baja: 'bg-[#6D8B78]/18 text-[#A7C7B2] border-[#6D8B78]/45',
  media: 'bg-[#FFD83D]/15 text-[#FFD83D] border-[#FFD83D]/45',
  alta: 'bg-[#A6FF00]/15 text-[#A6FF00] border-[#A6FF00]/45',
  urgente: 'bg-[#FF4D57]/15 text-[#FF4D57] border-[#FF4D57]/45',
  critica: 'bg-[#FF4D57]/20 text-[#FF4D57] border-[#FF4D57]/55 shadow-[0_0_20px_rgba(255,77,87,0.14)]',
};

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;
  const cls = STATUS_STYLES[status] || 'bg-[#6D8B78]/18 text-[#A7C7B2] border-[#6D8B78]/45';

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${cls} ${className}`}>
      {statusLabels[status] || status}
    </span>
  );
}
