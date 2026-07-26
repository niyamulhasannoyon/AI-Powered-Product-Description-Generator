import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { stripe, getAppUrl } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      // Create a customer if user does not have one yet
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = getAppUrl();

    // Create Stripe Billing Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/pricing`,
    });

    // Check if client expects JSON or direct redirect
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('text/html')) {
      return NextResponse.redirect(portalSession.url);
    }

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Error creating Stripe Billing Portal session:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create Billing Portal session' },
      { status: 500 }
    );
  }
}
