import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Check, Zap, Sparkles, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || !userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const generationsCount = await prisma.usageLog.count({
    where: {
      userId,
      action: 'generate',
      createdAt: { gte: periodStart },
    },
  });

  const currentPlan = (user?.plan || 'free').toLowerCase();

  const plans = [
    {
      name: 'Free',
      id: 'free',
      price: '$0',
      period: 'forever',
      description: 'Ideal for trying out ProductPen AI product copy generation.',
      limit: 50,
      features: [
        '50 AI generations per month',
        'Standard OpenAI & Gemini models',
        'CSV & Shopify exports',
        'Basic prompt templates',
      ],
    },
    {
      name: 'Pro',
      id: 'pro',
      price: '$29',
      period: 'per month',
      popular: true,
      description: 'Perfect for active e-commerce merchants & store owners.',
      limit: 300,
      features: [
        '300 AI generations per month',
        'Advanced Gemini & GPT-4o models',
        'Custom prompt templates editor',
        'Batch inline editing & exports',
        'Priority customer support',
      ],
    },
    {
      name: 'Business',
      id: 'business',
      price: '$79',
      period: 'per month',
      description: 'Built for high-volume catalogs and marketing agencies.',
      limit: 1000,
      features: [
        '1,000 AI generations per month',
        'Unlimited custom prompt templates',
        'Multi-language bulk translations',
        'Dedicated API access & webhook sync',
        'Dedicated account manager',
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Billing & Subscription
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage your subscription plan, generation limits, and payment methods.
        </p>
      </div>

      {/* Current Plan Overview Card */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  {currentPlan} Plan
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Generations used this billing period: <strong className="text-white">{generationsCount}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span>Secure billing powered by Stripe</span>
          </div>
        </div>
      </div>

      {/* Pricing Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-200 border ${
                plan.popular
                  ? 'border-indigo-500/80 bg-gradient-to-b from-gray-900 via-gray-900 to-indigo-950/30 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/40'
                  : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 min-h-[32px]">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-gray-400 font-medium">/{plan.period}</span>
                </div>

                <ul className="space-y-2.5 pt-2 border-t border-gray-800">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                      <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full rounded-xl bg-gray-800 py-2.5 text-xs font-semibold text-gray-400 cursor-default border border-gray-700"
                  >
                    Current Plan
                  </button>
                ) : (
                  <Link
                    href="/pricing"
                    className="block text-center w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
                  >
                    Upgrade to {plan.name}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
