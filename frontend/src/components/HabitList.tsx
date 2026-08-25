'use client';

import React, { useState } from 'react';
import { useHabits } from '@/context/HabitContext';
import { HabitCard } from './HabitCard';
import { NewHabitModal } from './NewHabitModal';
import { Plus, Flame } from 'lucide-react';
import { getRelativeDateString } from '@/lib/mock-data';

export const HabitCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 animate-pulse h-48">
      <div className="space-y-3">
        <div className="h-6 bg-zinc-200 rounded-lg w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-zinc-150 rounded-lg w-3/4"></div>
          <div className="h-4 bg-zinc-150 rounded-lg w-1/2"></div>
        </div>
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-zinc-100 mt-6">
        <div className="h-4 bg-zinc-150 rounded-lg w-1/4"></div>
        <div className="h-8 bg-zinc-200 rounded-lg w-20"></div>
      </div>
    </div>
  );
};

export const HabitList: React.FC = () => {
  const { habits, loading, currentUser } = useHabits();
  const [modalOpen, setModalOpen] = useState(false);

  // Compute live summary stats
  const todayStr = getRelativeDateString(0, currentUser?.timezone);
  const doneToday = habits.filter((h) => h.checkIns.some((c) => c.date === todayStr)).length;
  const totalHabits = habits.length;
  const activeStreaks = habits.filter((h) => h.currentStreak > 0).length;

  return (
    <div className="space-y-8">
      {/* Header section with "+ New Habit" */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Your Habits</h1>
          {!loading && habits.length > 0 && (
            <p className="text-zinc-500 mt-1.5 text-sm">
              {doneToday} of {totalHabits} done today &middot; {activeStreaks} active streak{activeStreaks !== 1 ? 's' : ''}
            </p>
          )}
          {(loading || habits.length === 0) && (
            <p className="text-zinc-500 mt-1.5 text-sm">
              Track your daily routines, maintain streaks, and build consistency.
            </p>
          )}
        </div>
        
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark active:scale-95 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habits Grid / Skeleton / Empty state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <HabitCardSkeleton />
          <HabitCardSkeleton />
          <HabitCardSkeleton />
          <HabitCardSkeleton />
        </div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16 px-4 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light border border-accent-border text-accent mb-4">
            <Flame className="h-7 w-7 fill-accent/10" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">No habits tracked yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm mt-2 mb-6">
            Get started by adding a habit you want to build daily. Consistency is key!
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-white border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4 text-accent" />
            <span>Create Your First Habit</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      )}

      {/* New Habit Creation Modal */}
      {modalOpen && <NewHabitModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
    </div>
  );
};
