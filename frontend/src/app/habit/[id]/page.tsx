'use client';

import React, { use, useState, useEffect } from 'react';
import { useHabits } from '@/context/HabitContext';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';
import { BackfillForm } from '@/components/BackfillForm';
import { EditHabitModal } from '@/components/EditHabitModal';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { Flame, ArrowLeft, Trash2, Edit2, Award } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function HabitDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { habits, loading, currentUser } = useHabits();
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const habit = habits.find((h) => h.id === id);

  // Redirect to dashboard if habit is not found (and loading has finished)
  useEffect(() => {
    if (!loading && currentUser && !habit) {
      router.push('/dashboard');
    }
  }, [habit, loading, currentUser, router]);

  if (loading || !habit) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-8">
          <div className="h-6 bg-zinc-900 rounded w-20"></div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="h-28 bg-zinc-900/30 rounded-2xl border border-zinc-850"></div>
              <div className="h-44 bg-zinc-900/30 rounded-2xl border border-zinc-850"></div>
            </div>
            <div className="w-full md:w-80 space-y-6">
              <div className="h-44 bg-zinc-900/30 rounded-2xl border border-zinc-850"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to habits</span>
      </Link>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Main detail area (2/3 width) */}
        <div className="flex-1 w-full space-y-6">
          {/* Header summary */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">{habit.name}</h1>
                {habit.description && (
                  <p className="text-zinc-650 text-sm leading-relaxed max-w-2xl">{habit.description}</p>
                )}
                <div className="text-xs text-zinc-400 font-medium pt-1">
                  Tracking since:{' '}
                  {new Date(habit.createdAt + 'T00:00:00').toLocaleDateString('default', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>

              {/* Edit/Delete Actions */}
              <div className="flex items-center gap-2 self-start">
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition-all cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/10 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-350 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>

          {/* Check-in history — Calendar + List toggle */}
          <CalendarHeatmap checkIns={habit.checkIns} createdAt={habit.createdAt} />
        </div>

        {/* Sidebar panels (1/3 width) */}
        <div className="w-full lg:w-80 space-y-5 shrink-0">
          {/* Streaks Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-zinc-900 mb-4 text-sm">Streak Statistics</h3>

            {/* Current Streak — standalone card */}
            <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-4 mb-3">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block mb-1.5">
                Current Streak
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-orange-600">{habit.currentStreak}</span>
                <span className="text-sm font-semibold text-orange-500">days</span>
              </div>
              <div className="text-[10px] text-orange-400 flex items-center gap-1 font-medium mt-1.5">
                <Flame className="h-3 w-3" />
                <span>Keep it going!</span>
              </div>
            </div>

            {/* Longest Streak — standalone card */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Best Streak
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-zinc-700">{habit.longestStreak}</span>
                <span className="text-sm font-semibold text-zinc-400">days</span>
              </div>
              <div className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium mt-1.5">
                <Award className="h-3 w-3 text-accent" />
                <span>All-time high</span>
              </div>
            </div>
          </div>

          {/* Backfill console */}
          <BackfillForm habit={habit} />
        </div>
      </div>

      {/* Edit and Delete Modals */}
      {editOpen && (
        <EditHabitModal
          habit={habit}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
      {deleteOpen && (
        <ConfirmDeleteModal
          habitId={habit.id}
          habitName={habit.name}
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
