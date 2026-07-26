'use client';

import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import {
  Sparkles,
  Loader2,
  Tag,
  Globe,
  Smile,
  AlertCircle,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Bookmark,
} from 'lucide-react';
import Link from 'next/link';

const LANGUAGES = [
  { label: 'English', value: 'English' },
  { label: 'Bengali (বাংলা)', value: 'Bengali' },
  { label: 'Spanish (Español)', value: 'Spanish' },
  { label: 'French (Français)', value: 'French' },
  { label: 'Arabic (العربية)', value: 'Arabic' },
  { label: 'Hindi (हिन्दी)', value: 'Hindi' },
];

const TONES = [
  { label: 'Professional', value: 'Professional' },
  { label: 'Casual', value: 'Casual' },
  { label: 'Luxury', value: 'Luxury' },
  { label: 'Playful', value: 'Playful' },
];

interface GeneratedProduct {
  id: string;
  imageUrl: string;
  keywords: string[];
  language: string;
  generatedTitle: string;
  generatedDescription: string;
  generatedTags: string[];
  createdAt: string;
}

export default function ProductGeneratorForm() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [language, setLanguage] = useState<string>('English');
  const [tone, setTone] = useState<string>('Professional');

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const [generatedProduct, setGeneratedProduct] = useState<GeneratedProduct | null>(null);

  // Copy buttons state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Handle keyword comma separation & max 3 limit
  const handleKeywordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeywordInput(val);

    if (val.includes(',')) {
      const parts = val
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const combined = Array.from(new Set([...keywords, ...parts]));
      if (combined.length <= 3) {
        setKeywords(combined);
        setKeywordInput('');
      } else {
        setKeywords(combined.slice(0, 3));
        setKeywordInput('');
      }
    }
  };

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = keywordInput.trim();
      if (trimmed && !keywords.includes(trimmed) && keywords.length < 3) {
        setKeywords([...keywords, trimmed]);
        setKeywordInput('');
      }
    }
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    setKeywords(keywords.filter((_, i) => i !== indexToRemove));
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Flush any pending text in keywordInput if < 3
    let finalKeywords = [...keywords];
    if (keywordInput.trim() && !finalKeywords.includes(keywordInput.trim()) && finalKeywords.length < 3) {
      finalKeywords.push(keywordInput.trim());
      setKeywords(finalKeywords);
      setKeywordInput('');
    }

    if (!imageUrl) {
      setError('Please upload a product image before generating.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setIsLimitExceeded(false);

    try {
      const response = await fetch('/api/products/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          keywords: finalKeywords,
          language,
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402 || data.limitExceeded) {
          setIsLimitExceeded(true);
        }
        throw new Error(data.error || 'Failed to generate description.');
      }

      setGeneratedProduct(data);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err?.message || 'Something went wrong during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Input Form */}
      <div className="lg:col-span-7 space-y-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-xl p-6 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Product AI Generator
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Upload your product image and set parameters to generate SEO copy.
              </p>
            </div>
          </div>

          {/* 1. Image Upload Component */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
              1. Product Image <span className="text-blue-400">*</span>
            </label>
            <ImageUpload
              value={imageUrl}
              onUploadSuccess={(url) => {
                setImageUrl(url);
                setError(null);
              }}
              onClear={() => setImageUrl('')}
            />
          </div>

          {/* 2. Keywords Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                2. Keywords <span className="text-gray-500 font-normal">(Comma-separated, max 3)</span>
              </label>
              <span className="text-[11px] font-medium text-gray-400">
                {keywords.length}/3 keywords
              </span>
            </div>

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-gray-800 bg-gray-950/80 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
                <Tag className="w-4 h-4 text-gray-500 ml-1" />

                {keywords.map((kw, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-lg"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(index)}
                      className="hover:text-white transition ml-0.5 text-blue-400 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}

                {keywords.length < 3 && (
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={handleKeywordInputChange}
                    onKeyDown={handleAddKeyword}
                    placeholder={
                      keywords.length === 0
                        ? 'e.g. eco-friendly, wireless, ergonomic (press enter or comma)'
                        : 'Add keyword...'
                    }
                    className="flex-1 min-w-[150px] bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 3. Target Language & Tone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Language */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                3. Target Language
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-gray-500 absolute left-3.5 top-3 pointer-events-none" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-800 bg-gray-950/80 pl-10 pr-4 py-2.5 text-xs font-medium text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value} className="bg-gray-900 text-white">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tone Dropdown */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                4. Brand Tone
              </label>
              <div className="relative">
                <Smile className="w-4 h-4 text-gray-500 absolute left-3.5 top-3 pointer-events-none" />
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-800 bg-gray-950/80 pl-10 pr-4 py-2.5 text-xs font-medium text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-gray-900 text-white">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-200">Generation Failed</p>
                <p className="mt-0.5 text-red-300/90">{error}</p>
                {isLimitExceeded && (
                  <div className="mt-3">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-red-600 transition"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Upgrade Plan Now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating || !imageUrl}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm font-semibold text-white shadow-xl transition-all ${
              isGenerating || !imageUrl
                ? 'bg-blue-600/50 cursor-not-allowed text-gray-300'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 shadow-blue-500/25 active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Image & Writing Copy...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Product Description
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Output / Result Preview */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-xl p-6 shadow-2xl h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-emerald-400" />
                AI Output Result
              </h3>
              {generatedProduct && (
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                  Saved to Database
                </span>
              )}
            </div>

            {isGenerating ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-purple-400 absolute inset-0 m-auto" />
                </div>
                <h4 className="text-sm font-semibold text-white">Generating Copy with Vision AI</h4>
                <p className="text-xs text-gray-400 max-w-xs">
                  Evaluating product features, building SEO parameters, and formatting output...
                </p>
              </div>
            ) : generatedProduct ? (
              <div className="space-y-6 text-left">
                {/* 1. Generated Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      SEO Optimized Title
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedProduct.generatedTitle, 'title')}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      {copiedField === 'title' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedField === 'title' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white bg-gray-950/80 p-3 rounded-xl border border-gray-800">
                    {generatedProduct.generatedTitle}
                  </h4>
                </div>

                {/* 2. Generated Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Benefit-Driven Description
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedProduct.generatedDescription, 'desc')}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      {copiedField === 'desc' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedField === 'desc' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-300 bg-gray-950/80 p-3.5 rounded-xl border border-gray-800 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                    {generatedProduct.generatedDescription}
                  </div>
                </div>

                {/* 3. Generated Tags */}
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    SEO Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedProduct.generatedTags.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-gray-800/80 border border-gray-700 text-gray-300 text-[11px] px-2.5 py-1 rounded-lg"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-gray-800/80 rounded-xl p-8 bg-gray-950/40">
                <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-gray-300">No Product Generated Yet</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Fill out the parameters on the left and click &quot;Generate Product Description&quot; to start.
                </p>
              </div>
            )}
          </div>

          {generatedProduct && (
            <div className="pt-6 border-t border-gray-800 mt-6">
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold py-2.5 transition"
              >
                View All Products in Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
