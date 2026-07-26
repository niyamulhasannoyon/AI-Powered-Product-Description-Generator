'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Sparkles, LayoutDashboard, Tag, LogIn, LogOut, UserPlus, Menu, X, User, FileText } from 'lucide-react';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

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
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-brand-500 font-semibold border border-gray-700">
                  {session.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </div>
                <span className="max-w-[120px] truncate">{session.user?.name || session.user?.email}</span>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
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
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 transition-all"
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
          <div className="pt-2 border-t border-gray-800 space-y-2">
            {session ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2.5 text-base font-semibold text-gray-200 hover:bg-gray-800"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
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
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-base font-semibold text-white hover:bg-brand-600"
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
