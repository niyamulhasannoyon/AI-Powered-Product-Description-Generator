import { NextResponse } from 'next/server';
import { checkAdminSession } from '@/lib/admin';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { isAdmin, error } = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const [
      totalUsers,
      freeUsers,
      proUsers,
      businessUsers,
      adminUsers,
      totalProducts,
      totalUsageLogs,
      pendingPaymentsCount,
      approvedPayments,
      recentUsers,
      recentProducts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: 'free' } }),
      prisma.user.count({ where: { plan: 'pro' } }),
      prisma.user.count({ where: { plan: 'business' } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.product.count(),
      prisma.usageLog.count(),
      prisma.paymentRequest.count({ where: { status: 'PENDING' } }),
      prisma.paymentRequest.findMany({
        where: { status: 'APPROVED' },
        select: { amount: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, plan: true, role: true, createdAt: true },
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    const totalApprovedRevenueUsd = approvedPayments.reduce((sum, item) => sum + item.amount, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        freeUsers,
        proUsers,
        businessUsers,
        adminUsers,
        totalProducts,
        totalUsageLogs,
        pendingPaymentsCount,
        totalApprovedRevenueUsd,
        recentUsers,
        recentProducts,
        systemStatus: {
          database: 'Healthy',
          geminiApi: 'Active',
          stripePayments: 'Active',
          binancePayments: 'Active',
          serverTime: new Date().toISOString(),
        },
      },
    });
  } catch (err: any) {
    console.error('Error fetching admin stats:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch admin stats' }, { status: 500 });
  }
}
