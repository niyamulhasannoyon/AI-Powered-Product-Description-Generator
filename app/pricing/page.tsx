'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  Loader2,
  Sparkles,
  Zap,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  X,
  DollarSign,
  Clock,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import BinancePaymentModal from '@/components/BinancePaymentModal';
import { useRealtimeSync } from '@/lib/useRealtimeSync';

interface PendingRequest {
  id: string;
  plan: string;
  amount: number;
  status: string;
  createdAt: string;
}

function PricingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [pendingPayment, setPendingPayment] = useState<PendingRequest | null>(null);

  // Billing Cycle Toggle
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Binance Modal state
  const [binanceModalOpen, setBinanceModalOpen] = useState(false);
  const [selectedBinancePlan, setSelectedBinancePlan] = useState<'pro' | 'business'>('pro');
  const [selectedBinanceAmount, setSelectedBinanceAmount] = useState<number>(19);
  const [proPrice, setProPrice] = useState<number>(19);
  const [businessPrice, setBusinessPrice] = useState<number>(49);

  // Load Admin Pricing Settings
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.proPriceUsd) setProPrice(data.settings.proPriceUsd);
          if (data.settings.businessPriceUsd) setBusinessPrice(data.settings.businessPriceUsd);
        }
      })
      .catch((err) => console.error('Failed to fetch pricing settings:', err));
  }, []);

  // Fetch Pending Binance Payments
  const fetchUserPayments = async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        const pending = (data.requests || []).find((r: PendingRequest) => r.status === 'PENDING');
        setPendingPayment(pending || null);
      }
    } catch (err) {
      console.error('Failed to fetch user payment requests:', err);
    }
  };

  useEffect(() => {
    if (session?.user) {
      const fetchPayments = async () => {
        try {
          const res = await fetch('/api/payments');
          if (res.ok) {
            const data = await res.json();
            const pending = (data.requests || []).find((r: PendingRequest) => r.status === 'PENDING');
            setPendingPayment(pending || null);
          }
        } catch (err) {
          console.error('Failed to fetch user payment requests:', err);
        }
      };
      fetchPayments();
    }
  }, [session]);

  // Listen to realtime payment updates
  useRealtimeSync({
    events: ['PAYMENT_MUTATED', 'USAGE_MUTATED'],
    onEvent: () => {
      fetchUserPayments();
    },
  });

  useEffect(() => {
    if (searchParams.get('checkout_success')) {
      setSuccessMsg('Subscription successfully updated! Thank you for upgrading.');
    } else if (searchParams.get('checkout_canceled')) {
      setErrorMsg('Checkout was canceled. No charges were made.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (session?.user) {
      const planFromSession = (session.user as { plan?: string })?.plan || 'free';
      setUserPlan(planFromSession.toLowerCase());
    }
  }, [session]);

  // Pricing calculations
  const displayProPrice = billingCycle === 'yearly' ? Math.round(proPrice * 0.8) : proPrice;
  const displayBusinessPrice = billingCycle === 'yearly' ? Math.round(businessPrice * 0.8) : businessPrice;

  const handleSubscribe = async (plan: 'pro' | 'business') => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent('/pricing')}`);
      return;
    }

    setLoadingPlan(plan);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billingCycle }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate checkout.');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from Stripe.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (status === 'unauthenticated') return;
    setPortalLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/stripe/portal');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to open billing portal.');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Billing portal error:', err);
      setErrorMsg(err.message || 'Unable to open billing portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
      {/* Header Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-400 mb-6 backdrop-blur-sm shadow-md">
        <Sparkles className="h-3.5 w-3.5" /> Flexible &amp; Transparent Pricing
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
        Supercharge Your Copywriting with AI
      </h1>
      <p className="mt-4 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
        Select the ideal plan for your store. Scale your product catalog with high-converting AI descriptions, vision features, and direct e-commerce exports.
      </p>

      {/* Billing Cycle Selector Toggle */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
          Monthly Billing
        </span>
        <button
          type="button"
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          className="relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-600 transition-colors duration-200 ease-in-out focus:outline-none"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
            Yearly Billing
          </span>
          <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
            Save 20%
          </span>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="mt-6 max-w-xl mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-800 p-4 text-emerald-300 text-sm text-center font-medium shadow-xl">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mt-6 max-w-xl mx-auto rounded-2xl bg-red-950/80 border border-red-800 p-4 text-red-300 text-sm text-center font-medium shadow-xl">
          {errorMsg}
        </div>
      )}

      {/* Pending Crypto Payment Verification Status Bar */}
      {pendingPayment && (
        <div className="mt-8 max-w-2xl mx-auto rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/60 via-gray-900 to-amber-950/40 p-5 text-left shadow-2xl backdrop-blur-md flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Binance / Crypto Payment Under Review
              </span>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                PENDING VERIFICATION
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-300 leading-relaxed">
              Your request for <strong className="text-white uppercase">{pendingPayment.plan} Plan (${pendingPayment.amount} USD)</strong> submitted on {new Date(pendingPayment.createdAt).toLocaleDateString()} is currently being verified by an admin. Your account will be upgraded immediately upon verification.
            </p>
          </div>
        </div>
      )}

      {/* Active Subscription Banner */}
      {session && userPlan !== 'free' && (
        <div className="mt-8 max-w-xl mx-auto flex items-center justify-between rounded-2xl bg-gray-900/90 border border-gray-800 p-5 text-left shadow-xl backdrop-blur-md">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Active Membership</span>
            <p className="text-base font-extrabold text-white capitalize">{userPlan} Plan Active</p>
          </div>
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-gray-700 disabled:opacity-50 transition-all shadow-md"
          >
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Manage Billing
          </button>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        {/* Free Plan */}
        <div
          className={`rounded-2xl border bg-gray-900/60 p-8 flex flex-col justify-between transition-all ${
            userPlan === 'free' ? 'border-indigo-500/50 shadow-xl shadow-indigo-500/5' : 'border-gray-800 hover:border-gray-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Free Starter</h3>
              {userPlan === 'free' && session && (
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-0.5 text-xs font-extrabold text-indigo-400">
                  Current Plan
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400">Ideal for trying AI description generation.</p>
            <div className="mt-6">
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>

            <ul className="mt-8 space-y-3.5 text-xs text-gray-300">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                <span><strong className="text-white font-bold">10</strong> generations / month</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" /> Standard tones &amp; copywriting frameworks
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" /> Export as Plain Text &amp; CSV
              </li>
              <li className="flex items-center gap-2.5 text-gray-500">
                <X className="h-4 w-4 shrink-0 text-gray-600" />
                <span className="line-through">Vision AI image recognition</span>
              </li>
              <li className="flex items-center gap-2.5 text-gray-500">
                <X className="h-4 w-4 shrink-0 text-gray-600" />
                <span className="line-through">Shopify export unlocked</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            {userPlan === 'free' && session ? (
              <button
                disabled
                className="w-full rounded-xl border border-gray-800 bg-gray-800/50 py-3 text-xs font-bold text-gray-400 cursor-default text-center"
              >
                Current Tier
              </button>
            ) : (
              <Link
                href="/login"
                className="block w-full text-center rounded-xl border border-gray-700 bg-gray-800 py-3 text-xs font-bold text-white hover:bg-gray-700 transition-colors shadow-md"
              >
                Get Started Free
              </Link>
            )}
          </div>
        </div>

        {/* Pro Plan */}
        <div
          className={`rounded-2xl border-2 bg-gray-900/90 p-8 flex flex-col justify-between relative shadow-2xl transition-all ${
            userPlan === 'pro'
              ? 'border-indigo-500 shadow-indigo-500/20 ring-1 ring-indigo-500'
              : 'border-indigo-500/80 shadow-indigo-500/10 hover:border-indigo-400'
          }`}
        >
          <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-3.5 py-1 text-[11px] font-extrabold text-white uppercase tracking-wider shadow-lg">
            Most Popular
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-white">Pro Creator</h3>
              {userPlan === 'pro' && (
                <span className="rounded-full bg-indigo-500/20 border border-indigo-400/40 px-3 py-0.5 text-xs font-bold text-indigo-300">
                  Current Plan
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400">For growing e-commerce stores &amp; copywriters.</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">${displayProPrice}</span>
              <span className="text-gray-400 text-sm">/month</span>
              {billingCycle === 'yearly' && (
                <span className="text-[11px] text-emerald-400 font-bold ml-1">billed annually</span>
              )}
            </div>

            <ul className="mt-8 space-y-3.5 text-xs text-gray-300">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                <span><strong className="text-white font-bold">300</strong> generations / month</span>
              </li>
              <li className="flex items-center gap-2.5 font-semibold text-indigo-300">
                <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" /> Vision AI Image-to-Copy Engine
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" /> Custom prompt templates
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" /> Bulk CSV &amp; Plain Text export
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-indigo-400 shrink-0" /> SEO Meta Snippet generator
              </li>
            </ul>
          </div>

          <div className="mt-8 space-y-2.5">
            {userPlan === 'pro' ? (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-800 border border-gray-700 py-3 text-xs font-bold text-white hover:bg-gray-700 transition-colors"
              >
                {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Manage Subscription
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSubscribe('pro')}
                  disabled={loadingPlan === 'pro'}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-xs font-bold text-white hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 active:scale-[0.99]"
                >
                  {loadingPlan === 'pro' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>
                      Upgrade with Card <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedBinancePlan('pro');
                    setSelectedBinanceAmount(displayProPrice);
                    setBinanceModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 py-2.5 text-xs font-extrabold text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Pay ${displayProPrice} via Binance / USDT
                </button>
              </>
            )}
          </div>
        </div>

        {/* Business Plan */}
        <div
          className={`rounded-2xl border bg-gray-900/60 p-8 flex flex-col justify-between transition-all ${
            userPlan === 'business'
              ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500'
              : 'border-gray-800 hover:border-gray-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Business</h3>
              {userPlan === 'business' && (
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-0.5 text-xs font-bold text-emerald-300">
                  Current Plan
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400">High volume merchants needing direct Shopify sync.</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">${displayBusinessPrice}</span>
              <span className="text-gray-400 text-sm">/month</span>
              {billingCycle === 'yearly' && (
                <span className="text-[11px] text-emerald-400 font-bold ml-1">billed annually</span>
              )}
            </div>

            <ul className="mt-8 space-y-3.5 text-xs text-gray-300">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span><strong className="text-white font-bold">2,000</strong> generations / month</span>
              </li>
              <li className="flex items-center gap-2.5 font-extrabold text-emerald-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" /> Shopify Export Unlocked
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Priority Vision AI pipeline
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Custom prompt template library
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Dedicated priority support
              </li>
            </ul>
          </div>

          <div className="mt-8 space-y-2.5">
            {userPlan === 'business' ? (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-800 border border-gray-700 py-3 text-xs font-bold text-white hover:bg-gray-700 transition-colors"
              >
                {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Manage Subscription
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSubscribe('business')}
                  disabled={loadingPlan === 'business'}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 active:scale-[0.99]"
                >
                  {loadingPlan === 'business' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>
                      Upgrade with Card <Zap className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedBinancePlan('business');
                    setSelectedBinanceAmount(displayBusinessPrice);
                    setBinanceModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 py-2.5 text-xs font-extrabold text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Pay ${displayBusinessPrice} via Binance / USDT
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Plan Feature Comparison Table */}
      <div className="mt-20 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Compare Plan Features</h2>
          <p className="text-xs text-gray-400">Detailed overview of capabilities across all subscription tiers.</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden shadow-2xl backdrop-blur-md text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-gray-300">
              <thead className="bg-gray-950/80 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
                <tr>
                  <th scope="col" className="py-4 px-6 font-bold">Feature</th>
                  <th scope="col" className="py-4 px-6 text-center font-bold">Free</th>
                  <th scope="col" className="py-4 px-6 text-center font-bold text-indigo-400">Pro ($19/mo)</th>
                  <th scope="col" className="py-4 px-6 text-center font-bold text-emerald-400">Business ($49/mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Monthly Generation Limit</td>
                  <td className="py-4 px-6 text-center font-mono">10 / mo</td>
                  <td className="py-4 px-6 text-center font-mono font-bold text-indigo-300">300 / mo</td>
                  <td className="py-4 px-6 text-center font-mono font-bold text-emerald-300">2,000 / mo</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Copywriting Frameworks (AIDA, PAS, FAB)</td>
                  <td className="py-4 px-6 text-center text-emerald-400"><CheckCircle2 className="h-4 w-4 mx-auto" /></td>
                  <td className="py-4 px-6 text-center text-emerald-400"><CheckCircle2 className="h-4 w-4 mx-auto" /></td>
                  <td className="py-4 px-6 text-center text-emerald-400"><CheckCircle2 className="h-4 w-4 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Vision AI Image Recognition</td>
                  <td className="py-4 px-6 text-center text-gray-600"><X className="h-4 w-4 mx-auto" /></td>
                  <td className="py-4 px-6 text-center text-emerald-400"><CheckCircle2 className="h-4 w-4 mx-auto" /></td>
                  <td className="py-4 px-6 text-center text-emerald-400"><CheckCircle2 className="h-4 w-4 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Custom Prompt Templates</td>
                  <td className="py-4 px-6 text-center text-gray-600"><X className="h-4 w-4 mx-auto" /></td>
                  <td className="py-4 px-6 text-center text-emerald-400"><CheckCircle2 className="h-4 w-4 mx-auto" /></td>
                  <td className="py-4 px-6 text-center text-emerald-400"><CheckCircle2 className="h-4 w-4 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Export as Plain Text &amp; CSV</td>
                  <td className="py-4 px-6 text-center text-emerald-400"><CheckCircle2 className="h-4 w-4 mx-auto" /></td>
                  <td className="py-4 px-6 text-center text-emerald-400"><CheckCircle2 className="h-4 w-4 mx-auto" /></td>
                  <td className="py-4 px-6 text-center text-emerald-400"><CheckCircle2 className="h-4 w-4 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Direct Shopify Store Export</td>
                  <td className="py-4 px-6 text-center text-gray-600"><X className="h-4 w-4 mx-auto" /></td>
                  <td className="py-4 px-6 text-center text-gray-600"><X className="h-4 w-4 mx-auto" /></td>
                  <td className="py-4 px-6 text-center text-emerald-400"><CheckCircle2 className="h-4 w-4 mx-auto text-emerald-400" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Priority GPT-4o Pipeline</td>
                  <td className="py-4 px-6 text-center text-gray-600"><X className="h-4 w-4 mx-auto" /></td>
                  <td className="py-4 px-6 text-center text-gray-600"><X className="h-4 w-4 mx-auto" /></td>
                  <td className="py-4 px-6 text-center text-emerald-400"><CheckCircle2 className="h-4 w-4 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <BinancePaymentModal
        isOpen={binanceModalOpen}
        onClose={() => setBinanceModalOpen(false)}
        defaultPlan={selectedBinancePlan}
        defaultAmount={selectedBinanceAmount}
      />
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400">Loading pricing plans...</div>}>
      <PricingContent />
    </Suspense>
  );
}
