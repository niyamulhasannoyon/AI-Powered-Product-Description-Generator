import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20' as any,
  typescript: true,
});

export const STRIPE_PLANS = {
  free: {
    name: 'Free',
    id: 'free',
    priceId: process.env.STRIPE_PRICE_FREE || 'price_free',
    limit: 10,
    price: 0,
  },
  pro: {
    name: 'Pro',
    id: 'pro',
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro',
    limit: 300,
    price: 19,
  },
  business: {
    name: 'Business',
    id: 'business',
    priceId: process.env.STRIPE_PRICE_BUSINESS || 'price_business',
    limit: 2000,
    price: 49,
  },
};

export function getPriceIdFromPlan(plan: string): string {
  const normalizedPlan = (plan || 'free').toLowerCase();
  if (normalizedPlan === 'pro') {
    return process.env.STRIPE_PRICE_PRO || '';
  }
  if (normalizedPlan === 'business') {
    return process.env.STRIPE_PRICE_BUSINESS || '';
  }
  return process.env.STRIPE_PRICE_FREE || '';
}

export function getPlanFromPriceId(priceId?: string | null): 'free' | 'pro' | 'business' {
  if (!priceId) return 'free';

  if (
    process.env.STRIPE_PRICE_PRO &&
    priceId === process.env.STRIPE_PRICE_PRO
  ) {
    return 'pro';
  }

  if (
    process.env.STRIPE_PRICE_BUSINESS &&
    priceId === process.env.STRIPE_PRICE_BUSINESS
  ) {
    return 'business';
  }

  // Fallback checks by string match if needed
  if (priceId.includes('pro')) return 'pro';
  if (priceId.includes('business')) return 'business';

  return 'free';
}

export function getAppUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return 'http://localhost:3000';
}
