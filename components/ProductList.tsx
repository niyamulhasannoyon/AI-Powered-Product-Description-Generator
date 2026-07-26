'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  ShoppingBag,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Lock,
  X,
  Zap,
} from 'lucide-react';

export interface Product {
  id: string;
  imageUrl: string;
  keywords: string[];
  language: string;
  generatedTitle?: string | null;
  generatedDescription?: string | null;
  generatedTags: string[];
  createdAt: string | Date;
}

interface ProductListProps {
  initialProducts?: Product[];
  userPlan?: string;
}

export default function ProductList({
  initialProducts = [],
  userPlan = 'free',
}: ProductListProps) {
  const [products] = useState<Product[]>(initialProducts);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportingType, setExportingType] = useState<'csv' | 'shopify' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isBusinessPlan = (userPlan || 'free').toLowerCase() === 'business';
  const allSelected = products.length > 0 && selectedIds.length === products.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < products.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExport = async (type: 'csv' | 'shopify') => {
    if (selectedIds.length === 0) return;

    if (type === 'shopify' && !isBusinessPlan) {
      setShowUpgradeModal(true);
      return;
    }

    setExportingType(type);
    setExportError(null);

    try {
      const url = `/api/export/${type}?ids=${encodeURIComponent(selectedIds.join(','))}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 403 || errJson.upgradeRequired) {
          setShowUpgradeModal(true);
          throw new Error(errJson.error || 'Shopify export is exclusive to the Business plan.');
        }
        throw new Error(errJson.error || `Failed to export as ${type}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = type === 'shopify' ? 'shopify_products.csv' : 'products_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error(`Export ${type} error:`, err);
      setExportError(err?.message || 'An unexpected error occurred during export.');
    } finally {
      setExportingType(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/40 p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-800/80 text-gray-400">
          <Sparkles className="h-7 w-7 text-blue-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">No products generated yet</h3>
        <p className="mt-1 text-sm text-gray-400">
          Generate your first product description to manage and export products here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden shadow-xl">
      {/* Upgrade Prompt Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/30 bg-gray-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Lock className="h-6 w-6" />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-white">Shopify Export Locked</h3>
              <p className="mt-2 text-sm text-gray-300">
                Shopify direct CSV formatting is exclusive to the{' '}
                <strong className="text-emerald-400 font-semibold">Business Plan ($49/mo)</strong>.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Upgrade now to instantly export product handles, HTML formatting, tags, and Shopify image links.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/pricing"
                onClick={() => setShowUpgradeModal(false)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Zap className="h-4 w-4 fill-current" /> Upgrade to Business Tier
              </Link>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="w-full rounded-xl border border-gray-800 bg-gray-800/60 py-2.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-gray-800 bg-gray-950/40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate;
              }}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 accent-blue-600 cursor-pointer"
            />
            <span>Select All ({products.length})</span>
          </button>

          {selectedIds.length > 0 && (
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-medium">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={selectedIds.length === 0 || exportingType !== null}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-3.5 py-2 text-xs font-semibold text-gray-200 border border-gray-700 shadow-sm hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {exportingType === 'csv' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
            ) : (
              <Download className="h-3.5 w-3.5 text-blue-400" />
            )}
            Export as CSV
          </button>

          <button
            type="button"
            onClick={() => handleExport('shopify')}
            disabled={selectedIds.length === 0 || exportingType !== null}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              isBusinessPlan
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60'
            }`}
          >
            {exportingType === 'shopify' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : isBusinessPlan ? (
              <ShoppingBag className="h-3.5 w-3.5 text-white" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
            )}
            Export for Shopify
            {!isBusinessPlan && (
              <span className="ml-1 rounded bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Business
              </span>
            )}
          </button>
        </div>
      </div>

      {exportError && (
        <div className="px-5 py-3 bg-red-950/40 border-b border-red-800/50 text-xs text-red-300 flex items-center justify-between">
          <span>{exportError}</span>
          <button
            onClick={() => setExportError(null)}
            className="text-red-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Product List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-900/80 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-800">
            <tr>
              <th scope="col" className="p-4 w-10 text-center">
                <span className="sr-only">Select</span>
              </th>
              <th scope="col" className="py-3 px-4">
                Product
              </th>
              <th scope="col" className="py-3 px-4 hidden md:table-cell">
                Language
              </th>
              <th scope="col" className="py-3 px-4 hidden lg:table-cell">
                Tags
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {products.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              const formattedDate = new Date(product.createdAt).toLocaleDateString(
                undefined,
                {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }
              );

              return (
                <tr
                  key={product.id}
                  className={`hover:bg-gray-800/40 transition-colors ${
                    isSelected ? 'bg-blue-950/20' : ''
                  }`}
                >
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectProduct(product.id)}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 accent-blue-600 cursor-pointer"
                    />
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.generatedTitle || 'Product thumbnail'}
                          className="h-10 w-10 rounded-md object-cover border border-gray-700 bg-gray-800 flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md border border-gray-800 bg-gray-800 flex items-center justify-center text-gray-500 flex-shrink-0">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate max-w-md">
                          {product.generatedTitle || 'Untitled Product'}
                        </p>
                        {product.generatedDescription && (
                          <p className="text-xs text-gray-400 truncate max-w-md mt-0.5">
                            {product.generatedDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700 uppercase">
                      {product.language || 'en'}
                    </span>
                  </td>

                  <td className="py-3 px-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {product.generatedTags && product.generatedTags.length > 0 ? (
                        product.generatedTags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-gray-800/80 text-gray-300 px-2 py-0.5 rounded border border-gray-700/60"
                          >
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No tags</span>
                      )}
                      {product.generatedTags && product.generatedTags.length > 3 && (
                        <span className="text-[11px] text-gray-400 self-center">
                          +{product.generatedTags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right text-xs text-gray-400 whitespace-nowrap">
                    {formattedDate}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
