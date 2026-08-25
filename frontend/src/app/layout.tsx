import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HabitProvider } from "@/context/HabitContext";
import { Navigation } from "@/components/Navigation";
import { ToastContainer } from "@/components/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nudge.io — Habit Tracker",
  description: "Track your habits, maintain streaks, and build consistency.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground flex flex-col">
        <HabitProvider>
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
          <ToastContainer />
        </HabitProvider>
      </body>
    </html>
  );
}
