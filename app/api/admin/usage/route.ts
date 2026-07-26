import { NextResponse } from 'next/server';
import { checkAdminSession } from '@/lib/admin';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { isAdmin, error } = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const usageLogs = await prisma.usageLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            plan: true,
          },
        },
      },
    });

    const totalTokensAgg = await prisma.usageLog.aggregate({
      _sum: {
        tokensUsed: true,
      },
    });

    return NextResponse.json({
      success: true,
      usageLogs,
      totalTokensUsed: totalTokensAgg._sum.tokensUsed || 0,
    });
  } catch (err: any) {
    console.error('Error fetching admin usage logs:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch usage logs' }, { status: 500 });
  }
}
