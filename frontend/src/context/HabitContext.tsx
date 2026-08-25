'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Habit, User, Toast, ToastType } from '@/types';
import * as habitService from '@/lib/habit-service';
import { useRouter, usePathname } from 'next/navigation';

interface HabitContextType {
  habits: Habit[];
  loading: boolean;
  currentUser: User | null;
  toasts: Toast[];
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, timezone: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshHabits: () => Promise<void>;
  addNewHabit: (name: string, description?: string) => Promise<void>;
  triggerCheckIn: (habitId: string) => Promise<void>;
  backfillCheckInDate: (habitId: string, dateStr: string) => Promise<void>;
  removeHabit: (habitId: string) => Promise<void>;
  modifyHabit: (habitId: string, name: string, description?: string) => Promise<void>;
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

const generateToastId = (): string => `toast-${Date.now()}-${Math.random()}`;

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType) => {
      const id = generateToastId();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  // On mount: ask the server who's logged in (via the httpOnly session cookie).
  // This replaces the old localStorage-based fake auth entirely.
  useEffect(() => {
    const initialize = async () => {
      try {
        const { user } = await habitService.fetchCurrentUser();
        setCurrentUser(user);
        const data = await habitService.getHabits();
        setHabits(data);
      } catch {
        // Not authenticated — that's expected on first visit / after logout.
        if (pathname !== '/login' && pathname !== '/register') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user } = await habitService.loginUser(email, password);
      setCurrentUser(user);
      const data = await habitService.getHabits();
      setHabits(data);
      addToast('Successfully signed in', 'success');
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      addToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, timezone: string) => {
    setLoading(true);
    try {
      const { user } = await habitService.registerUser(email, password, timezone);
      setCurrentUser(user);
      const data = await habitService.getHabits();
      setHabits(data);
      addToast('Registration successful', 'success');
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      addToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await habitService.logoutUser();
    } finally {
      setCurrentUser(null);
      setHabits([]);
      addToast('Logged out successfully', 'info');
      router.push('/login');
    }
  };

  const refreshHabits = async () => {
    setLoading(true);
    try {
      const data = await habitService.getHabits();
      setHabits(data);
    } catch (err) {
      console.error(err);
      addToast('Error refreshing habits', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addNewHabit = async (name: string, description?: string) => {
    try {
      const newHabit = await habitService.createHabit(name, description);
      setHabits((prev) => [...prev, newHabit]);
      addToast(`Habit "${name}" created!`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create habit';
      addToast(msg, 'error');
      throw err;
    }
  };

  const triggerCheckIn = async (habitId: string) => {
    try {
      const updated = await habitService.checkInHabit(habitId);
      setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));
      addToast(`Checked in today! 🔥 Streak: ${updated.currentStreak}`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to check in';
      addToast(msg, 'error');
      throw err;
    }
  };

  const backfillCheckInDate = async (habitId: string, dateStr: string) => {
    try {
      const updated = await habitService.backfillCheckIn(habitId, dateStr);
      setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));
      addToast(`Backfilled check-in for ${dateStr}!`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to backfill check-in';
      addToast(msg, 'error');
      throw err;
    }
  };

  const removeHabit = async (habitId: string) => {
    try {
      await habitService.deleteHabit(habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      addToast('Habit deleted', 'success');
      router.push('/dashboard');
    } catch {
      addToast('Failed to delete habit', 'error');
      throw new Error('Failed to delete habit');
    }
  };

  const modifyHabit = async (habitId: string, name: string, description?: string) => {
    try {
      const updated = await habitService.updateHabit(habitId, name, description);
      setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));
      addToast('Habit updated successfully', 'success');
    } catch {
      addToast('Failed to update habit', 'error');
      throw new Error('Failed to update habit');
    }
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        loading,
        currentUser,
        toasts,
        login,
        register,
        logout,
        refreshHabits,
        addNewHabit,
        triggerCheckIn,
        backfillCheckInDate,
        removeHabit,
        modifyHabit,
        addToast,
        removeToast,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
