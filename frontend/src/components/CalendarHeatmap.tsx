'use client';

import React, { useState } from 'react';
import { CheckIn } from '@/types';
import { useHabits } from '@/context/HabitContext';
import { getRelativeDateString } from '@/lib/mock-data';
import { ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react';

interface CalendarHeatmapProps {
  checkIns: CheckIn[];
  createdAt: string; // YYYY-MM-DD
}

type ViewMode = 'calendar' | 'list';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ checkIns, createdAt }) => {
  const { currentUser } = useHabits();
  const checkInDates = new Set(checkIns.map((c) => c.date));

  // Today's local date string (YYYY-MM-DD) in user's timezone
  const todayStr = getRelativeDateString(0, currentUser?.timezone);
  const todayDate = new Date(todayStr + 'T00:00:00');

  // Local view state — presentation only
  const [view, setView] = useState<ViewMode>('calendar');
  const [displayYear, setDisplayYear] = useState(todayDate.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(todayDate.getMonth()); // 0-indexed

  // ── Month navigation ──────────────────────────────────────────────────────
  const goPrev = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear((y) => y - 1);
    } else {
      setDisplayMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    // Don't go past current month
    const nextMonth = displayMonth === 11 ? 0 : displayMonth + 1;
    const nextYear = displayMonth === 11 ? displayYear + 1 : displayYear;
    if (nextYear > todayDate.getFullYear() || (nextYear === todayDate.getFullYear() && nextMonth > todayDate.getMonth())) return;
    setDisplayMonth(nextMonth);
    setDisplayYear(nextYear);
  };

  const isNextDisabled =
    displayYear > todayDate.getFullYear() ||
    (displayYear === todayDate.getFullYear() && displayMonth >= todayDate.getMonth());

  // ── Build the 6-row × 7-col calendar grid ────────────────────────────────
  const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

  // Total cells: pad to multiple of 7
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  const cells: Array<{ day: number | null; dateStr: string | null }> = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDayOfMonth + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({ day: null, dateStr: null });
    } else {
      const mm = String(displayMonth + 1).padStart(2, '0');
      const dd = String(dayNum).padStart(2, '0');
      cells.push({ day: dayNum, dateStr: `${displayYear}-${mm}-${dd}` });
    }
  }

  // ── List view — sorted newest first ──────────────────────────────────────
  const sortedCheckIns = [...checkIns].sort(
    (a, b) => new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime()
  );

  const formatFullDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('default', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const getRelativeText = (dateStr: string) => {
    const diff = Math.round(
      (todayDate.getTime() - new Date(dateStr + 'T00:00:00').getTime()) / 86400000
    );
    if (diff === 0) return 'today';
    if (diff === 1) return 'yesterday';
    return `${diff} days ago`;
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* ── Card Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100">
        <h3 className="font-bold text-zinc-900 text-base">Check-in history</h3>

        {/* Calendar / List toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              view === 'calendar'
                ? 'bg-accent text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              view === 'list'
                ? 'bg-accent text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* ── Calendar View ───────────────────────────────────────────────── */}
      {view === 'calendar' && (
        <div className="px-5 pb-6 pt-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goPrev}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-all cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm font-bold text-zinc-800 tracking-tight">
              {MONTH_NAMES[displayMonth]} {displayYear}
            </span>

            <button
              onClick={goNext}
              disabled={isNextDisabled}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-1"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((cell, i) => {
              if (cell.day === null) {
                // Empty padding cell — invisible, keeps grid alignment
                return <div key={`empty-${i}`} className="aspect-square" />;
              }

              const isCheckedIn = cell.dateStr ? checkInDates.has(cell.dateStr) : false;
              const isToday = cell.dateStr === todayStr;

              let cellClass = '';
              let numberClass = '';

              if (isCheckedIn) {
                cellClass = 'bg-accent hover:bg-accent-dark shadow-sm';
                numberClass = 'text-white font-bold';
              } else if (isToday) {
                // Today but not checked in: ring outline
                cellClass = 'bg-white border-2 border-accent';
                numberClass = 'text-accent font-semibold';
              } else {
                cellClass = 'bg-zinc-50 border border-zinc-200 hover:bg-zinc-100';
                numberClass = 'text-zinc-400';
              }

              return (
                <div
                  key={cell.dateStr}
                  title={cell.dateStr ?? undefined}
                  className={`aspect-square rounded-lg flex items-center justify-center transition-colors duration-100 cursor-default select-none ${cellClass}`}
                >
                  <span className={`text-xs leading-none ${numberClass}`}>
                    {cell.day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Compact legend */}
          <div className="flex items-center gap-3 mt-4 justify-end">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-zinc-100 border border-zinc-200" />
              <span className="text-[10px] text-zinc-400 font-medium">No check-in</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-accent" />
              <span className="text-[10px] text-zinc-400 font-medium">Checked in</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-white border-2 border-accent" />
              <span className="text-[10px] text-zinc-400 font-medium">Today</span>
            </div>
          </div>
        </div>
      )}

      {/* ── List View ───────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="px-6 pb-6 pt-4">
          {sortedCheckIns.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
              <Calendar className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-medium">No check-ins logged yet.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-zinc-100 ml-3 pl-6 space-y-5">
              {sortedCheckIns.map((checkIn) => (
                <div key={checkIn.id} className="relative">
                  {/* Dot marker */}
                  <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border border-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-zinc-800 leading-snug">
                      {formatFullDate(checkIn.date)}
                    </div>
                    <div className="text-xs text-zinc-400 font-medium">
                      Completed {getRelativeText(checkIn.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
