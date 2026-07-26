'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, X, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  onClear?: () => void;
  value?: string;
}

export default function ImageUpload({
  onUploadSuccess,
  onUploadError,
  onClear,
  value,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      const errStr = 'Please select a valid image file (PNG, JPG, WEBP, GIF).';
      setError(errStr);
      onUploadError?.(errStr);
      return;
    }

    // Create local object URL for instant preview feedback
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      const finalUrl = data.secure_url || data.url;
      setPreviewUrl(finalUrl);
      onUploadSuccess(finalUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      const errMsg = err?.message || 'Failed to upload image to server';
      setError(errMsg);
      setPreviewUrl(null);
      onUploadError?.(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClear?.();
  };

  const handleClickArea = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative group rounded-2xl border border-gray-700/60 bg-gray-900/80 p-3 overflow-hidden shadow-xl transition-all">
          <div className="relative h-64 w-full rounded-xl overflow-hidden bg-black/40 flex items-center justify-center border border-gray-800">
            {/* Image display */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Product Preview"
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />

            {/* Uploading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3 z-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <span className="text-sm font-medium text-gray-200">
                  Uploading to Cloudinary...
                </span>
              </div>
            )}

            {/* Badges / Overlay Actions */}
            {!isUploading && (
              <div className="absolute top-3 left-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Image Uploaded
              </div>
            )}

            {!isUploading && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-4 z-10">
                <button
                  type="button"
                  onClick={handleClickArea}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800/90 text-white text-xs font-medium px-3 py-2 border border-gray-700 hover:bg-gray-700 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  Change Image
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium px-3 py-2 border border-red-500/30 hover:bg-red-500/30 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClickArea}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 flex flex-col items-center justify-center text-center ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
              : 'border-gray-800 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-900/70'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-base font-semibold text-white">
            Upload Product Image
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Drag and drop your image here, or{' '}
            <span className="text-blue-400 font-medium hover:underline">browse files</span>
          </p>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-500">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Supports PNG, JPG, WEBP or GIF (max 10MB)</span>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
}
