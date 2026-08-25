'use client';

import React from 'react';
import { useHabits } from '@/context/HabitContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useHabits();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full sm:w-auto">
      {toasts.map((toast) => {
        let bgColor = 'bg-white border-zinc-200 border-l-4 border-l-zinc-400';
        let icon = <Info className="h-5 w-5 text-zinc-500" />;
        let textColor = 'text-zinc-800';

        if (toast.type === 'success') {
          bgColor = 'bg-white border-zinc-200 border-l-4 border-l-accent';
          icon = <CheckCircle2 className="h-5 w-5 text-accent" />;
          textColor = 'text-zinc-800';
        } else if (toast.type === 'error') {
          bgColor = 'bg-white border-zinc-200 border-l-4 border-l-rose-500';
          icon = <AlertCircle className="h-5 w-5 text-rose-500" />;
          textColor = 'text-zinc-800';
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start justify-between gap-3 p-4 rounded-xl border-y border-r shadow-lg ${bgColor} animate-in fade-in slide-in-from-bottom-4 duration-300`}
          >
            <div className="flex gap-3">
              <div className="mt-0.5">{icon}</div>
              <div className={`text-sm font-semibold ${textColor}`}>{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-450 hover:text-zinc-700 transition-colors p-0.5 hover:bg-zinc-50 rounded-lg cursor-pointer"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
