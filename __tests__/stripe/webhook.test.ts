import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
  getPlanFromPriceId: vi.fn().mockReturnValue('pro'),
}));

import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { POST } from '@/app/api/stripe/webhook/route';

describe('Stripe Webhook Signature Verification & Event Handler Suite', () => {
  const originalEnvSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_12345';
  });

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalEnvSecret;
  });

  it('returns 400 status with Webhook Signature Error when signature verification fails', async () => {
    (stripe.webhooks.constructEvent as any).mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload.');
    });

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=123,v1=invalid_sig',
      },
      body: JSON.stringify({ type: 'payment_intent.succeeded' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Webhook Signature Error');
    expect(data.error).toContain('No signatures found matching');
    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      expect.any(String),
      't=123,v1=invalid_sig',
      'whsec_test_secret_12345'
    );
  });

  it('successfully verifies valid signature and processes webhook event', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          subscription: 'sub_123',
          customer: 'cus_456',
          metadata: { userId: 'user-789', plan: 'pro' },
        },
      },
    };

    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    (stripe.subscriptions.retrieve as any).mockResolvedValue({
      id: 'sub_123',
      status: 'active',
      items: { data: [{ price: { id: 'price_pro_id' } }] },
      metadata: { userId: 'user-789' },
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-789',
      stripeCustomerId: 'cus_456',
    });

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=123,v1=valid_sig',
      },
      body: JSON.stringify(mockEvent),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-789' },
      data: {
        plan: 'pro',
        stripeCustomerId: 'cus_456',
      },
    });

    expect(prisma.subscription.upsert).toHaveBeenCalled();
  });

  it('bypasses signature check when STRIPE_WEBHOOK_SECRET is not configured (development mode)', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const mockEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_789',
          metadata: { userId: 'user-del' },
          current_period_end: Math.floor(Date.now() / 1000),
        },
      },
    };

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-del',
    });

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-del' },
      data: { plan: 'free' },
    });
  });
});
