'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, DollarSign, Loader2, Send, AlertCircle, ShieldCheck, QrCode } from 'lucide-react';

interface BinancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: string;
  defaultAmount?: number;
}

export default function BinancePaymentModal({
  isOpen,
  onClose,
  defaultPlan = 'pro',
  defaultAmount = 19,
}: BinancePaymentModalProps) {
  const [plan, setPlan] = useState<string>(defaultPlan);
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [binanceId, setBinanceId] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPayId, setCopiedPayId] = useState(false);

  // Dynamic Settings
  const [adminBinancePayId, setAdminBinancePayId] = useState<string>('284719302');
  const [adminUsdtAddress, setAdminUsdtAddress] = useState<string>('0x94F8672C15eF968A91a27e748A4269894e666999');
  const [binanceQrUrl, setBinanceQrUrl] = useState<string>('');
  const [paymentInstructions, setPaymentInstructions] = useState<string>('');
  const [proPrice, setProPrice] = useState<number>(19);
  const [businessPrice, setBusinessPrice] = useState<number>(49);

  useEffect(() => {
    if (isOpen) {
      setPlan(defaultPlan);
      setAmount(defaultAmount);
      fetch('/api/admin/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            if (data.settings.binancePayId) setAdminBinancePayId(data.settings.binancePayId);
            if (data.settings.usdtAddress) setAdminUsdtAddress(data.settings.usdtAddress);
            if (data.settings.binanceQrUrl) setBinanceQrUrl(data.settings.binanceQrUrl);
            if (data.settings.paymentInstructions) setPaymentInstructions(data.settings.paymentInstructions);
            if (data.settings.proPriceUsd) setProPrice(data.settings.proPriceUsd);
            if (data.settings.businessPriceUsd) setBusinessPrice(data.settings.businessPriceUsd);
          }
        })
        .catch((err) => console.error('Failed to load Binance settings:', err));
    }
  }, [isOpen, defaultPlan, defaultAmount]);

  if (!isOpen) return null;

  const handlePlanChange = (selectedPlan: string) => {
    setPlan(selectedPlan);
    if (selectedPlan === 'pro') setAmount(proPrice);
    if (selectedPlan === 'business') setAmount(businessPrice);
  };

  const copyToClipboard = (text: string, type: 'payId' | 'address') => {
    navigator.clipboard.writeText(text);
    if (type === 'payId') {
      setCopiedPayId(true);
      setTimeout(() => setCopiedPayId(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!binanceId.trim() || !transactionId.trim()) {
      setError('Please enter your Binance ID and Order/Transaction ID.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          amount,
          binanceId,
          transactionId,
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payment request.');
      }

      setSuccess('Payment request submitted successfully! Admin will verify your order details and activate your plan shortly.');
      if (typeof window !== 'undefined') {
        const { broadcastRealtimeEvent } = require('@/lib/realtime');
        broadcastRealtimeEvent('PAYMENT_MUTATED', 'create', data);
      }
      setBinanceId('');
      setTransactionId('');
      setNote('');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900/95 p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3.5 sticky top-0 bg-gray-900/95 z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-md">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">Binance / USDT Payment</h3>
              <p className="text-xs text-gray-400">Manual Crypto Verification & Instant Activation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-800 bg-gray-950 p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Binance Deposit Details Box */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Binance Pay ID / USDT Wallet
            </span>
            <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              USDT (TRC20 / BEP20)
            </span>
          </div>

          {/* Optional QR Code Image */}
          {binanceQrUrl && (
            <div className="flex flex-col items-center justify-center p-3 bg-gray-950 rounded-xl border border-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={binanceQrUrl}
                alt="Binance Pay QR Code"
                className="h-32 w-32 object-contain rounded-lg border border-gray-800 shadow-md"
              />
              <span className="text-[10px] font-semibold text-gray-400 mt-1.5">Scan QR in Binance App</span>
            </div>
          )}

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-gray-950 p-2.5 border border-gray-800">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Binance Pay ID:</span>
                <span className="font-mono font-bold text-white text-sm tracking-wide">{adminBinancePayId}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(adminBinancePayId, 'payId')}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 transition-all"
              >
                {copiedPayId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedPayId ? 'Copied' : 'Copy ID'}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-950 p-2.5 border border-gray-800">
              <div className="min-w-0 pr-2">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">USDT Address (BEP20 / TRC20):</span>
                <span className="font-mono text-white text-xs truncate block max-w-[200px] sm:max-w-[280px]">
                  {adminUsdtAddress}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(adminUsdtAddress, 'address')}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 shrink-0 transition-all"
              >
                {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId ? 'Copied' : 'Copy Address'}
              </button>
            </div>
          </div>

          {/* Payment Instructions */}
          {paymentInstructions && (
            <p className="text-[11px] text-amber-200/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-relaxed">
              {paymentInstructions}
            </p>
          )}
        </div>

        {/* Success / Error alerts */}
        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Plan Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Select Upgrade Plan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePlanChange('pro')}
                className={`rounded-xl border p-3 text-left transition-all ${
                  plan === 'pro'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500 shadow-md'
                    : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="font-bold text-sm">Pro Creator</div>
                <div className="text-xs text-indigo-400 font-semibold mt-0.5">${proPrice} USD / Month</div>
              </button>

              <button
                type="button"
                onClick={() => handlePlanChange('business')}
                className={`rounded-xl border p-3 text-left transition-all ${
                  plan === 'business'
                    ? 'border-emerald-500 bg-emerald-950/40 text-white ring-1 ring-emerald-500 shadow-md'
                    : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="font-bold text-sm">Business Store</div>
                <div className="text-xs text-emerald-400 font-semibold mt-0.5">${businessPrice} USD / Month</div>
              </button>
            </div>
          </div>

          {/* Dollar Amount */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
              Paid Amount ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold">$</span>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 pl-8 pr-4 py-2.5 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Binance ID */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
              Your Binance ID / Pay ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 194827463 or user@gmail.com"
              value={binanceId}
              onChange={(e) => setBinanceId(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Transaction / Order ID */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Binance Order ID / TxID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 21948291038472910 or 0x4f..."
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none font-mono"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Optional Note
            </label>
            <input
              type="text"
              placeholder="Additional comments or payment proof reference"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-extrabold text-gray-950 shadow-xl shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Payment Request for Verification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
