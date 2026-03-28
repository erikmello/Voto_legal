import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const UIContext = createContext(null);

const iconByType = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const stylesByType = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  error: 'border-red-200 bg-red-50 text-red-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  info: 'border-sky-200 bg-sky-50 text-sky-950',
};

const buttonByType = {
  success: 'bg-emerald-600 hover:bg-emerald-700',
  error: 'bg-red-600 hover:bg-red-700',
  warning: 'bg-amber-600 hover:bg-amber-700',
  info: 'bg-sky-600 hover:bg-sky-700',
};

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());
  const [dialog, setDialog] = useState(null);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
  }, []);

  const toast = useCallback((opts) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const next = {
      id,
      type: opts?.type || 'info',
      title: opts?.title || null,
      message: opts?.message || '',
      durationMs: typeof opts?.durationMs === 'number' ? opts.durationMs : 3500,
    };
    setToasts((prev) => [next, ...prev].slice(0, 4));
    if (next.durationMs > 0) {
      const timer = setTimeout(() => dismissToast(id), next.durationMs);
      timersRef.current.set(id, timer);
    }
    return id;
  }, [dismissToast]);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setDialog({
        mode: 'confirm',
        type: opts?.type || 'warning',
        title: opts?.title || 'Confirmar ação',
        message: opts?.message || '',
        confirmText: opts?.confirmText || 'Confirmar',
        cancelText: opts?.cancelText || 'Cancelar',
        resolve,
      });
    });
  }, []);

  const alert = useCallback((opts) => {
    return new Promise((resolve) => {
      setDialog({
        mode: 'alert',
        type: opts?.type || 'info',
        title: opts?.title || 'Atenção',
        message: opts?.message || '',
        confirmText: opts?.confirmText || 'OK',
        resolve,
      });
    });
  }, []);

  const closeDialog = useCallback((result) => {
    setDialog((d) => {
      if (d?.resolve) d.resolve(result);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ toast, confirm, alert, dismissToast }), [toast, confirm, alert, dismissToast]);

  return (
    <UIContext.Provider value={value}>
      {children}

      <div className="fixed right-3 top-3 z-50 flex w-[min(420px,calc(100vw-24px))] flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = iconByType[t.type] || Info;
            const styles = stylesByType[t.type] || stylesByType.info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 24, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={`relative overflow-hidden rounded-xl border shadow-lg ${styles}`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className="mt-0.5">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {t.title ? (
                      <div className="text-sm font-black tracking-tight">{t.title}</div>
                    ) : null}
                    <div className="whitespace-pre-line text-sm font-semibold opacity-90">{t.message}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissToast(t.id)}
                    className="rounded-lg p-1 text-black/50 transition hover:bg-black/5 hover:text-black/80"
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {dialog ? (
          <motion.div
            key="dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeDialog(dialog.mode === 'confirm' ? false : true);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl"
            >
              <div className="flex items-start gap-3 border-b border-gray-100 p-5">
                <div className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white ${buttonByType[dialog.type] || buttonByType.info}`}>
                  {React.createElement(iconByType[dialog.type] || Info, { className: 'h-5 w-5' })}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-black tracking-tight text-gray-900">{dialog.title}</div>
                  <div className="mt-1 whitespace-pre-line text-sm font-semibold text-gray-700">{dialog.message}</div>
                </div>
                <button
                  type="button"
                  onClick={() => closeDialog(dialog.mode === 'confirm' ? false : true)}
                  className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end">
                {dialog.mode === 'confirm' ? (
                  <button
                    type="button"
                    onClick={() => closeDialog(false)}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-800 shadow-sm transition hover:bg-gray-50"
                  >
                    {dialog.cancelText}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => closeDialog(true)}
                  className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-black text-white shadow-sm transition ${buttonByType[dialog.type] || buttonByType.info}`}
                >
                  {dialog.confirmText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}

