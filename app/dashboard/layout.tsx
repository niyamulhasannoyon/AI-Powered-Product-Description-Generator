'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Menu, Sparkles, User as UserIcon, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [usageStats, setUsageStats] = useState({
    usedThisMonth: 0,
    planLimit: 300,
    planName: 'free',
  });

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          setUsageStats({
            usedThisMonth: data.usedThisMonth || 0,
            planLimit: data.planLimit || 300,
            planName: data.planName || 'free',
          });
        }
      } catch (e) {
        console.error('Failed to fetch usage stats', e);
      }
    }
    if (session?.user) {
      fetchUsage();
    }
  }, [session]);

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Creator';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <DashboardSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        usageCount={usageStats.usedThisMonth}
        usageLimit={usageStats.planLimit}
        userPlan={usageStats.planName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800/80 bg-gray-950/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Trigger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-xl border border-gray-800 bg-gray-900 p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </button>

            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-gray-400">
              ProductPen AI Studio
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/generate"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-indigo-400 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Generation</span>
            </Link>

            <div className="h-4 w-px bg-gray-800" />

            {/* User Profile Badge */}
            <div className="flex items-center gap-2.5 rounded-xl border border-gray-800 bg-gray-900/80 px-3 py-1.5 text-xs">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold uppercase text-[10px]">
                {userName.charAt(0)}
              </div>
              <span className="font-medium text-gray-200 truncate max-w-[120px]">
                {userName}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
