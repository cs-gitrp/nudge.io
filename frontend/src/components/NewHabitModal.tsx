'use client';

import React, { useState } from 'react';
import { useHabits } from '@/context/HabitContext';
import { X, Sparkles } from 'lucide-react';

interface NewHabitModalProps {
  isOpen?: boolean; // Optional, modal is rendered conditionally
  onClose: () => void;
}

export const NewHabitModal: React.FC<NewHabitModalProps> = ({ onClose }) => {
  const { addNewHabit } = useHabits();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addNewHabit(name.trim(), description.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create habit';
      setError(msg);
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
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-light border border-accent-border text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Create New Habit</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="habit-name" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Habit Name *
            </label>
            <input
              id="habit-name"
              type="text"
              placeholder="e.g. Morning Meditation, Read Books"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              disabled={submitting}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="habit-description" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              id="habit-description"
              placeholder="Describe your goal, rules, or schedule..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none"
            />
          </div>

          {error && (
            <div className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
