'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Sparkles, ArrowUpRight } from 'lucide-react';
import { useRealtimeSync } from '@/lib/useRealtimeSync';

interface UsageMeterProps {
  usedCount: number;
  planLimit: number;
  planName?: string;
  periodEnd?: string;
}

export default function UsageMeter({
  usedCount: initialUsedCount = 0,
  planLimit: initialPlanLimit = 300,
  planName: initialPlanName = 'pro',
  periodEnd: initialPeriodEnd,
}: UsageMeterProps) {
  const [usedCount, setUsedCount] = useState<number>(initialUsedCount);
  const [planLimit, setPlanLimit] = useState<number>(initialPlanLimit);
  const [planName, setPlanName] = useState<string>(initialPlanName);
  const [periodEnd, setPeriodEnd] = useState<string | undefined>(initialPeriodEnd);

  // Sync state if props update from Server Component revalidation
  useEffect(() => {
    setUsedCount(initialUsedCount);
    setPlanLimit(initialPlanLimit);
    setPlanName(initialPlanName);
    setPeriodEnd(initialPeriodEnd);
  }, [initialUsedCount, initialPlanLimit, initialPlanName, initialPeriodEnd]);

  // Fetch live usage stats from API
  const fetchLiveUsage = async () => {
    try {
      const res = await fetch('/api/usage');
      if (res.ok) {
        const data = await res.json();
        if (typeof data.usedThisMonth === 'number') {
          setUsedCount(data.usedThisMonth);
        }
        if (typeof data.planLimit === 'number') {
          setPlanLimit(data.planLimit);
        }
        if (data.planName) {
          setPlanName(data.planName);
        }
        if (data.periodEnd) {
          setPeriodEnd(data.periodEnd);
        }
      }
    } catch (e) {
      console.error('Failed to sync live usage meter:', e);
    }
  };

  // Real-time listener for generation and payment events
  useRealtimeSync({
    events: ['USAGE_MUTATED', 'PRODUCT_MUTATED', 'PAYMENT_MUTATED'],
    onEvent: () => {
      fetchLiveUsage();
    },
  });

  const percentage = Math.min(100, Math.round((usedCount / (planLimit || 1)) * 100));
  const remaining = Math.max(0, planLimit - usedCount);

  const formattedPeriodEnd = periodEnd
    ? new Date(periodEnd).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 p-6 shadow-xl backdrop-blur-md">
      {/* Subtle top border accent glow */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-80" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Main Meter Info */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Monthly Generation Usage
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {planName} tier
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {usedCount} <span className="text-gray-500 text-2xl font-normal">/ {planLimit}</span>
            </span>
            <span className="text-sm text-gray-400 font-medium">
              generations used this month
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="space-y-1.5 max-w-xl">
            <div className="h-2.5 w-full rounded-full bg-gray-800/90 p-0.5 overflow-hidden border border-gray-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  percentage >= 90
                    ? 'bg-gradient-to-r from-rose-600 to-rose-500 shadow-sm shadow-rose-500/50'
                    : percentage >= 75
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 shadow-sm shadow-indigo-500/30'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{remaining} generations remaining</span>
              {formattedPeriodEnd && (
                <span>Resets on {formattedPeriodEnd}</span>
              )}
            </div>
          </div>
        </div>

        {/* Upgrade / Billing CTA */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-gray-800/80 pt-4 md:pt-0 md:pl-6 gap-4">
          <div className="text-left md:text-right">
            <p className="text-xs text-gray-400">Need higher limits?</p>
            <p className="text-xs font-semibold text-gray-200">Scale your e-commerce catalog</p>
          </div>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-indigo-400 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Upgrade Plan
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
