import React, { useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface ToastProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ visible, title, message, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#121215]/95 backdrop-blur-md border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.85)] rounded-2xl p-4 flex items-center gap-3.5 max-w-sm animate-fade-in select-none">
      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h5 className="font-['Montserrat'] text-xs font-bold text-white tracking-tight truncate">
          {title}
        </h5>
        <p className="text-[11px] text-zinc-400 leading-snug mt-0.5 line-clamp-2">
          {message}
        </p>
      </div>

      <button
        onClick={onClose}
        className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

