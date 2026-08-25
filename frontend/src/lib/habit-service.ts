import { Habit, User } from '@/types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'include', // send the httpOnly session cookie
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore — use default message
    }
    throw new Error(message);
  }

  return res.json();
}

// ---- Auth ----

export const registerUser = (email: string, password: string, timezone: string): Promise<{ user: User }> =>
  request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, timezone }) });

export const loginUser = (email: string, password: string): Promise<{ user: User }> =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const logoutUser = (): Promise<{ ok: true }> => request('/api/auth/logout', { method: 'POST' });

export const fetchCurrentUser = (): Promise<{ user: User }> => request('/api/auth/me');

// ---- Habits ----
// Note: currentStreak/longestStreak always come straight from the API response.
// This file never computes a streak — the server is the single source of truth.

export const getHabits = (): Promise<Habit[]> => request('/api/habits');

export const getHabitById = (id: string): Promise<Habit> => request(`/api/habits/${id}`);

export const createHabit = (name: string, description?: string): Promise<Habit> =>
  request('/api/habits', { method: 'POST', body: JSON.stringify({ name, description }) });

export const updateHabit = (habitId: string, name: string, description?: string): Promise<Habit> =>
  request(`/api/habits/${habitId}`, { method: 'PATCH', body: JSON.stringify({ name, description }) });

export const deleteHabit = (habitId: string): Promise<{ ok: true }> =>
  request(`/api/habits/${habitId}`, { method: 'DELETE' });

export const checkInHabit = (habitId: string): Promise<Habit> =>
  request(`/api/habits/${habitId}/checkins`, { method: 'POST', body: JSON.stringify({}) });

export const backfillCheckIn = (habitId: string, dateStr: string): Promise<Habit> =>
  request(`/api/habits/${habitId}/checkins`, { method: 'POST', body: JSON.stringify({ date: dateStr }) });
