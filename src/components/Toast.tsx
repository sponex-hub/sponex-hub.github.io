import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface ToastProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ visible, title, message, onClose }) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#0e121c]/95 backdrop-blur-md border border-[#ff387d]/40 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(255,56,125,0.2)] rounded-lg p-3.5 flex items-start gap-3 max-w-xs animate-bounce-in">
      <div className="p-1 rounded bg-[#ff387d]/20 text-[#ff387d] mt-0.5">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex-1 pr-2">
        <h5 className="font-['Montserrat'] text-xs font-bold text-white mb-0.5">
          {title}
        </h5>
        <p className="text-[11px] text-[#9ba7bd] leading-tight">
          {message}
        </p>
      </div>

      <button
        onClick={onClose}
        className="text-[#5e6b82] hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
