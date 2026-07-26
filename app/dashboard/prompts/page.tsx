'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Star,
  Pencil,
  Trash2,
  Copy,
  Check,
  X,
  Code,
  Info,
  ShieldCheck,
  ChevronLeft,
  FileText,
} from 'lucide-react';
import { validatePromptTemplate, PromptValidationResult } from '@/lib/ai/generateDescription';

interface PromptTemplateItem {
  id: string;
  name: string;
  templateText: string;
  isDefault: boolean;
  createdAt: string;
}

export default function PromptsPage() {
  const { data: session, status } = useSession();
  const [templates, setTemplates] = useState<PromptTemplateItem[]>([]);
  const [systemDefault, setSystemDefault] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplateItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    templateText: '',
    isDefault: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation modal state
  const [deletingTemplate, setDeletingTemplate] = useState<PromptTemplateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Textarea ref for inserting placeholders
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPrompts();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status]);

  const fetchPrompts = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await fetch('/api/prompts');
      if (!res.ok) {
        throw new Error('Failed to fetch prompt templates');
      }
      const data = await res.json();
      setTemplates(data.templates || []);
      setSystemDefault(data.systemDefault || '');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while loading prompts.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      templateText: systemDefault || `You are an expert e-commerce copywriter. Given these keywords: {{keywords}}, write in {{language}} with a {{tone}} tone. Return ONLY valid JSON with keys: title, description, tags, seoMetaDescription.`,
      isDefault: templates.length === 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (template: PromptTemplateItem) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      templateText: template.templateText,
      isDefault: template.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const currentText = formData.templateText;
    const newText = currentText.substring(0, start) + placeholder + currentText.substring(end);
    setFormData({ ...formData, templateText: newText });

    // Reset cursor position after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }
    }, 0);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.templateText.trim()) {
      setErrorMessage('Please fill in both the template name and template text.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const url = '/api/prompts';
      const method = editingTemplate ? 'PUT' : 'POST';
      const body = editingTemplate
        ? { id: editingTemplate.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save prompt template.');
      }

      setSuccessMessage(
        editingTemplate
          ? 'Prompt template updated successfully!'
          : 'New prompt template created successfully!'
      );
      setIsModalOpen(false);
      fetchPrompts();

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (template: PromptTemplateItem) => {
    if (template.isDefault) return;
    try {
      setErrorMessage(null);
      const res = await fetch('/api/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: template.id,
          name: template.name,
          templateText: template.templateText,
          isDefault: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to set as default template.');
      }

      setSuccessMessage(`"${template.name}" is now your default prompt template.`);
      fetchPrompts();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not update default template.');
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      const res = await fetch(`/api/prompts?id=${deletingTemplate.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete prompt template.');
      }

      setSuccessMessage('Prompt template deleted.');
      setDeletingTemplate(null);
      fetchPrompts();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not delete prompt template.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentValidation: PromptValidationResult = validatePromptTemplate(formData.templateText);

  if (status === 'loading' || isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-400">Loading prompt templates...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-gray-800 bg-gray-900/60 p-8 shadow-xl">
          <Sparkles className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-4 text-xl font-bold text-white">Authentication Required</h2>
          <p className="mt-2 text-sm text-gray-400">Please sign in to access and manage your prompt template settings.</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-lg"
          >
            Sign In to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header & Breadcrumbs */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">Prompt Settings</h1>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
                Custom Templates
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Configure system & custom prompt templates to fine-tune AI product description outputs.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-brand-400 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* System Default Prompt Card (Read-Only) */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            System Default Template
          </h2>
          <span className="text-xs text-gray-500 font-mono">READ-ONLY</span>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/90 to-gray-950 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="h-32 w-32 text-blue-500" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-white text-base">Standard ProductPen AI System Prompt</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Used by default for all product description generations if no custom default template is selected.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
                <Star className="h-3.5 w-3.5 fill-blue-400 text-blue-400" />
                Global Default
              </span>
              <button
                onClick={() => handleCopyText('system', systemDefault)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
              >
                {copiedId === 'system' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Template
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code View */}
          <div className="relative rounded-xl border border-gray-800/80 bg-gray-950 p-4 font-mono text-xs text-gray-300 leading-relaxed shadow-inner">
            {systemDefault}
          </div>

          {/* Placeholders Tags */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800/60 text-xs">
            <span className="text-gray-400 font-medium">Supported Placeholders:</span>
            <span className="rounded-md bg-blue-500/10 px-2.5 py-1 font-mono text-blue-300 border border-blue-500/20">
              &#123;&#123;keywords&#125;&#125;
            </span>
            <span className="rounded-md bg-purple-500/10 px-2.5 py-1 font-mono text-purple-300 border border-purple-500/20">
              &#123;&#123;language&#125;&#125;
            </span>
            <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 font-mono text-emerald-300 border border-emerald-500/20">
              &#123;&#123;tone&#125;&#125;
            </span>
          </div>
        </div>
      </section>

      {/* User Custom Templates Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-400" />
              Your Custom Prompt Templates ({templates.length})
            </h2>
            <p className="text-xs text-gray-400">
              Create tailored prompts for different product categories, tone of voice, or marketplace requirements.
            </p>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/30 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-800 text-gray-400">
              <Code className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">No custom templates yet</h3>
            <p className="mt-1 text-sm text-gray-400 max-w-md mx-auto">
              You are currently using the System Default prompt template. Create a custom template to customize instructions, structure, or tone.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              Create First Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => {
              const validation = validatePromptTemplate(template.templateText);
              return (
                <div
                  key={template.id}
                  className={`rounded-2xl border ${
                    template.isDefault
                      ? 'border-blue-500/50 bg-gray-900/90 shadow-blue-500/5'
                      : 'border-gray-800 bg-gray-900/60'
                  } p-6 shadow-xl flex flex-col justify-between transition-all hover:border-gray-700`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white text-base">{template.name}</h3>
                          {template.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
                              <Star className="h-3 w-3 fill-blue-400 text-blue-400" />
                              Active Default
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 block mt-1">
                          Created {new Date(template.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Top Action Icons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(template)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                          title="Edit Template"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingTemplate(template)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                          title="Delete Template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* JSON Key Validation Badge */}
                    <div className="mb-3">
                      {validation.isValid ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Contains all required JSON keys
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          Missing required keys: {validation.missingKeys.join(', ')}
                        </span>
                      )}
                    </div>

                    {/* Text Preview */}
                    <div className="relative rounded-xl border border-gray-800/80 bg-gray-950 p-3.5 font-mono text-xs text-gray-300 leading-relaxed shadow-inner max-h-36 overflow-y-auto">
                      {template.templateText}
                    </div>
                  </div>

                  {/* Card Bottom Controls */}
                  <div className="mt-5 pt-4 border-t border-gray-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleCopyText(template.id, template.templateText)}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      {copiedId === template.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy Text
                        </>
                      )}
                    </button>

                    {!template.isDefault && (
                      <button
                        onClick={() => handleSetDefault(template)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-500 hover:text-white transition-all"
                      >
                        <Star className="h-3.5 w-3.5" />
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {editingTemplate ? 'Edit Prompt Template' : 'Create Prompt Template'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Configure custom prompt instructions and variables for AI description generation.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-5">
              {/* Name input */}
              <div>
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon SEO Product Description, Luxury Fashion Tone"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Template Textarea */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Prompt Template Text *
                  </label>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-gray-400 mr-1">Insert Placeholder:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertPlaceholder('{{keywords}}')}
                      className="rounded-md bg-blue-500/10 px-2 py-0.5 font-mono text-[11px] text-blue-300 border border-blue-500/20 hover:bg-blue-500/20"
                    >
                      + {'{{keywords}}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertPlaceholder('{{language}}')}
                      className="rounded-md bg-purple-500/10 px-2 py-0.5 font-mono text-[11px] text-purple-300 border border-purple-500/20 hover:bg-purple-500/20"
                    >
                      + {'{{language}}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertPlaceholder('{{tone}}')}
                      className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20"
                    >
                      + {'{{tone}}'}
                    </button>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  required
                  rows={6}
                  value={formData.templateText}
                  onChange={(e) => setFormData({ ...formData, templateText: e.target.value })}
                  placeholder="Enter custom prompt template..."
                  className="w-full rounded-xl border border-gray-800 bg-gray-950 p-4 font-mono text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* Dynamic JSON Keys Warning Banner */}
              {!currentValidation.isValid ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 text-xs leading-relaxed">
                  <div className="flex items-start gap-2.5 font-semibold text-amber-300 mb-1">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>Warning: Missing Required JSON Return Instructions</span>
                  </div>
                  <p className="ml-6 text-amber-200/90">
                    Your template lacks explicit instructions for returning the following JSON keys:
                    <strong className="text-amber-300 font-mono ml-1">
                      {currentValidation.missingKeys.join(', ')}
                    </strong>
                    .
                  </p>
                  <p className="ml-6 text-amber-200/80 mt-1">
                    The AI generation engine expects valid JSON containing <code className="text-amber-300 font-mono">title</code>, <code className="text-amber-300 font-mono">description</code>, <code className="text-amber-300 font-mono">tags</code>, and <code className="text-amber-300 font-mono">seoMetaDescription</code> to properly populate product records.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Valid template: Explicitly instructs model to return required JSON keys (title, description, tags, seoMetaDescription).</span>
                </div>
              )}

              {/* Set as Default Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <label htmlFor="isDefaultCheckbox" className="text-sm font-medium text-gray-200 cursor-pointer">
                  Set as default prompt template (automatically selected for new generations)
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 disabled:opacity-50 transition-all"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editingTemplate ? 'Update Template' : 'Save Template'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Prompt Template</h3>
            </div>
            <p className="text-sm text-gray-300">
              Are you sure you want to delete <strong className="text-white">&quot;{deletingTemplate.name}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingTemplate(null)}
                className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteTemplate}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-red-500 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
