import Link from 'next/link';
import { Sparkles, ArrowRight, Zap, ShoppingBag, Wand2, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Hero Banner Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Powered by OpenAI GPT-4o & Google Gemini 1.5</span>
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div className="mt-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl max-w-4xl mx-auto leading-tight">
            Generate <span className="text-gradient">High-Converting</span> Product Descriptions in Seconds
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Transform raw specs into SEO-optimized product titles, captivating descriptions, and social ad copy engineered to boost e-commerce conversion rates.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition-all"
          >
            Start Generating Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-900/80 px-6 py-3.5 text-base font-semibold text-gray-300 hover:bg-gray-800 hover:text-white active:scale-95 transition-all"
          >
            View Pricing Plans
          </Link>
        </div>

        {/* Live Interactive Generator Preview Section */}
        <div className="mt-16 mx-auto max-w-4xl rounded-2xl border border-gray-800 bg-gray-900/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-white">Live ProductPen AI Studio Preview</span>
            </div>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Mockup */}
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  readOnly
                  value="AeroStride Ultra Lightweight Running Shoes"
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-sm text-gray-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Key Attributes & Keywords
                </label>
                <textarea
                  readOnly
                  rows={3}
                  value="Breathable mesh, responsive foam cushion, ergonomic arch support, recycled material, marathon ready"
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-sm text-gray-200 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Tone
                  </label>
                  <select disabled className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300">
                    <option>Persuasive & Energetic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Target Language
                  </label>
                  <select disabled className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300">
                    <option>English (US)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Generated Output Preview */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 flex flex-col justify-between text-left">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Generated Copy Output</span>
                <h4 className="mt-2 text-sm font-bold text-white">
                  AeroStride Ultra: Lightweight Breathable Running Shoes for Maximum Speed & Comfort
                </h4>
                <p className="mt-2 text-xs text-gray-300 leading-relaxed">
                  Engineered with hyper-responsive foam cushioning and engineered mesh, the AeroStride Ultra delivers effortless energy return step after step. Experience zero-distraction support built for race day performance and everyday training.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-[11px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded">#MarathonRunning</span>
                  <span className="text-[11px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded">#LightweightSneakers</span>
                  <span className="text-[11px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded">#EcoFriendly</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span>SEO Score: <strong className="text-emerald-400">98/100</strong></span>
                <span>Generation Time: <strong>0.42s</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 mb-4">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Multi-Model AI Engine</h3>
            <p className="mt-2 text-sm text-gray-400">
              Combine OpenAI GPT-4o and Google Gemini vision & language models to craft tailored descriptions for Shopify, Amazon, and WooCommerce.
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/10 text-purple-400 mb-4">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">SEO & Keyword Optimization</h3>
            <p className="mt-2 text-sm text-gray-400">
              Automatically incorporate high-intent search keywords, meta descriptions, and bullet points optimized for search engine ranking.
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-400 mb-4">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Brand Voice Customization</h3>
            <p className="mt-2 text-sm text-gray-400">
              Save custom prompt templates and adapt tones from luxury boutique to tech-focused B2B marketing seamlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
