'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  PlusCircle,
  Package,
  Sliders,
  CreditCard,
  Settings,
  X,
  Zap,
  ShieldCheck,
} from 'lucide-react';

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  usageCount?: number;
  usageLimit?: number;
  userPlan?: string;
}

export default function DashboardSidebar({
  mobileOpen = false,
  setMobileOpen,
  usageCount = 0,
  usageLimit = 300,
  userPlan = 'free',
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin =
    (session?.user as { role?: string })?.role === 'admin' ||
    session?.user?.email === 'niyamulhasan1089@gmail.com';

  const navItems = [
    {
      name: 'Generate New',
      href: '/dashboard/generate',
      icon: PlusCircle,
      badge: 'AI',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      name: 'My Products',
      href: '/dashboard',
      icon: Package,
    },
    {
      name: 'Prompt Settings',
      href: '/dashboard/prompts',
      icon: Sliders,
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
    ...(isAdmin
      ? [
          {
            name: 'Admin Control Panel',
            href: '/dashboard/admin',
            icon: ShieldCheck,
            badge: 'Admin',
            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          },
        ]
      : []),
  ];

  const usagePercent = Math.min(100, Math.round((usageCount / (usageLimit || 1)) * 100));

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 sm:p-6 bg-gray-950/95 border-r border-gray-800/80">
      <div className="space-y-6">
        {/* Brand & Mobile close button */}
        <div className="flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 border border-indigo-500/30 overflow-hidden shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Image src="/icon.png" alt="ProductPen AI" width={36} height={36} className="object-cover" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-lg">ProductPen</span>
              <span className="text-xs ml-1 text-indigo-400 font-semibold uppercase tracking-wider">AI</span>
            </div>
          </Link>
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1.5 pt-2">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === '/dashboard' && (pathname === '/dashboard' || pathname === '/dashboard/products'));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-950/50'
                    : 'text-gray-400 hover:bg-gray-900/80 hover:text-gray-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Usage summary widget at sidebar bottom */}
      <div className="mt-8 rounded-2xl border border-gray-800/80 bg-gradient-to-b from-gray-900/80 to-gray-950 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
              {userPlan} Plan
            </span>
          </div>
          <span className="text-xs font-mono font-medium text-gray-400">
            {usageCount}/{usageLimit}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              usagePercent >= 90
                ? 'bg-rose-500'
                : usagePercent >= 75
                ? 'bg-amber-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-gray-400">Generations used</span>
          <Link
            href="/dashboard/billing"
            className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
          >
            Upgrade &rarr;
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen && setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl transition-transform">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
