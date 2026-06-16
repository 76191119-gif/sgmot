const COLOR_MAP = {
  primary: { bg: 'bg-matrix-primary/15',  text: 'text-matrix-primary' },
  green:   { bg: 'bg-matrix-primary/15',  text: 'text-matrix-primary' },
  yellow:  { bg: 'bg-amber-500/15',       text: 'text-amber-300' },
  red:     { bg: 'bg-red-500/15',         text: 'text-red-300' },
  blue:    { bg: 'bg-cyan-500/15',        text: 'text-cyan-300' },
  purple:  { bg: 'bg-purple-500/15',      text: 'text-purple-300' },
};

export default function StatCard({ label, value, subtitle, icon: Icon, color = 'primary' }) {
  const colors = COLOR_MAP[color] || COLOR_MAP.primary;
  return (
    <div className="cyber-surface border border-matrix-primary/20 rounded-xl p-5 transition-all hover:border-matrix-primary/50 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-matrix-muted uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-brand font-bold mt-1 text-matrix-text">{value}</p>
          {subtitle && <p className="text-xs text-matrix-muted mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center shrink-0 border border-current/30`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
