import prisma from '@/lib/prisma';

export const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  pro: 300,
  business: 2000,
};

export interface UsageLimitResult {
  allowed: boolean;
  currentUsage: number;
  maxLimit: number;
  plan: string;
  error?: string;
}

export async function checkUsageLimit(userId: string): Promise<UsageLimitResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      plan: true,
    },
  });

  if (!user) {
    return {
      allowed: false,
      currentUsage: 0,
      maxLimit: 0,
      plan: 'free',
      error: 'User not found.',
    };
  }

  const plan = (user.plan || 'free').toLowerCase();
  const maxLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  // Monthly usage count (start of current calendar month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const currentUsage = await prisma.usageLog.count({
    where: {
      userId: user.id,
      action: 'generate',
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  if (currentUsage >= maxLimit) {
    return {
      allowed: false,
      currentUsage,
      maxLimit,
      plan,
      error: `Monthly generation limit reached (${currentUsage}/${maxLimit} used this month). Please upgrade your subscription plan to continue.`,
    };
  }

  return {
    allowed: true,
    currentUsage,
    maxLimit,
    plan,
  };
}
