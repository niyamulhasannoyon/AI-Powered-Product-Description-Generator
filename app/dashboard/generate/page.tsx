import React from 'react';
import ProductGeneratorForm from '@/components/ProductGeneratorForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function GenerateProductPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl border border-gray-800 bg-gray-900/60 p-2.5 text-gray-400 hover:text-white hover:border-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Generation</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload an image, pick target language and tone to auto-generate SEO copy.
            </p>
          </div>
        </div>
      </div>

      <ProductGeneratorForm />
    </div>
  );
}
