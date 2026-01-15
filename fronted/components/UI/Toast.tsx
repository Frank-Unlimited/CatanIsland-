
import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const bgStyles = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded shadow-lg text-white ${bgStyles[type]} min-w-[300px] animate-slide-down`}>
      <span className="shrink-0">{icons[type]}</span>
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button onClick={onClose} className="opacity-80 hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
    </div>
  );
};
