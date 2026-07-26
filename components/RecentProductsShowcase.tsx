'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Copy, ArrowRight, Layers, Tag, Clock } from 'lucide-react';
import Link from 'next/link';

interface ProductItem {
  id: string;
  imageUrl: string;
  keywords: string[];
  language: string;
  copywritingFramework?: string | null;
  generatedTitle?: string | null;
  generatedDescription?: string | null;
  generatedTags: string[];
  createdAt: string;
}

interface RecentProductsShowcaseProps {
  products: ProductItem[];
}

export default function RecentProductsShowcase({ products }: RecentProductsShowcaseProps) {
  if (!products || products.length === 0) return null;

  const handleCopyReadyText = (product: ProductItem) => {
    let text = `📌 ${product.generatedTitle || 'PRODUCT TITLE'}\n\n`;
    if (product.generatedDescription) {
      text += `PRODUCT DESCRIPTION:\n${product.generatedDescription}\n\n`;
    }
    if (product.generatedTags && product.generatedTags.length > 0) {
      text += `TAGS:\n${product.generatedTags.map((t) => `#${t}`).join(' ')}\n`;
    }
    navigator.clipboard.writeText(text);
    toast.success('Copy-paste ready text copied to clipboard!');
  };

  const recentList = products.slice(0, 3);

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-gray-900 to-purple-950/30 p-6 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recent AI Generations</h3>
            <p className="text-xs text-gray-400">Quick copy-paste ready text from your latest products.</p>
          </div>
        </div>

        <Link
          href="/dashboard/generate"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-md"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate New
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {recentList.map((p) => (
          <div
            key={p.id}
            className="flex flex-col justify-between rounded-xl border border-gray-800 bg-gray-950/80 p-4 space-y-3 hover:border-indigo-500/50 transition-all group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {p.copywritingFramework || 'AIDA'}
                </span>
                <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-start gap-3">
                {p.imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={p.imageUrl}
                    alt={p.generatedTitle || 'Product'}
                    className="h-12 w-12 rounded-lg object-cover border border-gray-800 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {p.generatedTitle || 'Untitled Product Copy'}
                  </h4>
                  <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {p.generatedDescription || 'No description preview available.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-400 uppercase">
                {p.language || 'English'}
              </span>

              <button
                onClick={() => handleCopyReadyText(p)}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Ready Text
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
