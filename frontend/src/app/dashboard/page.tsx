'use client';

import React from 'react';
import { useHabits } from '@/context/HabitContext';
import { HabitList } from '@/components/HabitList';

export default function DashboardPage() {
  const { currentUser, loading } = useHabits();

  if (loading && !currentUser) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8 animate-pulse">
          <div className="space-y-2">
            <div className="h-8 bg-zinc-900 rounded-lg w-1/4"></div>
            <div className="h-4 bg-zinc-900/60 rounded-lg w-1/3"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-48 bg-zinc-900/30 rounded-2xl border border-zinc-850"></div>
            <div className="h-48 bg-zinc-900/30 rounded-2xl border border-zinc-850"></div>
            <div className="h-48 bg-zinc-900/30 rounded-2xl border border-zinc-850"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <HabitList />
    </div>
  );
}
