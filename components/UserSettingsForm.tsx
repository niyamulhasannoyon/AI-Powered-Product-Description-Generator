'use client';

import React, { useState } from 'react';
import { User, Globe, Save, Sliders, Layers, Users, Sparkles, Check, Loader2 } from 'lucide-react';

interface UserSettingsFormProps {
  user: {
    name?: string | null;
    email?: string | null;
    defaultTone?: string | null;
    defaultLanguage?: string | null;
    brandVoice?: string | null;
    targetAudience?: string | null;
    defaultFramework?: string | null;
  };
}

export default function UserSettingsForm({ user }: UserSettingsFormProps) {
  const [name, setName] = useState(user.name || '');
  const [defaultTone, setDefaultTone] = useState(user.defaultTone || 'Professional');
  const [defaultLanguage, setDefaultLanguage] = useState(user.defaultLanguage || 'English');
  const [brandVoice, setBrandVoice] = useState(user.brandVoice || '');
  const [targetAudience, setTargetAudience] = useState(user.targetAudience || '');
  const [defaultFramework, setDefaultFramework] = useState(user.defaultFramework || 'AIDA');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/user/preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultTone,
          defaultLanguage,
          brandVoice,
          targetAudience,
          defaultFramework,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      {/* Account Profile Section */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-6 backdrop-blur-md">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
          <User className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Profile Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">Email Address</label>
            <input
              type="email"
              disabled
              value={user.email || ''}
              className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Brand Voice & Presets System */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-950/10 p-6 space-y-6 backdrop-blur-md">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <div>
            <h2 className="text-base font-bold text-white">Brand Voice & Default Presets</h2>
            <p className="text-xs text-gray-400">Save your store guidelines to auto-apply to all product generations.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-300 block mb-1.5">
              Brand Voice Guidelines & Persona
            </label>
            <textarea
              rows={3}
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              placeholder="e.g. Premium luxury brand, elegant, persuasive, emphasizing craftsmanship, sustainability, and high quality."
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-300 block mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Default Target Audience
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Modern Professionals, Fitness Enthusiasts"
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-gray-300 block mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Default Copywriting Framework
              </label>
              <select
                value={defaultFramework}
                onChange={(e) => setDefaultFramework(e.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="AIDA">AIDA (Attention, Interest, Desire, Action)</option>
                <option value="PAS">PAS (Problem, Agitate, Solution)</option>
                <option value="FAB">FAB (Features, Advantages, Benefits)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Copywriting Preferences */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-6 backdrop-blur-md">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
          <Globe className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Default Tone & Language</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">Default Target Language</label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="English">English</option>
              <option value="Bengali">Bengali (বাংলা)</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
              <option value="Arabic">Arabic (العربية)</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">Default Brand Tone</label>
            <select
              value={defaultTone}
              onChange={(e) => setDefaultTone(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Professional">Professional</option>
              <option value="Casual">Casual</option>
              <option value="Luxury">Luxury</option>
              <option value="Playful">Playful</option>
              <option value="Promotional">Promotional</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        {savedSuccess ? (
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <Check className="w-4 h-4" />
            Brand Voice & Presets Saved Successfully!
          </span>
        ) : (
          <span />
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 hover:from-purple-500 hover:to-indigo-500 transition-all"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving Settings...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Brand Voice & Presets
            </>
          )}
        </button>
      </div>
    </form>
  );
}
