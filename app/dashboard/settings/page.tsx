import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { User, Mail, Globe, Sliders, Shield, Save } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || !userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage your personal account profile, default generation preferences, and AI configurations.
        </p>
      </div>

      {/* Account Profile Section */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-6 backdrop-blur-md">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
          <User className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Profile Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">
              Full Name
            </label>
            <input
              type="text"
              defaultValue={user?.name || ''}
              placeholder="Your name"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">
              Email Address
            </label>
            <input
              type="email"
              disabled
              defaultValue={user?.email || ''}
              className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Default Generation Preferences */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-6 backdrop-blur-md">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
          <Globe className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Default Copy Preferences</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">
              Default Target Language
            </label>
            <select
              defaultValue="en"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="en">English (US)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">
              Default AI Engine Provider
            </label>
            <select
              defaultValue="gemini"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="gemini">Google Gemini 1.5 Flash (Recommended)</option>
              <option value="openai">OpenAI GPT-4o Mini</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
        >
          <Save className="h-4 w-4" />
          Save Preferences
        </button>
      </div>
    </div>
  );
}
