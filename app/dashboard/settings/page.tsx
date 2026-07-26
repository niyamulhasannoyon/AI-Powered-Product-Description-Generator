import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import UserSettingsForm from '@/components/UserSettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || !userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      defaultTone: true,
      defaultLanguage: true,
      brandVoice: true,
      targetAudience: true,
      defaultFramework: true,
    },
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Account & Brand Presets
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage your personal account profile, Brand Voice guidelines, and default copywriting frameworks.
        </p>
      </div>

      <UserSettingsForm user={user || {}} />
    </div>
  );
}
