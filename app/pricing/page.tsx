'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2, Sparkles, Zap, ShieldCheck, ExternalLink, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

function PricingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');

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
        body: JSON.stringify({ plan }),
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
      <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 mb-6 backdrop-blur-sm">
        <Sparkles className="h-3.5 w-3.5" /> Flexible &amp; Transparent Pricing
      </div>

      <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
        Supercharge Your Copywriting with AI
      </h1>
      <p className="mt-4 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
        Select the ideal tier for your store. Scale your product catalog with high-converting AI descriptions and direct e-commerce exports.
      </p>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="mt-6 max-w-xl mx-auto rounded-xl bg-emerald-950/60 border border-emerald-800 p-4 text-emerald-300 text-sm text-center font-medium shadow-lg">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mt-6 max-w-xl mx-auto rounded-xl bg-red-950/60 border border-red-800 p-4 text-red-300 text-sm text-center font-medium shadow-lg">
          {errorMsg}
        </div>
      )}

      {/* Active Subscription Banner */}
      {session && userPlan !== 'free' && (
        <div className="mt-8 max-w-xl mx-auto flex items-center justify-between rounded-xl bg-gray-900 border border-gray-800 p-4 text-left shadow-lg">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Current Subscription</span>
            <p className="text-sm font-bold text-white capitalize">{userPlan} Plan Active</p>
          </div>
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-all"
          >
            {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
            Manage Billing
          </button>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        {/* Free Plan */}
        <div
          className={`rounded-2xl border bg-gray-900/60 p-8 flex flex-col justify-between transition-all ${
            userPlan === 'free' ? 'border-blue-500/50 shadow-lg shadow-blue-500/5' : 'border-gray-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Free Starter</h3>
              {userPlan === 'free' && session && (
                <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
                  Current Plan
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-400">Perfect for exploring AI description generation.</p>
            <div className="mt-6">
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="text-gray-400">/month</span>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-blue-400 shrink-0" />
                <span><strong className="text-white">10</strong> generations / month</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-blue-400 shrink-0" /> Standard tones &amp; styles
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-blue-400 shrink-0" /> Export as Plain Text &amp; CSV
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
                className="w-full rounded-xl border border-gray-800 bg-gray-800/50 py-3 text-sm font-semibold text-gray-400 cursor-default text-center"
              >
                Current Tier
              </button>
            ) : (
              <Link
                href="/login"
                className="block w-full text-center rounded-xl border border-gray-700 bg-gray-800 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
              >
                Get Started Free
              </Link>
            )}
          </div>
        </div>

        {/* Pro Plan */}
        <div
          className={`rounded-2xl border-2 bg-gray-900 p-8 flex flex-col justify-between relative shadow-xl ${
            userPlan === 'pro'
              ? 'border-blue-500 shadow-blue-500/20 ring-1 ring-blue-500'
              : 'border-blue-500/80 shadow-blue-500/10'
          }`}
        >
          <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-md">
            Most Popular
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Pro Creator</h3>
              {userPlan === 'pro' && (
                <span className="rounded-full bg-blue-500/20 border border-blue-400/40 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
                  Current Plan
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-400">For growing e-commerce sellers &amp; copywriters.</p>
            <div className="mt-6">
              <span className="text-4xl font-extrabold text-white">$19</span>
              <span className="text-gray-400">/month</span>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-blue-400 shrink-0" />
                <span><strong className="text-white">300</strong> generations / month</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-blue-400 shrink-0" /> Custom prompt templates
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-blue-400 shrink-0" /> Image-to-Copy Vision AI
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-blue-400 shrink-0" /> Bulk CSV export
              </li>
            </ul>
          </div>

          <div className="mt-8">
            {userPlan === 'pro' ? (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-800 border border-gray-700 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
              >
                {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Manage Subscription
              </button>
            ) : (
              <button
                onClick={() => handleSubscribe('pro')}
                disabled={loadingPlan === 'pro'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/25 disabled:opacity-50"
              >
                {loadingPlan === 'pro' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <>
                    Upgrade to Pro <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Business Plan */}
        <div
          className={`rounded-2xl border bg-gray-900/60 p-8 flex flex-col justify-between transition-all ${
            userPlan === 'business'
              ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
              : 'border-gray-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Business</h3>
              {userPlan === 'business' && (
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  Current Plan
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-400">High volume merchants needing direct Shopify sync.</p>
            <div className="mt-6">
              <span className="text-4xl font-extrabold text-white">$49</span>
              <span className="text-gray-400">/month</span>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span><strong className="text-white">2,000</strong> generations / month</span>
              </li>
              <li className="flex items-center gap-2.5 font-medium text-emerald-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" /> Shopify export unlocked
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Priority GPT-4o pipeline
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Custom prompt template library
              </li>
            </ul>
          </div>

          <div className="mt-8">
            {userPlan === 'business' ? (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-800 border border-gray-700 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
              >
                {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Manage Subscription
              </button>
            ) : (
              <button
                onClick={() => handleSubscribe('business')}
                disabled={loadingPlan === 'business'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/25 disabled:opacity-50"
              >
                {loadingPlan === 'business' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <>
                    Upgrade to Business <Zap className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
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
