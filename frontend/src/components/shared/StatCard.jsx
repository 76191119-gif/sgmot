const COLOR_MAP = {
  primary: { bg: 'bg-[#39FF14]/15', text: 'text-[#39FF14]', border: 'border-[#39FF14]/40' },
  green: { bg: 'bg-[#39FF14]/15', text: 'text-[#39FF14]', border: 'border-[#39FF14]/40' },
  yellow: { bg: 'bg-[#FFD83D]/15', text: 'text-[#FFD83D]', border: 'border-[#FFD83D]/40' },
  red: { bg: 'bg-[#FF4D57]/15', text: 'text-[#FF4D57]', border: 'border-[#FF4D57]/40' },
  blue: { bg: 'bg-[#00E5FF]/15', text: 'text-[#00E5FF]', border: 'border-[#00E5FF]/40' },
  purple: { bg: 'bg-[#1E90FF]/15', text: 'text-[#1E90FF]', border: 'border-[#1E90FF]/40' },
};

export default function StatCard({ label, value, subtitle, icon: Icon, color = 'primary' }) {
  const colors = COLOR_MAP[color] || COLOR_MAP.primary;
  return (
    <div className="cyber-surface border border-[#19E35A]/25 rounded-xl p-5 transition-all hover:border-[#39FF14]/60 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-matrix-muted uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-brand font-bold mt-1 text-matrix-text">{value}</p>
          {subtitle && <p className="text-xs text-matrix-muted mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-lg ${colors.bg} ${colors.text} ${colors.border} flex shrink-0 items-center justify-center shadow-[0_0_22px_rgba(57,255,20,0.10)]`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
