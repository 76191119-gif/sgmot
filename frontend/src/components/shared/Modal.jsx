import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`cyber-glass relative w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl border border-[#19E35A] overflow-hidden text-matrix-text`}
        style={{
          boxShadow: '0 25px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(57,255,20,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#19E35A] bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-matrix-primary" />
            <h2 className="text-base font-bold text-matrix-primary uppercase tracking-wider">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-matrix-muted hover:text-matrix-primary hover:bg-matrix-primary/10 border border-transparent hover:border-matrix-primary/30 transition-all duration-150"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}
