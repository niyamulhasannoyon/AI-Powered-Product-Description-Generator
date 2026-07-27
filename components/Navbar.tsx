'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Sparkles,
  LayoutDashboard,
  Tag,
  LogIn,
  LogOut,
  UserPlus,
  Menu,
  X,
  User,
  FileText,
  ShieldCheck,
  ChevronDown,
  Settings,
  PlusCircle,
  CreditCard,
  Crown,
} from 'lucide-react';

const ADMIN_EMAILS = ['niyamulhasan1089@gmail.com', 'niyamulhasanbd@gmail.com'];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();
  const pathname = usePathname();

  const userEmail = session?.user?.email?.toLowerCase();
  const userRole = (session?.user as { role?: string })?.role || (userEmail && ADMIN_EMAILS.includes(userEmail) ? 'admin' : 'user');
  const userPlan = ((session?.user as { plan?: string })?.plan || 'free').toLowerCase();
  const isAdmin = userRole === 'admin';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  const getPlanBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
          <ShieldCheck className="h-3 w-3" /> Admin
        </span>
      );
    }
    if (userPlan === 'business') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">
          <Crown className="h-3 w-3 text-purple-400" /> Business
        </span>
      );
    }
    if (userPlan === 'pro') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">
          <Sparkles className="h-3 w-3 text-indigo-400" /> Pro
        </span>
      );
    }
    return (
      <span className="rounded-full bg-gray-800 border border-gray-700 px-2 py-0.5 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
        Free
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 border border-cyan-500/30 overflow-hidden shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Image src="/icon.png" alt="ProductPen AI Icon" width={36} height={36} className="object-cover" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
            ProductPen <span className="text-cyan-400">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-gray-400" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/prompts"
            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <FileText className="h-4 w-4 text-gray-400" />
            Prompt Settings
          </Link>
          <Link
            href="/pricing"
            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <Tag className="h-4 w-4 text-gray-400" />
            Pricing
          </Link>
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className="flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-all shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Action Buttons & Profile Dropdown */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <div className="relative" ref={dropdownRef}>
              {/* Profile Trigger Badge */}
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 rounded-full border border-gray-800 bg-gray-900/90 py-1 pl-1 pr-3 text-sm font-medium text-gray-200 hover:bg-gray-800/90 hover:border-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                {session.user?.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={session.user.image}
                    alt={session.user?.name || 'User Profile'}
                    className="h-7 w-7 rounded-full object-cover border border-cyan-500/40"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30 text-xs">
                    {session.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
                  </div>
                )}
                <span className="max-w-[120px] truncate text-xs font-bold text-white">
                  {session.user?.name || session.user?.email}
                </span>
                {getPlanBadge()}
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-800 bg-gray-900/95 p-3 shadow-2xl backdrop-blur-xl z-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Header info */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-950 border border-gray-800/80">
                    {session.user?.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={session.user.image}
                        alt={session.user?.name || 'User Profile'}
                        className="h-10 w-10 rounded-full object-cover border border-indigo-500/40 shrink-0"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 text-sm shrink-0">
                        {session.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{session.user?.name || 'User Account'}</p>
                      <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        {getPlanBadge()}
                        {isAdmin && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Super Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Actions */}
                  <div className="space-y-1 text-xs font-semibold text-gray-300">
                    {isAdmin && (
                      <Link
                        href="/dashboard/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl p-2.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                      >
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>Admin Control Panel</span>
                      </Link>
                    )}

                    <Link
                      href="/dashboard/generate"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl p-2.5 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <PlusCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>Generate AI Copy</span>
                    </Link>

                    <Link
                      href="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl p-2.5 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-gray-400 shrink-0" />
                      <span>My Generated Products</span>
                    </Link>

                    <Link
                      href="/dashboard/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl p-2.5 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <Settings className="h-4 w-4 text-gray-400 shrink-0" />
                      <span>Account Profile Settings</span>
                    </Link>

                    <Link
                      href="/pricing"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl p-2.5 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <CreditCard className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Subscription Tiers & Pricing</span>
                    </Link>
                  </div>

                  {/* Sign Out */}
                  <div className="pt-2 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-950 p-2.5 text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:border-rose-900 transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800 hover:text-white transition-all"
              >
                <LogIn className="h-4 w-4" />
                Log In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
              >
                <UserPlus className="h-4 w-4" />
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-800 bg-gray-950 px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-gray-200 hover:bg-gray-800 hover:text-white"
          >
            <LayoutDashboard className="h-5 w-5 text-gray-400" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/prompts"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-gray-200 hover:bg-gray-800 hover:text-white"
          >
            <FileText className="h-5 w-5 text-gray-400" />
            Prompt Settings
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-gray-200 hover:bg-gray-800 hover:text-white"
          >
            <Tag className="h-5 w-5 text-gray-400" />
            Pricing
          </Link>
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
            >
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Admin Control Panel
            </Link>
          )}

          <div className="pt-2 border-t border-gray-800 space-y-2">
            {session ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800">
                  {session.user?.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={session.user.image}
                      alt={session.user?.name || 'User Profile'}
                      className="h-10 w-10 rounded-full object-cover border border-indigo-500/40"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30 text-sm">
                      {session.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{session.user?.name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                  </div>
                  {getPlanBadge()}
                </div>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:bg-gray-800"
                >
                  <Settings className="h-4 w-4" />
                  Account Settings
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-950/40"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2.5 text-base font-semibold text-gray-200 hover:bg-gray-800"
                >
                  <LogIn className="h-5 w-5" />
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-indigo-500"
                >
                  <UserPlus className="h-5 w-5" />
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
