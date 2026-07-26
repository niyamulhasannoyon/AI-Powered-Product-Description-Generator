'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  ShieldCheck,
  Users,
  CreditCard,
  Package,
  Activity,
  Settings,
  Search,
  RefreshCw,
  Loader2,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  UserCheck,
  Shield,
  Zap,
  TrendingUp,
  Sparkles,
  Database,
  Sliders,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  businessUsers: number;
  adminUsers: number;
  totalProducts: number;
  totalUsageLogs: number;
  pendingPaymentsCount: number;
  totalApprovedRevenueUsd: number;
  recentUsers: any[];
  recentProducts: any[];
  systemStatus: {
    database: string;
    geminiApi: string;
    stripePayments: string;
    binancePayments: string;
    serverTime: string;
  };
}

interface UserItem {
  id: string;
  email: string;
  name?: string;
  plan: string;
  role: string;
  createdAt: string;
  stripeCustomerId?: string;
  _count: {
    products: number;
    usageLogs: number;
    paymentRequests: number;
  };
}

interface PaymentRequestItem {
  id: string;
  userId: string;
  plan: string;
  amount: number;
  binanceId: string;
  transactionId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
    plan: string;
  };
}

interface ProductItem {
  id: string;
  generatedTitle?: string;
  generatedDescription?: string;
  copywritingFramework?: string;
  language: string;
  keywordDensityScore?: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
    plan: string;
  };
}

interface UsageLogItem {
  id: string;
  action: string;
  tokensUsed: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
    plan: string;
  };
}

export default function ProfessionalAdminPanel() {
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'payments' | 'products' | 'usage' | 'settings'>('overview');

  // Loading and Error states
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data states
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  const [payments, setPayments] = useState<PaymentRequestItem[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const [usageLogs, setUsageLogs] = useState<UsageLogItem[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [totalTokens, setTotalTokens] = useState<number>(0);

  // Modals / Confirmation
  const [selectedUserForAction, setSelectedUserForAction] = useState<UserItem | null>(null);
  const [updatingUserPlan, setUpdatingUserPlan] = useState<boolean>(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Fetch Stats Overview
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch platform stats');
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.append('query', userSearch);
      if (userPlanFilter !== 'ALL') params.append('plan', userPlanFilter);
      if (userRoleFilter !== 'ALL') params.append('role', userRoleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingUsers(false);
    }
  }, [userSearch, userPlanFilter, userRoleFilter]);

  // Fetch Payments
  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch payment requests');
      setPayments(data.requests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (productSearch) params.append('query', productSearch);
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch products');
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingProducts(false);
    }
  }, [productSearch]);

  // Fetch Usage
  const fetchUsage = useCallback(async () => {
    setLoadingUsage(true);
    try {
      const res = await fetch('/api/admin/usage');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch usage logs');
      setUsageLogs(data.usageLogs || []);
      setTotalTokens(data.totalTokensUsed || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingUsage(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchStats();
    }
  }, [sessionStatus, fetchStats]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      if (activeTab === 'overview') fetchStats();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'payments') fetchPayments();
      if (activeTab === 'products') fetchProducts();
      if (activeTab === 'usage') fetchUsage();
    }
  }, [activeTab, sessionStatus, fetchStats, fetchUsers, fetchPayments, fetchProducts, fetchUsage]);

  // Handle User Plan Update
  const handleUpdateUserPlan = async (userId: string, newPlan: string) => {
    setUpdatingUserPlan(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan: newPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user plan');

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
      );
      setActionMessage({ type: 'success', message: `User plan successfully updated to ${newPlan.toUpperCase()}!` });
      fetchStats();
    } catch (err: any) {
      setActionMessage({ type: 'error', message: err.message || 'Failed to update user plan' });
    } finally {
      setUpdatingUserPlan(false);
    }
  };

  // Handle User Role Toggle
  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user role');

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setActionMessage({ type: 'success', message: `User role updated to ${newRole.toUpperCase()}!` });
      fetchStats();
    } catch (err: any) {
      setActionMessage({ type: 'error', message: err.message || 'Failed to update user role' });
    }
  };

  // Handle User Account Delete
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user account? All associated products and history will be deleted.')) {
      return;
    }
    setDeletingUserId(userId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setActionMessage({ type: 'success', message: 'User account deleted successfully.' });
      fetchStats();
    } catch (err: any) {
      setActionMessage({ type: 'error', message: err.message || 'Failed to delete user' });
    } finally {
      setDeletingUserId(null);
    }
  };

  // Handle Payment Approval / Rejection
  const handlePaymentAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingPaymentId(requestId);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update payment status');

      setPayments((prev) =>
        prev.map((p) => (p.id === requestId ? { ...p, status } : p))
      );
      setActionMessage({
        type: 'success',
        message: `Payment request successfully ${status.toLowerCase()}!`,
      });
      fetchStats();
    } catch (err: any) {
      setActionMessage({ type: 'error', message: err.message || 'Payment status update failed' });
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this AI-generated product entry?')) return;
    setDeletingProductId(productId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/products?productId=${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setActionMessage({ type: 'success', message: 'Product removed from system.' });
      fetchStats();
    } catch (err: any) {
      setActionMessage({ type: 'error', message: err.message || 'Product deletion failed' });
    } finally {
      setDeletingProductId(null);
    }
  };

  const filteredPayments = payments.filter((item) => {
    const matchesSearch =
      item.user.email.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      (item.user.name && item.user.name.toLowerCase().includes(paymentSearch.toLowerCase())) ||
      item.binanceId.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      item.transactionId.toLowerCase().includes(paymentSearch.toLowerCase());

    const matchesStatus = paymentStatusFilter === 'ALL' || item.status === paymentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" /> System Control Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Professional Admin Control Panel
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Complete platform management: users, subscriptions, manual Binance approvals, content moderation, & AI system stats.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (activeTab === 'overview') fetchStats();
              if (activeTab === 'users') fetchUsers();
              if (activeTab === 'payments') fetchPayments();
              if (activeTab === 'products') fetchProducts();
              if (activeTab === 'usage') fetchUsage();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-xs font-semibold text-gray-200 hover:bg-gray-800 transition-all"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-400 ${loadingStats ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Global Action Notifications */}
      {actionMessage && (
        <div
          className={`rounded-xl border p-4 text-sm flex items-center justify-between gap-3 ${
            actionMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
              : 'border-red-500/30 bg-red-950/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            )}
            <span>{actionMessage.message}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-800 pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Stats', icon: Activity, count: null },
          { id: 'users', label: 'User Control', icon: Users, count: stats?.totalUsers },
          { id: 'payments', label: 'Payment Approvals', icon: CreditCard, count: stats?.pendingPaymentsCount, badgeColor: 'bg-amber-500 text-gray-950' },
          { id: 'products', label: 'Generated Products', icon: Package, count: stats?.totalProducts },
          { id: 'usage', label: 'AI Usage Logs', icon: Zap, count: null },
          { id: 'settings', label: 'System Health & Controls', icon: Settings, count: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-gray-900/60 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800/80'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== null && tab.count > 0 && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    tab.badgeColor || 'bg-gray-800 text-gray-200'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & STATS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Revenue */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-gray-900/80 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Approved Revenue</span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white mt-3 font-mono">
                ${stats?.totalApprovedRevenueUsd.toFixed(2) || '0.00'} USD
              </div>
              <p className="text-xs text-gray-400 mt-1">From verified Binance Dollar payments</p>
            </div>

            {/* Total Users */}
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 to-gray-900/80 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Total Registered Users</span>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white mt-3 font-mono">
                {stats?.totalUsers || 0}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <span className="text-emerald-400 font-semibold">{stats?.proUsers || 0} Pro</span> •{' '}
                <span className="text-purple-400 font-semibold">{stats?.businessUsers || 0} Business</span>
              </div>
            </div>

            {/* AI Copy Products */}
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-gray-900/80 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">AI Copy Generated</span>
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white mt-3 font-mono">
                {stats?.totalProducts || 0}
              </div>
              <p className="text-xs text-gray-400 mt-1">Across all copywriting frameworks</p>
            </div>

            {/* Pending Payments */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-gray-900/80 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending Payment Queue</span>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white mt-3 font-mono">
                {stats?.pendingPaymentsCount || 0}
              </div>
              <p className="text-xs text-gray-400 mt-1">Awaiting manual Binance Pay verification</p>
            </div>
          </div>

          {/* Quick Plan Breakdown & System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Plan Distribution */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" /> Plan Distribution
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Free Tier</span>
                    <span className="font-mono text-gray-300">{stats?.freeUsers || 0} users</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-500"
                      style={{ width: `${Math.min(100, ((stats?.freeUsers || 0) / (stats?.totalUsers || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-indigo-400 font-semibold">Pro Tier ($19/mo)</span>
                    <span className="font-mono text-indigo-300">{stats?.proUsers || 0} users</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${Math.min(100, ((stats?.proUsers || 0) / (stats?.totalUsers || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-purple-400 font-semibold">Business Tier ($49/mo)</span>
                    <span className="font-mono text-purple-300">{stats?.businessUsers || 0} users</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${Math.min(100, ((stats?.businessUsers || 0) / (stats?.totalUsers || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Registered Users */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-400" /> Recent User Registrations
                </h3>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              <div className="divide-y divide-gray-800/80">
                {stats?.recentUsers?.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-800 text-indigo-400 font-bold flex items-center justify-center border border-gray-700">
                        {u.name ? u.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-white">{u.name || 'Anonymous User'}</p>
                        <p className="text-gray-400">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono uppercase text-[10px] border border-indigo-500/20">
                        {u.plan}
                      </span>
                      <span className="text-gray-500 hidden sm:inline">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER CONTROL */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Controls & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur-md">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-gray-400 flex items-center gap-1"><Filter className="h-3 w-3" /> Plan:</span>
              {['ALL', 'free', 'pro', 'business'].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setUserPlanFilter(p);
                  }}
                  className={`rounded-xl px-3 py-1 text-xs font-semibold uppercase transition-all ${
                    userPlanFilter === p
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'border border-gray-800 bg-gray-950 text-gray-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* User List Table */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span>Loading registered users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-2">
                <Users className="h-10 w-10 mx-auto text-gray-600" />
                <p className="text-base font-semibold text-gray-300">No matching users found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="border-b border-gray-800 bg-gray-950/80 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Plan Level</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">AI Copy Items</th>
                      <th className="py-3.5 px-4">Joined Date</th>
                      <th className="py-3.5 px-4 text-right">Quick Plan Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-indigo-400 font-bold border border-gray-700">
                              {u.name ? u.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="font-semibold text-white truncate max-w-[180px]">{u.name || 'User'}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase border ${
                              u.plan === 'business'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                : u.plan === 'pro'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                : 'bg-gray-800 text-gray-400 border-gray-700'
                            }`}
                          >
                            {u.plan}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border ${
                              u.role === 'admin'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-gray-950 text-gray-400 border-gray-800'
                            }`}
                          >
                            {u.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : null}
                            {u.role}
                          </span>
                        </td>

                        <td className="py-4 px-4 font-mono font-bold text-gray-200">
                          {u._count?.products || 0} products
                        </td>

                        <td className="py-4 px-4 text-xs text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Plan Change Selector */}
                            <select
                              value={u.plan}
                              onChange={(e) => handleUpdateUserPlan(u.id, e.target.value)}
                              disabled={updatingUserPlan}
                              className="rounded-lg border border-gray-800 bg-gray-950 px-2 py-1 text-xs font-semibold text-gray-200 focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="free">Free Plan</option>
                              <option value="pro">Pro ($19/mo)</option>
                              <option value="business">Business ($49/mo)</option>
                            </select>

                            {/* Toggle Role Button */}
                            <button
                              onClick={() => handleToggleUserRole(u.id, u.role)}
                              title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                              className={`p-1.5 rounded-lg border transition-all ${
                                u.role === 'admin'
                                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60'
                                  : 'border-gray-800 bg-gray-950 text-gray-400 hover:text-white'
                              }`}
                            >
                              <Shield className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete User Button */}
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={deletingUserId === u.id}
                              title="Delete User"
                              className="p-1.5 rounded-lg border border-gray-800 bg-gray-950 text-rose-400 hover:bg-rose-950/40 hover:border-rose-900 transition-all disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT APPROVALS */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur-md">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search email, Binance ID, Order ID..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setPaymentStatusFilter(status)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    paymentStatusFilter === status
                      ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20'
                      : 'border border-gray-800 bg-gray-950 text-gray-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
            {loadingPayments ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <span>Loading Binance payment requests...</span>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-2">
                <ShieldCheck className="h-10 w-10 mx-auto text-gray-600" />
                <p className="text-base font-semibold text-gray-300">No payment requests found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="border-b border-gray-800 bg-gray-950/80 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Plan Target</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Binance ID</th>
                      <th className="py-3.5 px-4">Order / TxID</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {filteredPayments.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-emerald-400 font-bold border border-gray-700">
                              {item.user.name ? item.user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="font-semibold text-white truncate max-w-[160px]">{item.user.name || 'User'}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[160px]">{item.user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 text-xs font-bold text-indigo-400 uppercase">
                            {item.plan}
                          </span>
                        </td>

                        <td className="py-4 px-4 font-mono font-bold text-amber-400">
                          ${item.amount.toFixed(2)} USD
                        </td>

                        <td className="py-4 px-4 font-mono text-xs text-white">
                          {item.binanceId}
                        </td>

                        <td className="py-4 px-4 font-mono text-xs text-gray-300 max-w-[180px] truncate" title={item.transactionId}>
                          {item.transactionId}
                        </td>

                        <td className="py-4 px-4 text-xs text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-4 px-4">
                          {item.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-400">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          )}
                          {item.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                              <CheckCircle className="h-3 w-3" /> Approved
                            </span>
                          )}
                          {item.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold text-rose-400">
                              <XCircle className="h-3 w-3" /> Rejected
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          {item.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handlePaymentAction(item.id, 'APPROVED')}
                                disabled={updatingPaymentId === item.id}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md"
                              >
                                {updatingPaymentId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                Approve
                              </button>

                              <button
                                onClick={() => handlePaymentAction(item.id, 'REJECTED')}
                                disabled={updatingPaymentId === item.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:border-rose-900 disabled:opacity-50 transition-all"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GENERATED PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur-md">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search product title, audience, user email..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              onClick={fetchProducts}
              className="rounded-xl border border-gray-800 bg-gray-950 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800"
            >
              Search
            </button>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
            {loadingProducts ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <span>Loading system product copies...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-2">
                <Package className="h-10 w-10 mx-auto text-gray-600" />
                <p className="text-base font-semibold text-gray-300">No generated products found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="border-b border-gray-800 bg-gray-950/80 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="py-3.5 px-4">Generated Title</th>
                      <th className="py-3.5 px-4">Framework</th>
                      <th className="py-3.5 px-4">Creator</th>
                      <th className="py-3.5 px-4">SEO Density</th>
                      <th className="py-3.5 px-4">Created Date</th>
                      <th className="py-3.5 px-4 text-right">Moderation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="py-4 px-4 font-semibold text-white max-w-[240px] truncate" title={p.generatedTitle || ''}>
                          {p.generatedTitle || 'Untitled Copy Product'}
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center rounded-full bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-xs font-bold text-purple-400 uppercase">
                            {p.copywritingFramework || 'AIDA'}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <p className="text-xs font-medium text-white truncate max-w-[160px]">{p.user?.name || 'User'}</p>
                          <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{p.user?.email}</p>
                        </td>

                        <td className="py-4 px-4 font-mono text-emerald-400 font-bold text-xs">
                          {p.keywordDensityScore || 85}%
                        </td>

                        <td className="py-4 px-4 text-xs text-gray-400">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            disabled={deletingProductId === p.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-950 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:border-rose-900 disabled:opacity-50 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete Entry
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AI USAGE LOGS */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-gray-900 to-gray-950 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-400" /> Platform AI Token Consumption
              </h3>
              <p className="text-xs text-gray-400 mt-1">Real-time prompt execution logs & API calls.</p>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase text-gray-400 font-bold">Total Tokens Consumed</span>
              <div className="text-2xl font-extrabold text-indigo-400 font-mono">{totalTokens.toLocaleString()} tokens</div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
            {loadingUsage ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span>Loading system audit logs...</span>
              </div>
            ) : usageLogs.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-2">
                <Zap className="h-10 w-10 mx-auto text-gray-600" />
                <p className="text-base font-semibold text-gray-300">No usage logs recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="border-b border-gray-800 bg-gray-950/80 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Tokens Used</th>
                      <th className="py-3.5 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {usageLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-semibold text-white">{log.user?.name || 'User'}</p>
                          <p className="text-xs text-gray-400">{log.user?.email}</p>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-bold text-indigo-400 uppercase">
                            {log.action}
                          </span>
                        </td>

                        <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                          {log.tokensUsed} tokens
                        </td>

                        <td className="py-4 px-4 text-xs text-gray-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM HEALTH & CONTROLS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Status Indicators */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" /> Infrastructure Health
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-xs font-semibold text-gray-300">PostgreSQL Database</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" /> Healthy
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-xs font-semibold text-gray-300">Google Gemini AI Engine</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" /> Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-xs font-semibold text-gray-300">Stripe Billing API</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" /> Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-xs font-semibold text-gray-300">Binance Pay Verification</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" /> Active
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Tier Configuration Limits */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" /> Plan Usage Quotas
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">Free Plan Limit</p>
                    <p className="text-gray-500">Monthly AI copy generations</p>
                  </div>
                  <span className="font-mono font-bold text-gray-300">300 items / mo</span>
                </div>

                <div className="p-3 rounded-xl bg-gray-950 border border-indigo-500/20 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-indigo-400">Pro Plan Limit ($19/mo)</p>
                    <p className="text-gray-500">Monthly AI copy generations</p>
                  </div>
                  <span className="font-mono font-bold text-indigo-300">2,500 items / mo</span>
                </div>

                <div className="p-3 rounded-xl bg-gray-950 border border-purple-500/20 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-purple-400">Business Plan Limit ($49/mo)</p>
                    <p className="text-gray-500">Monthly AI copy generations</p>
                  </div>
                  <span className="font-mono font-bold text-purple-300">10,000 items / mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
