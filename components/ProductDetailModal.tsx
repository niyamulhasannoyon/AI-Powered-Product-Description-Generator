'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  FileText,
  CheckCircle2,
  Share2,
  Globe,
  Tag,
  Search,
  Clock,
  Layers,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface ProductDetailItem {
  id: string;
  imageUrl?: string | null;
  keywords?: string[];
  language?: string | null;
  copywritingFramework?: string | null;
  targetAudience?: string | null;
  generatedTitle?: string | null;
  generatedDescription?: string | null;
  bulletFeatures?: string[] | null;
  socialHook?: string | null;
  seoMetaTitle?: string | null;
  seoMetaDescription?: string | null;
  generatedTags?: string[] | null;
  keywordDensityScore?: number | null;
  createdAt?: string | Date;
}

interface ProductDetailModalProps {
  product: ProductDetailItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatCopyReadyText = (prod: ProductDetailItem) => {
    let text = `📌 ${prod.generatedTitle || 'PRODUCT TITLE'}\n\n`;

    if (prod.bulletFeatures && prod.bulletFeatures.length > 0) {
      text += `KEY HIGHLIGHTS:\n`;
      prod.bulletFeatures.forEach((b) => {
        text += `• ${b}\n`;
      });
      text += `\n`;
    }

    if (prod.generatedDescription) {
      text += `PRODUCT DESCRIPTION (${prod.copywritingFramework || 'AIDA'}):\n`;
      text += `${prod.generatedDescription}\n\n`;
    }

    if (prod.socialHook) {
      text += `SOCIAL MEDIA AD HOOK:\n`;
      text += `"${prod.socialHook}"\n\n`;
    }

    if (prod.seoMetaTitle || prod.seoMetaDescription) {
      text += `SEARCH ENGINE META SNIPPET:\n`;
      text += `Meta Title: ${prod.seoMetaTitle || prod.generatedTitle}\n`;
      text += `Meta Description: ${prod.seoMetaDescription || (prod.generatedDescription ? prod.generatedDescription.slice(0, 160) : '')}\n\n`;
    }

    if (prod.generatedTags && prod.generatedTags.length > 0) {
      text += `TAGS:\n`;
      text += `${prod.generatedTags.map((t) => `#${t}`).join(' ')}\n`;
    }

    return text;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-gray-800 bg-gray-900/95 p-6 shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-gray-800 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">Full Generation Details</h3>
              <p className="text-xs text-gray-400">Complete AI copywriting specifications & export ready copy.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(formatCopyReadyText(product), 'Full Ready Text')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-400 transition-all active:scale-[0.98]"
            >
              {copiedField === 'Full Ready Text' ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Copied All Ready Text!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white" />
                  <span>Copy Full Ready Text</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="rounded-xl border border-gray-800 bg-gray-950 p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Product Summary Header Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-xl border border-gray-800 bg-gray-950/80 p-4">
          {product.imageUrl && (
            <div className="md:col-span-1 flex justify-center items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.generatedTitle || 'Product Preview'}
                className="h-28 w-28 object-cover rounded-xl border border-gray-800 shadow-md"
              />
            </div>
          )}

          <div className={product.imageUrl ? 'md:col-span-3 space-y-2' : 'md:col-span-4 space-y-2'}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-extrabold text-indigo-400 uppercase">
                <Layers className="h-3 w-3" /> Framework: {product.copywritingFramework || 'AIDA'}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-bold text-cyan-400 uppercase">
                <Globe className="h-3 w-3" /> {product.language || 'English'}
              </span>

              {product.keywordDensityScore && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  <Search className="h-3 w-3" /> SEO Score: {product.keywordDensityScore}%
                </span>
              )}

              {product.createdAt && (
                <span className="text-xs text-gray-500 flex items-center gap-1 ml-auto">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-white leading-snug">{product.generatedTitle || 'Untitled Copy Product'}</h2>

            {product.keywords && product.keywords.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Keywords:</span>
                {product.keywords.map((kw, i) => (
                  <span key={i} className="text-xs bg-gray-900 text-gray-300 px-2 py-0.5 rounded border border-gray-800">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Sections */}
        <div className="space-y-4">
          {/* 1. Catchy Title */}
          <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Catchy Product Title
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(product.generatedTitle || '', 'Title')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                {copiedField === 'Title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'Title' ? 'Copied' : 'Copy Title'}
              </button>
            </div>
            <p className="text-sm font-semibold text-white leading-snug">{product.generatedTitle}</p>
          </div>

          {/* 2. Key Bullet Features */}
          {product.bulletFeatures && product.bulletFeatures.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Bullet Features (Key Highlights)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(product.bulletFeatures!.join('\n• '), 'Bullet Features')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  {copiedField === 'Bullet Features' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'Bullet Features' ? 'Copied' : 'Copy Bullets'}
                </button>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-200">
                {product.bulletFeatures.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Full Copywriting Description */}
          {product.generatedDescription && (
            <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Full Product Description ({product.copywritingFramework || 'AIDA'})
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(product.generatedDescription || '', 'Description')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  {copiedField === 'Description' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'Description' ? 'Copied' : 'Copy Description'}
                </button>
              </div>
              <div className="text-xs text-gray-200 whitespace-pre-line leading-relaxed font-sans bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                {product.generatedDescription}
              </div>
            </div>
          )}

          {/* 4. Social Media Ad Hook */}
          {product.socialHook && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4" />
                  Social Media & Ad Campaign Hook
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(product.socialHook || '', 'Ad Hook')}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  {copiedField === 'Ad Hook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'Ad Hook' ? 'Copied' : 'Copy Hook'}
                </button>
              </div>
              <p className="text-xs italic text-amber-200 bg-gray-950 p-2.5 rounded-lg border border-gray-800">
                &quot;{product.socialHook}&quot;
              </p>
            </div>
          )}

          {/* 5. SEO Meta Tags & Snippet */}
          {(product.seoMetaTitle || product.seoMetaDescription) && (
            <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                Google Search Engine Meta Snippet
              </span>

              <div className="space-y-1.5 text-xs bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Meta Title:</span>
                  <span className="text-cyan-300 font-semibold">{product.seoMetaTitle || product.generatedTitle}</span>
                </div>
                {product.seoMetaDescription && (
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold mt-1">Meta Description:</span>
                    <span className="text-gray-300">{product.seoMetaDescription}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. Tags & Hashtags */}
          {product.generatedTags && product.generatedTags.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  Generated E-Commerce Tags & Hashtags
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(product.generatedTags!.map((t) => `#${t}`).join(' '), 'Tags')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  {copiedField === 'Tags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'Tags' ? 'Copied' : 'Copy All Tags'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {product.generatedTags.map((tag, i) => (
                  <span key={i} className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-800 bg-gray-950 px-5 py-2.5 text-xs font-bold text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
