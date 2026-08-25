'use client';

import { useEffect } from 'react';
import { useHabits } from '@/context/HabitContext';
import { useRouter } from 'next/navigation';
import { Flame } from 'lucide-react';

export default function Home() {
  const { currentUser, loading } = useHabits();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [currentUser, loading, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-accent-light border border-accent-border text-accent">
          <Flame className="h-6 w-6 fill-accent/10" />
        </div>
        <div className="h-4 w-24 rounded bg-zinc-200 animate-pulse" />
      </div>
    </div>
  );
}
