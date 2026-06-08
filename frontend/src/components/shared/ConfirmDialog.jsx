import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message,
  confirmText = 'Eliminar',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex gap-4 items-start mb-6">
        <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <p className="text-sm text-matrix-text/80 leading-relaxed pt-2">{message}</p>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-matrix-primary/15">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md border border-matrix-primary/30 text-sm font-medium text-matrix-muted hover:text-matrix-text hover:bg-matrix-primary/5 transition"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-red-500/80 hover:bg-red-500 text-white text-sm font-bold transition disabled:opacity-50 uppercase tracking-wider"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
            : confirmText}
        </button>
      </div>
    </Modal>
  );
}
