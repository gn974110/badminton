import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const styles = {
    success: "bg-emerald-50 border-emerald-100 text-emerald-900",
    error: "bg-rose-50 border-rose-100 text-rose-900",
    info: "bg-blue-50 border-blue-100 text-blue-900"
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-full max-w-sm px-4 pointer-events-none">
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto animate-in slide-in-from-top-5 duration-300",
        styles[type]
      )}>
        <div className="shrink-0">
          {icons[type]}
        </div>
        <p className="flex-1 text-sm font-bold tracking-wide">{message}</p>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded-full transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};