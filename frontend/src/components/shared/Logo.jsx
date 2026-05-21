/**
 * Logo de SGMOT. Acepta tamaño y opciones de glow / marca.
 * Uso:
 *   <Logo size={56} />
 *   <Logo size={40} glow />
 *   <Logo size={36} withText />
 */
export default function Logo({ size = 40, glow = false, withText = false, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/logo.png"
        alt="SGMOT"
        width={size}
        height={size}
        className={`rounded-full ${glow ? 'animate-glow-pulse' : ''}`}
        style={{ width: size, height: size, objectFit: 'cover' }}
      />
      {withText && (
        <div className="leading-tight">
          <p className="font-brand font-bold text-matrix-primary text-glow-green tracking-wider">SGMOT</p>
          <p className="text-[10px] text-matrix-muted uppercase tracking-widest">INPE CABLE</p>
        </div>
      )}
    </div>
  );
}
