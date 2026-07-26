import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PLAN_LIMITS: Record<string, number> = {
  free: 50,
  pro: 300,
  business: 1000,
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    let periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (user.subscription && user.subscription.currentPeriodEnd) {
      periodEnd = new Date(user.subscription.currentPeriodEnd);
      // Period start approximated as 1 month before period end
      periodStart = new Date(periodEnd);
      periodStart.setMonth(periodStart.getMonth() - 1);
    }

    const usedCount = await prisma.usageLog.count({
      where: {
        userId,
        action: 'generate',
        createdAt: {
          gte: periodStart,
        },
      },
    });

    const plan = (user.plan || 'free').toLowerCase();
    const limit = PLAN_LIMITS[plan] || 50;

    return NextResponse.json({
      usedThisMonth: usedCount,
      planLimit: limit,
      planName: plan,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
