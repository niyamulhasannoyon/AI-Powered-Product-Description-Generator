import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import UsageMeter from '@/components/UsageMeter';
import MyProductsView from '@/components/MyProductsView';
import { redirect } from 'next/navigation';

import { PLAN_LIMITS } from '@/lib/usageLimit';

export default async function DashboardMainHubPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || !userId) {
    redirect('/login');
  }

  // Fetch User & Subscription
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  const planName = (user?.plan || 'free').toLowerCase();
  const planLimit = PLAN_LIMITS[planName] || 300;

  // Determine current billing period start date
  const now = new Date();
  let periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  if (user?.subscription?.currentPeriodEnd) {
    periodEnd = new Date(user.subscription.currentPeriodEnd);
    periodStart = new Date(periodEnd);
    periodStart.setMonth(periodStart.getMonth() - 1);
  }

  // Calculate usage count for current period from UsageLog
  const usedThisMonth = await prisma.usageLog.count({
    where: {
      userId,
      action: 'generate',
      createdAt: {
        gte: periodStart,
      },
    },
  });

  // Fetch all user products
  const rawProducts = await prisma.product.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const products = rawProducts.map((p) => ({
    id: p.id,
    imageUrl: p.imageUrl,
    keywords: p.keywords,
    language: p.language,
    generatedTitle: p.generatedTitle,
    generatedDescription: p.generatedDescription,
    generatedTags: p.generatedTags,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage your AI generated products, monitor generation usage, and export your catalog.
        </p>
      </div>

      {/* Usage Meter Widget */}
      <UsageMeter
        usedCount={usedThisMonth}
        planLimit={planLimit}
        planName={planName}
        periodEnd={periodEnd.toISOString()}
      />

      {/* Main "My Products" Paginated Hub */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">
            My Products & Generations
          </h2>
        </div>
        <MyProductsView initialProducts={products} userPlan={planName} />
      </div>
    </div>
  );
}
