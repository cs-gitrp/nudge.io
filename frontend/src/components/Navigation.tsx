'use client';

import React from 'react';
import { useHabits } from '@/context/HabitContext';
import { LogOut, Flame } from 'lucide-react';
import Link from 'next/link';

export const Navigation: React.FC = () => {
  const { currentUser, logout } = useHabits();

  if (!currentUser) return null;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2 text-zinc-900 hover:text-zinc-700 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-light border border-accent-border text-accent">
                <Flame className="h-5 w-5 fill-accent/10" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                nudge<span className="text-accent">.io</span>
              </span>
            </Link>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-zinc-700">{currentUser.email}</span>
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">{currentUser.timezone}</span>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition-all duration-200 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
