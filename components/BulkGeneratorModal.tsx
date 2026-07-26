'use client';

import React, { useState } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Sparkles } from 'lucide-react';
import Papa from 'papaparse';

interface BulkGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkGeneratorModal({ isOpen, onClose, onSuccess }: BulkGeneratorModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ successCount: number; failedCount: number } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setError(null);
    setSuccessResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const items = rows
          .map((row) => ({
            imageUrl: row.imageUrl || row['Image URL'] || row.image || row.Image || '',
            keywords: row.keywords || row.Keywords || row.tags || '',
            language: row.language || row.Language || 'English',
            tone: row.tone || row.Tone || 'Professional',
            framework: row.framework || row.Framework || 'AIDA',
            targetAudience: row.targetAudience || row.Audience || '',
          }))
          .filter((item) => item.imageUrl.trim() !== '');

        if (items.length === 0) {
          setError('No valid rows found in CSV. Make sure your CSV contains an "imageUrl" or "Image URL" column.');
          setParsedItems([]);
        } else {
          setParsedItems(items);
        }
      },
      error: (err) => {
        setError(`Failed to parse CSV file: ${err.message}`);
      },
    });
  };

  const handleStartBulkGeneration = async () => {
    if (parsedItems.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setSuccessResult(null);
    setProgress({ current: 0, total: parsedItems.length });

    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsedItems }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process bulk generation.');
      }

      setSuccessResult({
        successCount: data.successCount,
        failedCount: data.failedCount,
      });
      onSuccess();
    } catch (err: any) {
      console.error('Bulk generation error:', err);
      setError(err?.message || 'Something went wrong during bulk processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sampleCsvContent = `imageUrl,keywords,language,tone,framework
https://images.unsplash.com/photo-1542291026-7eec264c27ff,running shoes,English,Professional,AIDA
https://images.unsplash.com/photo-1523275335684-37898b6baf30,smart watch,English,Luxury,PAS`;

  const downloadSampleCsv = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_productpen_bulk.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Bulk Product Generator</h3>
              <p className="text-xs text-gray-400">Upload a CSV to generate descriptions for up to 50 products.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        {!successResult ? (
          <div className="space-y-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-800 hover:border-purple-500/50 rounded-xl p-6 text-center bg-gray-950/40 transition">
              <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">
                {csvFile ? csvFile.name : 'Click to select CSV file'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                CSV must contain column: <code className="text-purple-300">imageUrl</code>
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Template sample button */}
            <div className="flex justify-between items-center text-xs text-gray-400 px-1">
              <span>Need format guidance?</span>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="text-purple-400 hover:underline font-medium flex items-center gap-1"
              >
                Download Sample CSV
              </button>
            </div>

            {/* Preview of Parsed Items */}
            {parsedItems.length > 0 && (
              <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span className="font-semibold text-emerald-400">
                    Ready to process: {parsedItems.length} products
                  </span>
                  <span className="text-gray-400 text-[11px]">Max batch: 50</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-gray-400">
                  {parsedItems.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="truncate bg-gray-900/60 p-1.5 rounded border border-gray-800/50">
                      #{idx + 1}: {item.imageUrl} | {item.keywords || 'No keywords'} | {item.framework}
                    </div>
                  ))}
                  {parsedItems.length > 5 && (
                    <p className="text-center text-[10px] text-gray-500 pt-1">
                      + {parsedItems.length - 5} more items...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          /* Success Screen */
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div>
              <h4 className="text-base font-bold text-white">Bulk Processing Complete!</h4>
              <p className="text-xs text-gray-400 mt-1">
                Successfully generated <span className="text-emerald-400 font-bold">{successResult.successCount}</span> product descriptions.
                {successResult.failedCount > 0 && (
                  <span className="text-red-400 font-bold ml-1">({successResult.failedCount} failed)</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold px-4 py-2.5 transition"
          >
            {successResult ? 'Close' : 'Cancel'}
          </button>

          {!successResult && (
            <button
              type="button"
              onClick={handleStartBulkGeneration}
              disabled={isProcessing || parsedItems.length === 0}
              className={`rounded-xl px-5 py-2.5 text-xs font-semibold text-white flex items-center gap-2 transition ${
                isProcessing || parsedItems.length === 0
                  ? 'bg-purple-600/50 cursor-not-allowed text-gray-300'
                  : 'bg-purple-600 hover:bg-purple-500 active:scale-[0.99] shadow-lg shadow-purple-600/20'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating {parsedItems.length} Products...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start Bulk Generation
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
