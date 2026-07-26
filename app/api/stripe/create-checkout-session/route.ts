import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { stripe, getPriceIdFromPlan, getAppUrl } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { plan, priceId: customPriceId } = body;

    const targetPlan = (plan || 'pro').toLowerCase();
    let targetPriceId = customPriceId || getPriceIdFromPlan(targetPlan);

    if (!targetPriceId || targetPriceId === 'price_free' || targetPlan === 'free') {
      return NextResponse.json(
        { error: 'Invalid plan selected or missing price ID in configuration.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    // Create a new Stripe Customer if missing
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = getAppUrl();

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: targetPriceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?checkout_canceled=true`,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        plan: targetPlan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: targetPlan,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
