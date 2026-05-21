import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const toast = {
    success: (msg) => push('success', msg),
    error:   (msg) => push('error', msg),
    info:    (msg) => push('info', msg),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const config = {
    success: { Icon: CheckCircle2, cls: 'bg-matrix-primary/15 border-matrix-primary/50 text-matrix-primary glow-green-sm', iconCls: 'text-matrix-primary' },
    error:   { Icon: AlertCircle,  cls: 'bg-red-500/15 border-red-500/50 text-red-300 glow-red',                              iconCls: 'text-red-400' },
    info:    { Icon: Info,         cls: 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300',                                    iconCls: 'text-cyan-400' },
  }[toast.type] || { Icon: Info, cls: 'bg-slate-500/20 border-slate-500/40', iconCls: '' };
  const { Icon, cls, iconCls } = config;
  return (
    <div className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-lg border shadow-lg max-w-sm backdrop-blur ${cls} animate-in slide-in-from-right`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconCls}`} />
      <p className="text-sm flex-1">{toast.message}</p>
      <button onClick={onClose} className="opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { success: () => {}, error: () => {}, info: () => {} };
  return ctx;
}
