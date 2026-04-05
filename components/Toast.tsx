import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertTriangle, Info, X, Trash2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// ─── Toast Item Component ─────────────────────────────────────────────────────
const ToastItemView: React.FC<{ item: ToastItem; onRemove: (id: string) => void }> = ({ item, onRemove }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), (item.duration ?? 3000) - 300);
    const removeTimer = setTimeout(() => onRemove(item.id), item.duration ?? 3000);
    return () => { clearTimeout(timer); clearTimeout(removeTimer); };
  }, [item, onRemove]);

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />,
    error: <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  const bgMap = {
    success: 'bg-green-900/90 border-green-700/50',
    error: 'bg-red-900/90 border-red-700/50',
    warning: 'bg-yellow-900/90 border-yellow-700/50',
    info: 'bg-blue-900/90 border-blue-700/50',
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-white text-sm font-medium transition-all duration-300 ${bgMap[item.type]} ${exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}>
      {iconMap[item.type]}
      <span className="flex-1">{item.message}</span>
      <button onClick={() => onRemove(item.id)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
        <X className="w-3.5 h-3.5 text-white/60" />
      </button>
    </div>
  );
};

// ─── Confirm Dialog Component ─────────────────────────────────────────────────
const ConfirmDialog: React.FC<{
  options: ConfirmOptions;
  onResolve: (value: boolean) => void;
}> = ({ options, onResolve }) => {
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => setEntering(false));
  }, []);

  const variantColors = {
    danger: {
      btn: 'bg-red-500 hover:bg-red-600 shadow-red-500/30',
      icon: 'bg-red-500/20',
      iconColor: 'text-red-400',
    },
    warning: {
      btn: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/30',
      icon: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
    },
    info: {
      btn: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30',
      icon: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
    },
  };

  const v = variantColors[options.variant ?? 'danger'];

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-200 ${entering ? 'bg-black/0' : 'bg-black/50 backdrop-blur-sm'}`}
      onClick={() => onResolve(false)}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transition-all duration-300 ${entering ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}
        onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-2xl ${v.icon} flex items-center justify-center mx-auto mb-4`}>
            {options.variant === 'danger' ? <Trash2 className={`w-7 h-7 ${v.iconColor}`} /> :
              <AlertTriangle className={`w-7 h-7 ${v.iconColor}`} />}
          </div>
          <h3 className="font-black text-gray-900 text-lg mb-2">{options.title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{options.message}</p>
        </div>
        <div className="flex gap-3 p-4 pt-0">
          <button onClick={() => onResolve(false)}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm">
            {options.cancelText ?? 'Cancel'}
          </button>
          <button onClick={() => onResolve(true)}
            className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-colors text-sm ${v.btn}`}>
            {options.confirmText ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]);
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({
        options,
        resolve: (value: boolean) => {
          setConfirmState(null);
          resolve(value);
        },
      });
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast Stack */}
      <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItemView item={t} onRemove={removeToast} />
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmState && (
        <ConfirmDialog
          options={confirmState.options}
          onResolve={confirmState.resolve}
        />
      )}
    </ToastContext.Provider>
  );
};
