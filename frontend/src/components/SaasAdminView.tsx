"use client";

import { API_BASE_URL } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  DollarSign, 
  Activity, 
  Store, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  RefreshCw,
  Search,
  SlidersHorizontal
} from 'lucide-react';

export default function SaasAdminView() {
  const [stats, setStats] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Plan Renewal Modal
  const [selectedShopForRenewal, setSelectedShopForRenewal] = useState<any>(null);
  const [selectedPlanKey, setSelectedPlanKey] = useState<'STARTER' | 'COMMERCIAL' | 'ENTERPRISE'>('COMMERCIAL');

  useEffect(() => {
    fetchSaasData();
  }, []);

  const fetchSaasData = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE_URL + '/api/saas/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setShops(data.shops || []);
      }

      const planRes = await fetch(API_BASE_URL + '/api/saas/plans');
      if (planRes.ok) {
        const planData = await planRes.json();
        setPlans(planData.plans || []);
      }
    } catch (err) {
      console.error('Error fetching SaaS admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (shopId: string, currentVisibility: boolean) => {
    try {
      const res = await fetch(API_BASE_URL + '/api/saas/toggle-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, isVisible: !currentVisibility }),
      });

      if (res.ok) {
        fetchSaasData();
      }
    } catch (err) {
      console.error('Error toggling visibility:', err);
    }
  };

  const handleRenewSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopForRenewal) return;

    try {
      const res = await fetch(API_BASE_URL + '/api/saas/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: selectedShopForRenewal.id,
          planKey: selectedPlanKey,
        }),
      });

      if (res.ok) {
        setSelectedShopForRenewal(null);
        fetchSaasData();
        alert('تم تجديد وتفعيل باقة الاشتراك وشحن رصيد الفحوصات للمتجر بنجاح!');
      }
    } catch (err) {
      console.error('Error renewing subscription:', err);
    }
  };

  const filteredShops = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.city.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (loading) {
    return <div className="p-12 text-center text-slate-400">جاري تحميل لوحة الإدارة المركزية SaaS...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* SaaS Admin Banner */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-right">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-lg">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  المنصة المركزية السحابية (SaaS Super-Admin Portal)
                </h2>
                <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full">
                  إدارة الاشتراكات والظهور
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                التحكم المركزي في اشتراكات فحص العسل، باقات المحلات، أرصدة الفحوصات، وتفعيل ظهور المتاجر في بحث العملاء.
              </p>
            </div>
          </div>

          <button
            onClick={fetchSaasData}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث البيانات</span>
          </button>
        </div>

        {/* Global KPIs Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">إجمالي الفحوصات المنفذة:</span>
            <span className="text-2xl font-black text-white font-mono">{stats?.totalScans} فحص</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">
              نسبة النقاء الإجمالية: {stats?.purityRate}%
            </span>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">المحلات المشتركة النشطة:</span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              {stats?.activeShops} / {stats?.totalShops}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {stats?.visibleInSearchShops} متجر معروض بالبحث
            </span>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">إيرادات الاشتراكات السحابية:</span>
            <span className="text-2xl font-black text-purple-400 font-mono">
              {stats?.saasRevenue} $ / شهر
            </span>
            <span className="text-[10px] text-purple-300 block mt-0.5">عائدات رسوم الفحص المخبري</span>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">إجمالي مبيعات السوق الموثق:</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {stats?.totalMarketRevenue} $
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{stats?.totalOrders} طلب شراء مؤكد</span>
          </div>
        </div>
      </section>

      {/* Merchant Subscription & Search Visibility Management Table */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-400" />
              <span>إدارة المحلات، باقات الفحص، وتفعيل الظهور في البحث</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تحكم في ظهور المحل في تطبيق العميل بنقرة واحدة، وشحن أرصدة الفحوصات المخبرية.
            </p>
          </div>

          {/* Search Table */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="تصفية المحلات..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-purple-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-3 font-semibold">المحل / المالك</th>
                <th className="py-3 px-3 font-semibold">المدينة والمنطقة</th>
                <th className="py-3 px-3 font-semibold">باقة الاشتراك</th>
                <th className="py-3 px-3 font-semibold">الفحوصات المتبقية</th>
                <th className="py-3 px-3 font-semibold">ظهور المحل في بحث العميل</th>
                <th className="py-3 px-3 font-semibold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <img src={shop.logo} alt={shop.name} className="w-9 h-9 rounded-lg object-cover" />
                      <div>
                        <span className="font-bold text-white block">{shop.name}</span>
                        <span className="text-[11px] text-slate-400">{shop.ownerName}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-slate-300">
                    {shop.city} <span className="text-slate-500">({shop.region})</span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                      shop.subscriptionPlan === 'ENTERPRISE'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : shop.subscriptionPlan === 'COMMERCIAL'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    }`}>
                      {shop.subscriptionPlan}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 font-mono">
                    <span className="text-emerald-400 font-bold">{shop.scansRemaining} فحص</span>
                    <span className="text-slate-500 text-[10px] block">من أصل {shop.totalScansPerformed + shop.scansRemaining}</span>
                  </td>

                  <td className="py-3.5 px-3">
                    <button
                      onClick={() => handleToggleVisibility(shop.id, shop.isVisibleInSearch)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        shop.isVisibleInSearch
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                      }`}
                    >
                      {shop.isVisibleInSearch ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ظاهر في البحث (مفعل)</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-red-400" />
                          <span>مخفي من البحث</span>
                        </>
                      )}
                    </button>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => setSelectedShopForRenewal(shop)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-purple-900/40 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all"
                    >
                      تجديد / شحن رصيد
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SaaS Subscription Plans Overview */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>باقات الاشتراك المخبري السحابي (SaaS Tiers):</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`glass-panel p-6 rounded-3xl border ${
                p.isPopular ? 'border-amber-500/50 shadow-amber-500/10' : 'border-slate-800'
              } space-y-4 flex flex-col justify-between`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-white text-base">{p.nameAr}</h4>
                  {p.isPopular && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black">
                      الأكثر طلباً
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-amber-400">{p.priceMonthly} $</span>
                  <span className="text-xs text-slate-400">/ شهرياً</span>
                </div>

                <div className="text-xs text-slate-300 font-semibold bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  حصة الفحص: {p.scanQuota} فحص مخبري عالي الدقة شهرياً
                </div>

                <ul className="space-y-2 text-xs text-slate-300 pt-2">
                  {p.features?.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  if (shops.length > 0) {
                    setSelectedShopForRenewal(shops[0]);
                    setSelectedPlanKey(p.planKey);
                  }
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/20"
              >
                تطبيق هذه الباقة لمتجر
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Renew / Upgrade Modal */}
      {selectedShopForRenewal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-purple-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>شحن رصيد وتجديد اشتراك: {selectedShopForRenewal.name}</span>
              </h3>
              <button
                onClick={() => setSelectedShopForRenewal(null)}
                className="text-slate-400 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRenewSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">اختر الباقة المراد تفعيلها وشحن رصيدها:</label>
                <select
                  value={selectedPlanKey}
                  onChange={(e) => setSelectedPlanKey(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none"
                >
                  <option value="STARTER">باقة النحال المبتدئ (50 فحص - 79 $)</option>
                  <option value="COMMERCIAL">باقة المتجر التجاري المعتمد (200 فحص - 199 $)</option>
                  <option value="ENTERPRISE">باقة المختبر والمؤسسات الكبرى (1000 فحص - 499 $)</option>
                </select>
              </div>

              <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-500/30 text-slate-300 text-[11px] leading-relaxed">
                سيتم فورياً إضافة حصة الفحوصات المخبرية لحساب المتجر وتفعيل ظهوره في نتائج بحث ومسح الباركود للعملاء.
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedShopForRenewal(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-500/20"
                >
                  تأكيد التجديد والشحن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
