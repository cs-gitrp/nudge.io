export interface User {
  id: string;
  email: string;
  timezone: string;
}

export interface CheckIn {
  id: string;
  habitId: string;
  date: string; // Local day, format: YYYY-MM-DD (this is what the UI should render/compare)
  createdAt: string; // ISO Timestamp (the UTC instant the check-in was recorded)
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // Format: YYYY-MM-DD (habit's creation local day)
  currentStreak: number;
  longestStreak: number;
  checkIns: CheckIn[];
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
