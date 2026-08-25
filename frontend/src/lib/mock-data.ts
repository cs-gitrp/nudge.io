import { Habit, User } from '@/types';

// Helper to get YYYY-MM-DD date string relative to today, optionally in a timezone
export const getRelativeDateString = (daysAgo: number, timezone?: string): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  
  if (timezone) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
    } catch (e) {
      console.warn("Invalid timezone, falling back to local time", e);
    }
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const DEFAULT_USER: User = {
  email: 'hello@nudge.io',
  timezone: 'Asia/Kolkata', // Default timezone
};

// Generates initial mock data fixtures
export const generateInitialHabits = (): Habit[] => {
  const habits: Habit[] = [
    {
      id: 'habit-1',
      name: 'Gym Workout',
      description: 'Strength training session at the local gym.',
      createdAt: getRelativeDateString(15),
      currentStreak: 12,
      longestStreak: 12,
      checkIns: Array.from({ length: 12 }, (_, i) => ({
        id: `checkin-1-${i}`,
        habitId: 'habit-1',
        date: getRelativeDateString(i),
        createdAt: new Date(new Date().setDate(new Date().getDate() - i)).toISOString(),
      })),
    },
    {
      id: 'habit-2',
      name: 'Drink 3L Water',
      description: 'Keep hydrated throughout the workday.',
      createdAt: getRelativeDateString(10),
      currentStreak: 5,
      longestStreak: 8,
      checkIns: Array.from({ length: 5 }, (_, i) => ({
        id: `checkin-2-${i}`,
        habitId: 'habit-2',
        date: getRelativeDateString(i + 1), // Starts from yesterday
        createdAt: new Date(new Date().setDate(new Date().getDate() - (i + 1))).toISOString(),
      })),
    },
    {
      id: 'habit-3',
      name: 'Read 10 Pages',
      description: 'Fiction or non-fiction book reading before bed.',
      createdAt: getRelativeDateString(20),
      currentStreak: 0, // Streak broken (last check-in was 3 days ago)
      longestStreak: 8,
      checkIns: Array.from({ length: 8 }, (_, i) => ({
        id: `checkin-3-${i}`,
        habitId: 'habit-3',
        date: getRelativeDateString(i + 3), // 3 days ago to 10 days ago
        createdAt: new Date(new Date().setDate(new Date().getDate() - (i + 3))).toISOString(),
      })),
    },
    {
      id: 'habit-4',
      name: 'Meditate 10m',
      description: 'Mindfulness breathing exercises in the morning.',
      createdAt: getRelativeDateString(0), // Created today
      currentStreak: 0,
      longestStreak: 0,
      checkIns: [],
    },
  ];

  return habits;
};
