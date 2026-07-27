'use client';

import React, { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import BulkGeneratorModal from './BulkGeneratorModal';
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
  Layers,
  Users,
  Sliders,
  FileSpreadsheet,
  FileText,
  Share2,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Edit3,
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
  { label: 'Urgent / Promotional', value: 'Promotional' },
];

const FRAMEWORKS = [
  { label: 'AIDA (Attention, Interest, Desire, Action)', value: 'AIDA', desc: 'Best for general e-commerce & high conversions' },
  { label: 'PAS (Problem, Agitate, Solution)', value: 'PAS', desc: 'Best for pain-point problem-solver products' },
  { label: 'FAB (Features, Advantages, Benefits)', value: 'FAB', desc: 'Best for technical, gadget & apparel items' },
];

interface GeneratedProduct {
  id: string;
  imageUrl: string;
  keywords: string[];
  language: string;
  copywritingFramework?: string;
  bulletFeatures?: string[];
  socialHook?: string;
  targetAudience?: string;
  generatedTitle: string;
  generatedDescription: string;
  generatedTags: string[];
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  keywordDensityScore?: number;
  createdAt: string;
}

export default function ProductGeneratorForm() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [language, setLanguage] = useState<string>('English');
  const [tone, setTone] = useState<string>('Professional');
  const [framework, setFramework] = useState<string>('AIDA');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [brandVoice, setBrandVoice] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [presetLoadedMsg, setPresetLoadedMsg] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const [generatedProduct, setGeneratedProduct] = useState<GeneratedProduct | null>(null);

  // Form Minimize & Big Screen Toggle
  const [isFormMinimized, setIsFormMinimized] = useState<boolean>(false);

  // Copy buttons state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Auto-load brand preset on mount if available
  useEffect(() => {
    fetchUserPreset();
  }, []);

  const fetchUserPreset = async () => {
    setIsLoadingPreset(true);
    try {
      const res = await fetch('/api/user/preset');
      if (res.ok) {
        const data = await res.json();
        if (data.defaultTone) setTone(data.defaultTone);
        if (data.defaultLanguage) setLanguage(data.defaultLanguage);
        if (data.defaultFramework) setFramework(data.defaultFramework);
        if (data.targetAudience) setTargetAudience(data.targetAudience);
        if (data.brandVoice) setBrandVoice(data.brandVoice);
      }
    } catch (err) {
      console.error('Failed to load user brand preset:', err);
    } finally {
      setIsLoadingPreset(false);
    }
  };

  const handleApplyBrandPreset = async () => {
    await fetchUserPreset();
    setPresetLoadedMsg(true);
    setTimeout(() => setPresetLoadedMsg(false), 2500);
  };

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

  const formatCopyReadyText = (prod: GeneratedProduct) => {
    let text = `📌 ${prod.generatedTitle || 'PRODUCT TITLE'}\n\n`;

    if (prod.bulletFeatures && prod.bulletFeatures.length > 0) {
      text += `KEY HIGHLIGHTS:\n`;
      prod.bulletFeatures.forEach((b) => {
        text += `• ${b}\n`;
      });
      text += `\n`;
    }

    text += `PRODUCT DESCRIPTION (${prod.copywritingFramework || framework}):\n`;
    text += `${prod.generatedDescription}\n\n`;

    if (prod.socialHook) {
      text += `SOCIAL MEDIA AD HOOK:\n`;
      text += `"${prod.socialHook}"\n\n`;
    }

    if (prod.seoMetaTitle || prod.seoMetaDescription) {
      text += `SEARCH ENGINE META SNIPPET:\n`;
      text += `Meta Title: ${prod.seoMetaTitle || prod.generatedTitle}\n`;
      text += `Meta Description: ${prod.seoMetaDescription || prod.generatedDescription.slice(0, 160)}\n\n`;
    }

    if (prod.generatedTags && prod.generatedTags.length > 0) {
      text += `TAGS:\n`;
      text += `${prod.generatedTags.map((t) => `#${t}`).join(' ')}\n`;
    }

    return text;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
          framework,
          targetAudience,
          brandVoice,
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
      // Broadcast real-time events across UI components & browser tabs
      if (typeof window !== 'undefined') {
        const { broadcastRealtimeEvent } = require('@/lib/realtime');
        broadcastRealtimeEvent('PRODUCT_MUTATED', 'create', data);
        broadcastRealtimeEvent('USAGE_MUTATED', 'update');
      }
      // Auto-minimize input form to maximize output screen view
      setIsFormMinimized(true);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err?.message || 'Something went wrong during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Minimized Input Control Header Bar (when form is collapsed) */}
      {generatedProduct && isFormMinimized && (
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-gray-900 to-purple-950/40 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={imageUrl} alt="Uploaded product" className="h-10 w-10 rounded-xl object-cover border border-indigo-500/30 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Parameters Set:</span>
                <span className="text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md uppercase">
                  {framework}
                </span>
                <span className="text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  {language}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">
                Keywords: {keywords.length > 0 ? keywords.join(', ') : 'None'} • Tone: {tone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFormMinimized(false)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900 px-3.5 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-white transition-all shadow-md"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              Edit Parameters & Expand Form
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form (Full or Collapsed) */}
        {!isFormMinimized && (
          <div className="lg:col-span-6 space-y-6">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-xl p-6 shadow-2xl space-y-6"
            >
              {/* Header & Quick Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    Product AI Generator
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Upload image & set parameters for SEO copywriting.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {generatedProduct && (
                    <button
                      type="button"
                      onClick={() => setIsFormMinimized(true)}
                      className="inline-flex items-center gap-1 rounded-xl border border-gray-800 bg-gray-950 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white"
                      title="Minimize Form to expand output workspace"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      Minimize
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleApplyBrandPreset}
                    disabled={isLoadingPreset}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition"
                    title="Load saved Brand Voice and default parameters"
                  >
                    {isLoadingPreset ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sliders className="w-3.5 h-3.5" />
                    )}
                    {presetLoadedMsg ? 'Preset Loaded!' : 'Brand Preset'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Bulk CSV
                  </button>
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

              {/* 2. Copywriting Framework Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  2. Copywriting Framework <span className="text-blue-400">*</span>
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-gray-500 absolute left-3.5 top-3 pointer-events-none" />
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-800 bg-gray-950/80 pl-10 pr-4 py-2.5 text-xs font-medium text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                  >
                    {FRAMEWORKS.map((fw) => (
                      <option key={fw.value} value={fw.value} className="bg-gray-900 text-white">
                        {fw.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 pl-1">
                  {FRAMEWORKS.find((f) => f.value === framework)?.desc}
                </p>
              </div>

              {/* 3. Keywords Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                    3. Target SEO Keywords <span className="text-gray-500 font-normal">(Comma-separated, max 3)</span>
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
                            ? 'e.g. leather, waterproof, ergonomic (press enter or comma)'
                            : 'Add keyword...'
                        }
                        className="flex-1 min-w-[150px] bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Target Audience & Brand Voice Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                    4. Target Audience <span className="text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-gray-500 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g. Fitness Enthusiasts, Moms"
                      className="w-full rounded-xl border border-gray-800 bg-gray-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                    5. Brand Voice Tone
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

              {/* 5. Target Language */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  6. Target Language
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
                    Analyzing Image & Writing Copy ({framework})...
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
        )}

        {/* Right Column: Output Result Workspace (Full width when form is minimized) */}
        <div className={isFormMinimized ? 'lg:col-span-12 space-y-6' : 'lg:col-span-6 space-y-6'}>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-xl p-6 shadow-2xl h-full flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-emerald-400" />
                    Structured Output Result
                  </h3>
                  {isFormMinimized && (
                    <p className="text-xs text-gray-400 mt-0.5">Big-Screen Output View (Input Panel Minimized)</p>
                  )}
                </div>

                {generatedProduct && (
                  <div className="flex flex-wrap items-center gap-3">
                    {/* PROMINENT COPY-PASTE READY TEXT BUTTON */}
                    <button
                      onClick={() => copyToClipboard(formatCopyReadyText(generatedProduct), 'allReadyText')}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-400 transition-all active:scale-[0.98]"
                    >
                      {copiedField === 'allReadyText' ? (
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

                    {generatedProduct.keywordDensityScore && (
                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                        <Search className="w-3 h-3" />
                        SEO Score: {generatedProduct.keywordDensityScore}%
                      </span>
                    )}

                    <button
                      onClick={() => setIsFormMinimized(!isFormMinimized)}
                      className="p-2 rounded-xl border border-gray-800 bg-gray-950 text-gray-400 hover:text-white"
                      title={isFormMinimized ? 'Split Screen / Show Form' : 'Big Screen Output Mode'}
                    >
                      {isFormMinimized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              {isGenerating ? (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-purple-400 absolute inset-0 m-auto" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Generating with {framework} Copywriting Framework</h4>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Vision AI is extracting visual features, crafting bullet points, and formatting SEO meta tags...
                  </p>
                </div>
              ) : generatedProduct ? (
                <div className="space-y-5 text-left max-h-[700px] overflow-y-auto pr-1">
                  {/* 1. SEO Title */}
                  <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        🎯 Catchy SEO Title
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedProduct.generatedTitle, 'title')}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {copiedField === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedField === 'title' ? 'Copied' : 'Copy Title'}
                      </button>
                    </div>
                    <h4 className="text-base font-bold text-white">{generatedProduct.generatedTitle}</h4>
                  </div>

                  {/* 2. Key Bullet Features */}
                  {generatedProduct.bulletFeatures && generatedProduct.bulletFeatures.length > 0 && (
                    <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          📌 Bullet Features (Key Highlights)
                        </span>
                        <button
                          onClick={() => copyToClipboard(generatedProduct.bulletFeatures!.join('\n• '), 'bullets')}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          {copiedField === 'bullets' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedField === 'bullets' ? 'Copied' : 'Copy Bullets'}
                        </button>
                      </div>
                      <ul className="space-y-1.5 text-xs text-gray-300">
                        {generatedProduct.bulletFeatures.map((b, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3. Main Copywriting Description */}
                  <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        📝 Persuasive Copywriting ({generatedProduct.copywritingFramework || framework})
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedProduct.generatedDescription, 'desc')}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {copiedField === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedField === 'desc' ? 'Copied' : 'Copy Description'}
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                      {generatedProduct.generatedDescription}
                    </p>
                  </div>

                  {/* 4. Social Media Ad Hook */}
                  {generatedProduct.socialHook && (
                    <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Share2 className="w-3.5 h-3.5" />
                          💡 Social Media Hook / Ad Copy
                        </span>
                        <button
                          onClick={() => copyToClipboard(generatedProduct.socialHook!, 'social')}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          {copiedField === 'social' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedField === 'social' ? 'Copied' : 'Copy Hook'}
                        </button>
                      </div>
                      <p className="text-xs text-amber-200/90 italic bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                        &quot;{generatedProduct.socialHook}&quot;
                      </p>
                    </div>
                  )}

                  {/* 5. Google SEO Meta Title & Description */}
                  <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" />
                        🔍 Google Search Meta Snippet
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `Meta Title: ${generatedProduct.seoMetaTitle || generatedProduct.generatedTitle}\nMeta Description: ${generatedProduct.seoMetaDescription}`,
                            'meta'
                          )
                        }
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {copiedField === 'meta' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedField === 'meta' ? 'Copied' : 'Copy Meta Snippet'}
                      </button>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-cyan-300 font-medium truncate">
                        {generatedProduct.seoMetaTitle || generatedProduct.generatedTitle}
                      </p>
                      <p className="text-gray-400 text-[11px] line-clamp-2">
                        {generatedProduct.seoMetaDescription || generatedProduct.generatedDescription.slice(0, 160)}
                      </p>
                    </div>
                  </div>

                  {/* 6. Tags */}
                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      🏷️ SEO Tags
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
                <div className="py-28 text-center border-2 border-dashed border-gray-800/80 rounded-xl p-8 bg-gray-950/40">
                  <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-gray-300">No Product Generated Yet</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    Fill out the parameters on the left and click &quot;Generate Product Description&quot; to start.
                  </p>
                </div>
              )}
            </div>

            {generatedProduct && (
              <div className="pt-4 border-t border-gray-800 mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => copyToClipboard(formatCopyReadyText(generatedProduct), 'allReadyText')}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:underline"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedField === 'allReadyText' ? 'Copied Full Ready Text!' : 'Copy Full Ready Text'}
                </button>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold px-4 py-2.5 transition"
                >
                  View All Products in Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Generator Modal */}
      <BulkGeneratorModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          setIsBulkModalOpen(false);
        }}
      />
    </div>
  );
}
