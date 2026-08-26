'use client';

import React, { useState } from 'react';
import { Habit } from '@/types';
import { useHabits } from '@/context/HabitContext';
import { Flame, Check, ChevronRight, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getRelativeLocalDateString } from '@/lib/local-date';

interface HabitCardProps {
  habit: Habit;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit }) => {
  const { triggerCheckIn, currentUser } = useHabits();
  const router = useRouter();
  const [checkingIn, setCheckingIn] = useState(false);

  const todayStr = getRelativeLocalDateString(0, currentUser?.timezone);
  const isCheckedInToday = habit.checkIns.some((c) => c.date === todayStr);

  const handleCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click redirect
    if (isCheckedInToday || checkingIn) return;
    
    setCheckingIn(true);
    try {
      await triggerCheckIn(habit.id);
    } catch {
      // Toast already handled by context
    } finally {
      setCheckingIn(false);
    }
  };

  const getLastCheckInText = (): string => {
    if (habit.checkIns.length === 0) return 'No check-ins yet';

    const checkInDates = habit.checkIns.map((c) => new Date(c.date + 'T00:00:00').getTime());
    const newestTime = Math.max(...checkInDates);
    const newestDateStr = new Date(newestTime).toISOString().split('T')[0];

    const todayDate = new Date(todayStr + 'T00:00:00');
    const newestDate = new Date(newestDateStr + 'T00:00:00');
    
    const diffTime = todayDate.getTime() - newestDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Checked in today';
    if (diffDays === 1) return 'Checked in yesterday';
    return `Checked in ${diffDays} days ago`;
  };

  return (
    <div
      onClick={() => router.push(`/habit/${habit.id}`)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-300 hover:scale-[1.01] hover:border-zinc-300 cursor-pointer shadow-sm hover:shadow-md"
    >
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h3 className="font-bold text-lg text-zinc-900 transition-colors">
              {habit.name}
            </h3>
            {habit.description && (
              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                {habit.description}
              </p>
            )}
          </div>
          
          <ChevronRight className="h-4 w-4 text-zinc-450 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all mt-1" />
        </div>

        {/* Streaks Badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          {/* Current Streak */}
          <div
            className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold border ${
              habit.currentStreak > 0
                ? 'bg-gradient-to-r from-orange-500/10 to-orange-500/0 text-orange-600 border-orange-200/50'
                : 'bg-zinc-50 text-zinc-400 border-zinc-200/50'
            }`}
          >
            <Flame className={`h-3.5 w-3.5 ${habit.currentStreak > 0 ? 'fill-orange-500/10 text-orange-500' : ''}`} />
            <span>{habit.currentStreak} day{habit.currentStreak !== 1 ? 's' : ''}</span>
          </div>

          {/* Longest Streak */}
          {habit.longestStreak > 0 && (
            <div className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold text-zinc-500 bg-zinc-50 border border-zinc-200/50">
              <Award className="h-3.5 w-3.5 text-accent" />
              <span>Best: {habit.longestStreak} day{habit.longestStreak !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-8 flex items-center justify-between gap-4 pt-4 border-t border-zinc-100">
        <span className="text-xs font-medium text-zinc-400">{getLastCheckInText()}</span>

        <button
          onClick={handleCheckIn}
          disabled={isCheckedInToday || checkingIn}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
            isCheckedInToday
              ? 'bg-zinc-50 text-zinc-400 border border-zinc-200/60 cursor-default'
              : 'bg-accent text-white hover:bg-accent-dark active:scale-97 shadow-sm disabled:opacity-50'
          }`}
        >
          {isCheckedInToday ? (
            <>
              <Check className="h-3.5 w-3.5 stroke-[2.5px]" />
              <span>Completed</span>
            </>
          ) : checkingIn ? (
            <span>Checking In...</span>
          ) : (
            <span>Check In</span>
          )}
        </button>
      </div>
    </div>
  );
};
