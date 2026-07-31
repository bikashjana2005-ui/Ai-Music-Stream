import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-2.5 px-5 py-3 bg-gray-900/95 dark:bg-white/95 text-white dark:text-gray-900 rounded-full shadow-2xl backdrop-blur-md border border-white/10 dark:border-black/10 text-sm font-medium transition-all animate-bounce-short">
      {type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 dark:text-emerald-600 shrink-0" />}
      {type === 'error' && <AlertCircle size={18} className="text-rose-400 dark:text-rose-600 shrink-0" />}
      {type === 'info' && <Info size={18} className="text-sky-400 dark:text-sky-600 shrink-0" />}
      <span className="truncate max-w-xs sm:max-w-md">{message}</span>
    </div>
  );
};
