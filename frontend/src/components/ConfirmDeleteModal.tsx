'use client';

import React, { useState } from 'react';
import { useHabits } from '@/context/HabitContext';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  habitId: string;
  habitName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  habitId,
  habitName,
  isOpen,
  onClose,
}) => {
  const { removeHabit } = useHabits();
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await removeHabit(habitId);
      onClose();
    } catch {
      // Error toast is handled by HabitContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center gap-3 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 border border-rose-100 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900">Delete Habit</h2>
            <p className="text-xs text-zinc-450 mt-0.5 font-medium">This action cannot be undone.</p>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4">
          <p className="text-sm text-zinc-650 leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-zinc-900">&quot;{habitName}&quot;</span>? All history and current streak will be permanently erased.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Deleting...' : 'Delete Habit'}
          </button>
        </div>
      </div>
    </div>
  );
};
