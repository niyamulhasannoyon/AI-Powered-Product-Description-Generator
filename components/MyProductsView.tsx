'use client';

import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Download,
  ShoppingBag,
  Sparkles,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Globe,
  Tag,
  Plus,
  RefreshCw,
  Copy,
} from 'lucide-react';
import Link from 'next/link';

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

interface MyProductsViewProps {
  initialProducts?: Product[];
  userPlan?: string;
}

export default function MyProductsView({
  initialProducts = [],
  userPlan = 'free',
}: MyProductsViewProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Selection & Export state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportingType, setExportingType] = useState<'csv' | 'shopify' | 'woocommerce' | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract unique languages present in product dataset
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    products.forEach((p) => {
      if (p.language) langs.add(p.language.toLowerCase());
    });
    return Array.from(langs);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        (product.generatedTitle &&
          product.generatedTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.generatedDescription &&
          product.generatedDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.keywords &&
          product.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesLang =
        selectedLanguage === 'all' ||
        (product.language && product.language.toLowerCase() === selectedLanguage.toLowerCase());

      return matchesSearch && matchesLang;
    });
  }, [products, searchQuery, selectedLanguage]);

  // Reset pagination when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLanguage]);

  // Paginated dataset
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Selection handling
  const allCurrentSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedIds.includes(p.id));

  const toggleSelectAllPage = () => {
    if (allCurrentSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedProducts.some((p) => p.id === id)));
    } else {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Start inline editing
  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditTitle(product.generatedTitle || '');
    setEditDescription(product.generatedDescription || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleCopyProduct = (product: Product) => {
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

  // Save inline edits
  const handleSaveEdit = async (id: string) => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedTitle: editTitle,
          generatedDescription: editDescription,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save changes');
      }

      const updatedProduct = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updatedProduct } : p))
      );

      toast.success('Product updated successfully!');
      cancelEditing();
    } catch (err: any) {
      toast.error(err?.message || 'Error updating product');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete product');
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      toast.success('Product removed');
    } catch (err: any) {
      toast.error(err?.message || 'Error deleting product');
    } finally {
      setDeletingId(null);
    }
  };

  // Export handling
  const handleExport = async (type: 'csv' | 'shopify' | 'woocommerce') => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one product to export.');
      return;
    }

    if (type === 'shopify' && (userPlan || 'free').toLowerCase() !== 'business') {
      toast.error('Shopify export is exclusive to the Business plan ($49/mo). Please upgrade to unlock.');
      setTimeout(() => {
        window.location.href = '/pricing';
      }, 1500);
      return;
    }

    setExportingType(type);

    try {
      const url = `/api/export/${type}?ids=${encodeURIComponent(selectedIds.join(','))}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 403 || errJson.upgradeRequired) {
          toast.error('Shopify export requires the Business Plan. Redirecting to Pricing...');
          setTimeout(() => {
            window.location.href = '/pricing';
          }, 1500);
          throw new Error('Business plan required for Shopify export.');
        }
        throw new Error(errJson.error || `Failed to export as ${type}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${type}_products_export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`Exported ${selectedIds.length} products to ${type.toUpperCase()} CSV!`);
    } catch (err: any) {
      console.error(`Export error:`, err);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Search, Filter, View Toggle, Export */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title, description, or keywords..."
              className="w-full rounded-xl border border-gray-800 bg-gray-950/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls: Language Filter & View Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Language Filter Dropdown */}
            <div className="relative flex items-center">
              <Globe className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="rounded-xl border border-gray-800 bg-gray-950/80 pl-9 pr-8 py-2.5 text-xs font-medium text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none uppercase"
              >
                <option value="all">All Languages</option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center rounded-xl border border-gray-800 bg-gray-950 p-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Row: Selection Summary & Batch Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-800/80">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAllPage}
              className="flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white transition-colors"
            >
              <input
                type="checkbox"
                checked={allCurrentSelected}
                onChange={toggleSelectAllPage}
                className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
              />
              <span>Select Page ({paginatedProducts.length})</span>
            </button>

            {selectedIds.length > 0 && (
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                {selectedIds.length} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={selectedIds.length === 0 || exportingType !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-800 px-3.5 py-2 text-xs font-semibold text-gray-200 border border-gray-700 shadow-sm hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {exportingType === 'csv' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              ) : (
                <Download className="h-3.5 w-3.5 text-indigo-400" />
              )}
              Export CSV
            </button>

            <button
              type="button"
              onClick={() => handleExport('shopify')}
              disabled={selectedIds.length === 0 || exportingType !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {exportingType === 'shopify' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : (
                <ShoppingBag className="h-3.5 w-3.5 text-white" />
              )}
              Export Shopify CSV
            </button>

            <button
              type="button"
              onClick={() => handleExport('woocommerce')}
              disabled={selectedIds.length === 0 || exportingType !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {exportingType === 'woocommerce' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : (
                <ShoppingBag className="h-3.5 w-3.5 text-white" />
              )}
              Export WooCommerce CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View: Loading Skeleton, Empty State, Grid or Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl border border-gray-800 bg-gray-900/40 animate-pulse"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-gray-800/80 bg-gray-900/40 p-12 text-center backdrop-blur-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">
            {searchQuery || selectedLanguage !== 'all'
              ? 'No matching products found'
              : 'No products generated yet'}
          </h3>
          <p className="mt-1 max-w-sm mx-auto text-sm text-gray-400">
            {searchQuery || selectedLanguage !== 'all'
              ? 'Try adjusting your search query or language filter.'
              : 'Start by generating high-converting AI product descriptions for your catalog.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {searchQuery || selectedLanguage !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLanguage('all');
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-200 border border-gray-700 hover:bg-gray-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            ) : (
              <Link
                href="/dashboard/generate"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Generate New Product
              </Link>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950/80 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
                <tr>
                  <th scope="col" className="p-4 w-10 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th scope="col" className="py-3.5 px-4">Product Info</th>
                  <th scope="col" className="py-3.5 px-4 hidden md:table-cell">Language</th>
                  <th scope="col" className="py-3.5 px-4 hidden lg:table-cell">Tags</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {paginatedProducts.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  const isEditing = editingId === product.id;
                  const formattedDate = new Date(product.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="p-4 text-center align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(product.id)}
                          className="h-4 w-4 mt-1 rounded border-gray-700 bg-gray-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                        />
                      </td>

                      <td className="py-4 px-4 align-top">
                        <div className="flex gap-4 items-start">
                          {product.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={product.imageUrl}
                              alt={product.generatedTitle || 'Product thumbnail'}
                              className="h-14 w-14 rounded-xl object-cover border border-gray-800 bg-gray-950 shrink-0"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-xl border border-gray-800 bg-gray-950 flex items-center justify-center text-gray-500 shrink-0">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-2 max-w-xl">
                                <div>
                                  <label className="text-[10px] font-semibold uppercase text-gray-400">
                                    Title
                                  </label>
                                  <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full rounded-lg border border-indigo-500/50 bg-gray-950 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold uppercase text-gray-400">
                                    Description
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full rounded-lg border border-indigo-500/50 bg-gray-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => handleSaveEdit(product.id)}
                                    disabled={savingEdit}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                                  >
                                    {savingEdit ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300 hover:bg-gray-700"
                                  >
                                    <X className="h-3 w-3" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h4 className="font-semibold text-white text-base leading-snug">
                                  {product.generatedTitle || 'Untitled Product'}
                                </h4>
                                <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                                  {product.generatedDescription || 'No description generated.'}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                                  <span>{formattedDate}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 hidden md:table-cell align-top">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-800/80 text-gray-300 px-2.5 py-1 rounded-lg border border-gray-700/60 uppercase">
                          <Globe className="h-3 w-3 text-indigo-400" />
                          {product.language || 'en'}
                        </span>
                      </td>

                      <td className="py-4 px-4 hidden lg:table-cell align-top">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {product.generatedTags && product.generatedTags.length > 0 ? (
                            product.generatedTags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] bg-gray-800/60 text-gray-300 px-2 py-0.5 rounded-md border border-gray-700/40"
                              >
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                          {product.generatedTags && product.generatedTags.length > 3 && (
                            <span className="text-[11px] text-gray-400 self-center">
                              +{product.generatedTags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right align-top">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCopyProduct(product)}
                            title="Copy ready text"
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => startEditing(product)}
                            title="Inline edit title and description"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deletingId === product.id}
                            title="Delete product"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          >
                            {deletingId === product.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedProducts.map((product) => {
            const isSelected = selectedIds.includes(product.id);
            const isEditing = editingId === product.id;

            return (
              <div
                key={product.id}
                className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden bg-gray-900/60 backdrop-blur-md ${
                  isSelected
                    ? 'border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-950/40'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="p-4 space-y-3">
                  {/* Card Header: Checkbox + Image + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 border border-gray-700">
                        {product.language || 'EN'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyProduct(product)}
                        className="p-1 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
                        title="Copy ready text"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => startEditing(product)}
                        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
                        title="Inline edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-950/40"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail Image */}
                  {product.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={product.imageUrl}
                      alt={product.generatedTitle || 'Product thumbnail'}
                      className="w-full h-36 object-cover rounded-xl border border-gray-800 bg-gray-950"
                    />
                  ) : (
                    <div className="w-full h-36 rounded-xl border border-gray-800 bg-gray-950 flex items-center justify-center text-gray-500">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}

                  {/* Product Details or Edit Form */}
                  {isEditing ? (
                    <div className="space-y-2 pt-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Product title"
                        className="w-full rounded-lg border border-indigo-500/50 bg-gray-950 px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <textarea
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Product description"
                        className="w-full rounded-lg border border-indigo-500/50 bg-gray-950 px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleSaveEdit(product.id)}
                          disabled={savingEdit}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
                        >
                          {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 rounded-lg bg-gray-800 text-xs font-semibold text-gray-300 hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-white text-sm line-clamp-1">
                        {product.generatedTitle || 'Untitled Product'}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-3 mt-1 leading-relaxed">
                        {product.generatedDescription || 'No description available.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-gray-950/60 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center gap-1 truncate max-w-[140px]">
                    <Tag className="h-3 w-3 text-indigo-400 shrink-0" />
                    <span>
                      {product.generatedTags && product.generatedTags.length > 0
                        ? `${product.generatedTags.length} tags`
                        : 'No tags'}
                    </span>
                  </div>
                  <span>
                    {new Date(product.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {filteredProducts.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
          <p className="text-xs text-gray-400">
            Showing{' '}
            <span className="font-semibold text-white">
              {(currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-white">
              {Math.min(currentPage * pageSize, filteredProducts.length)}
            </span>{' '}
            of <span className="font-semibold text-white">{filteredProducts.length}</span> products
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="text-xs font-medium text-gray-400 px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
