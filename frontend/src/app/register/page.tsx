'use client';

import React, { useState, useEffect } from 'react';
import { useHabits } from '@/context/HabitContext';
import { TimezoneSelect } from '@/components/TimezoneSelect';
import { Flame, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { register, currentUser } = useHabits();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState(() => {
    try {
      if (typeof Intl !== 'undefined') {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
    } catch {
      // Fallback
    }
    return 'Asia/Kolkata';
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!email.trim() || !password.trim() || !timezone) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      await register(email.trim(), password, timezone);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Brand/Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-light border border-accent-border text-accent mb-4">
            <Flame className="h-6 w-6 fill-accent/10" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Create an account</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Start building positive habits and tracking streaks today.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                disabled={submitting}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                disabled={submitting}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                IANA Timezone
              </label>
              <TimezoneSelect value={timezone} onChange={setTimezone} />
            </div>

            {error && (
              <div className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-dark active:scale-98 transition-all shadow-sm cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{submitting ? 'Creating account...' : 'Create Account'}</span>
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-accent hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
