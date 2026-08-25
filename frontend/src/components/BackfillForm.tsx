'use client';

import React, { useState } from 'react';
import { Habit } from '@/types';
import { useHabits } from '@/context/HabitContext';
import { getRelativeDateString } from '@/lib/mock-data';
import { Calendar, AlertCircle, Check } from 'lucide-react';

interface BackfillFormProps {
  habit: Habit;
}

export const BackfillForm: React.FC<BackfillFormProps> = ({ habit }) => {
  const { backfillCheckInDate, currentUser } = useHabits();
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const todayStr = getRelativeDateString(0, currentUser?.timezone);
  const minDate = habit.createdAt;
  const maxDate = todayStr;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!date) {
      setError('Please select a date');
      return;
    }

    const checkDate = new Date(date + 'T00:00:00');
    const creationDate = new Date(habit.createdAt + 'T00:00:00');
    const todayDate = new Date(todayStr + 'T00:00:00');

    // Future date validation
    if (checkDate > todayDate) {
      setError('Cannot select a future date');
      return;
    }

    // Pre-creation date validation
    if (checkDate < creationDate) {
      setError(`Cannot select a date before habit creation (${habit.createdAt})`);
      return;
    }

    // Already checked in validation
    const alreadyChecked = habit.checkIns.some((c) => c.date === date);
    if (alreadyChecked) {
      setError('This day already has a check-in');
      return;
    }

    setLoading(true);
    try {
      await backfillCheckInDate(habit.id, date);
      setSuccess(`Checked in for ${date}!`);
      setDate('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to backfill check-in';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-zinc-900">Backfill Check-In</h3>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">
            Log a check-in for a past day to maintain your streak.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
          <div className="relative w-full">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError('');
                setSuccess('');
              }}
              disabled={loading}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 pl-10 text-sm text-zinc-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all [&::-webkit-calendar-picker-indicator]:opacity-70 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent hover:bg-accent-dark px-5 py-2.5 text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting...' : 'Log Past Check-In'}
          </button>
        </form>

        {/* Validation Feedback Messages */}
        {error && (
          <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 animate-in fade-in slide-in-from-top-1">
            <Check className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}
      </div>
    </div>
  );
};
