import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast container in bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const { message, type } = toast;

  const typeConfig = {
    success: {
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      border: 'border-emerald-500/20 bg-emerald-950/20 dark:bg-emerald-950/25',
      glow: 'shadow-emerald-500/5',
    },
    error: {
      icon: <AlertOctagon className="w-5 h-5 text-rose-400" />,
      border: 'border-rose-500/20 bg-rose-950/20 dark:bg-rose-950/25',
      glow: 'shadow-rose-500/5',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      border: 'border-amber-500/20 bg-amber-950/20 dark:bg-amber-950/25',
      glow: 'shadow-amber-500/5',
    },
    info: {
      icon: <Info className="w-5 h-5 text-cyan-400" />,
      border: 'border-cyan-500/20 bg-cyan-950/20 dark:bg-cyan-950/25',
      glow: 'shadow-cyan-500/5',
    },
  };

  const config = typeConfig[type];

  return (
    <div className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg transition-all duration-300 animate-fade-in ${config.border} ${config.glow} text-slate-100`}>
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-grow text-sm font-medium leading-relaxed pr-2">{message}</div>
      <button 
        onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
