import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { stripe, getPlanFromPriceId } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET is not configured. Webhook signature check bypassed for development.');
      event = JSON.parse(body) as Stripe.Event;
    } else {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Signature Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const customerId = session.customer as string;
          const userId =
            session.client_reference_id ||
            session.metadata?.userId ||
            subscription.metadata?.userId;

          let dbUser = null;
          if (userId) {
            dbUser = await prisma.user.findUnique({ where: { id: userId } });
          }
          if (!dbUser && customerId) {
            dbUser = await prisma.user.findFirst({
              where: { stripeCustomerId: customerId },
            });
          }

          if (dbUser) {
            const priceId = subscription.items.data[0]?.price?.id;
            const metaPlan = session.metadata?.plan || subscription.metadata?.plan;
            const plan = (metaPlan || getPlanFromPriceId(priceId)) as 'free' | 'pro' | 'business';

            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                plan,
                stripeCustomerId: customerId || dbUser.stripeCustomerId,
              },
            });

            const currentPeriodEnd = new Date(
              (((subscription as any)?.current_period_end || Math.floor(Date.now() / 1000) + 30 * 86400)) * 1000
            );

            await prisma.subscription.upsert({
              where: { userId: dbUser.id },
              create: {
                userId: dbUser.id,
                stripeSubscriptionId: subscription.id,
                status: subscription.status,
                plan,
                currentPeriodEnd,
              },
              update: {
                stripeSubscriptionId: subscription.id,
                status: subscription.status,
                plan,
                currentPeriodEnd,
              },
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata?.userId;

        let dbUser = null;
        if (userId) {
          dbUser = await prisma.user.findUnique({ where: { id: userId } });
        }
        if (!dbUser && customerId) {
          dbUser = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
          });
        }

        if (dbUser) {
          const priceId = subscription.items.data[0]?.price?.id;
          const metaPlan = subscription.metadata?.plan;
          const detectedPlan = getPlanFromPriceId(priceId);
          const rawPlan = metaPlan || detectedPlan;

          const isActive =
            subscription.status === 'active' || subscription.status === 'trialing';
          const plan = isActive ? (rawPlan as 'free' | 'pro' | 'business') : 'free';

          await prisma.user.update({
            where: { id: dbUser.id },
            data: { plan },
          });

          const currentPeriodEnd = new Date(
            ((subscription as any)?.current_period_end || Math.floor(Date.now() / 1000) + 30 * 86400) * 1000
          );

          await prisma.subscription.upsert({
            where: { userId: dbUser.id },
            create: {
              userId: dbUser.id,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              plan: rawPlan,
              currentPeriodEnd,
            },
            update: {
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              plan: rawPlan,
              currentPeriodEnd,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata?.userId;

        let dbUser = null;
        if (userId) {
          dbUser = await prisma.user.findUnique({ where: { id: userId } });
        }
        if (!dbUser && customerId) {
          dbUser = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
          });
        }

        if (dbUser) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { plan: 'free' },
          });

          const currentPeriodEnd = new Date(
            ((subscription as any)?.current_period_end || Math.floor(Date.now() / 1000) + 30 * 86400) * 1000
          );

          await prisma.subscription.upsert({
            where: { userId: dbUser.id },
            create: {
              userId: dbUser.id,
              stripeSubscriptionId: subscription.id,
              status: 'canceled',
              plan: 'free',
              currentPeriodEnd,
            },
            update: {
              status: 'canceled',
              plan: 'free',
              currentPeriodEnd,
            },
          });
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing Stripe webhook event:', error);
    return NextResponse.json(
      { error: error?.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
