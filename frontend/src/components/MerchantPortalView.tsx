"use client";

import React, { useState, useEffect } from 'react';
import { 
  Store, 
  PlusCircle, 
  Package, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  Eye, 
  DollarSign,
  HeartPulse,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface MerchantPortalViewProps {
  onVerifyBarcode?: (barcode: string) => void;
  onNavigateToLab?: () => void;
}

export default function MerchantPortalView({
  onVerifyBarcode,
  onNavigateToLab,
}: MerchantPortalViewProps) {
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedScanBatch, setSelectedScanBatch] = useState<string>('');
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    price: 90,
    weightGrams: 1000,
    stockQuantity: 25,
    treatedDiseases: 'قرحة المعدة والقولون, تقوية المناعة ومكافحة الأورام',
    descriptionAr: '',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
  });

  const shopId = 'shop-1'; // Default demo shop: مناحل وادي دوعن الملكية

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/shops/${shopId}`);
      if (res.ok) {
        const data = await res.json();
        setShop(data.shop);
        setProducts(data.products || []);
        setScans(data.scans || []);
        if (data.scans && data.scans.length > 0) {
          setSelectedScanBatch(data.scans[0].id);
          setFormData((prev) => ({
            ...prev,
            nameAr: `${data.scans[0].honeyTypeNameAr} (1 كجم)`,
            descriptionAr: `عسل ${data.scans[0].honeyType} نقي 100% موثق بالباركود ${data.scans[0].barcode}`,
          }));
        }
      }

      // Fetch orders
      const orderRes = await fetch('http://localhost:3001/api/marketplace/orders');
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(orderData.orders || []);
      }
    } catch (err) {
      console.error('Error fetching shop data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenScan = scans.find((s) => s.id === selectedScanBatch) || scans[0];

    if (!chosenScan) {
      alert('يرجى إجراء فحص مخبري للعسل أولاً في محطة الفحص للحصول على باركود معتمد.');
      return;
    }

    try {
      const payload = {
        nameAr: formData.nameAr,
        nameEn: formData.nameEn || 'Certified Yemeni Honey',
        honeyTypeId: chosenScan.honeyType,
        sampleId: chosenScan.id,
        barcode: chosenScan.barcode,
        price: Number(formData.price),
        weightGrams: Number(formData.weightGrams),
        stockQuantity: Number(formData.stockQuantity),
        treatedDiseases: formData.treatedDiseases.split(',').map((s) => s.trim()),
        descriptionAr: formData.descriptionAr,
        imageUrl: formData.imageUrl,
      };

      const res = await fetch(`http://localhost:3001/api/shops/${shopId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchShopData();
        alert('تمت إضافة البضاعة بنجاح وربطها بالباركود المعتمد وشهادة الفحص!');
      }
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">جاري تحميل لوحة تحكم المتجر...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* Merchant Header Profile Card */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center md:text-right">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-500/50 shadow-xl shrink-0">
              <img src={shop?.logo} alt={shop?.name} className="w-full h-full object-cover" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                <h2 className="text-2xl font-black text-white">{shop?.name}</h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>متجر موثق ومعتمد</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                المالك: <span className="text-white font-medium">{shop?.ownerName}</span> | الموقع: <span className="text-amber-300 font-medium">{shop?.city} ({shop?.region})</span>
              </p>
            </div>
          </div>

          {/* Quick Action: Add Product */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-all transform active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة بضاعة جديدة بعد الفحص المخبري</span>
          </button>
        </div>

        {/* Subscription Status & Scan Quotas Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block">باقة الاشتراك السحابي:</span>
              <span className="font-bold text-amber-300 text-sm">الباقة التجارية (Commercial)</span>
            </div>
            <Layers className="w-5 h-5 text-amber-400" />
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block">رصيد الفحوصات المتبقي:</span>
              <span className="font-bold text-emerald-400 text-sm">{shop?.scansRemaining} فحص مخبري</span>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block">الظهور في بحث العميل:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {shop?.isVisibleInSearch ? '✓ مفعل وظاهر للجمهور' : 'مخفي بطلب الأدمن'}
              </span>
            </div>
            <Eye className="w-5 h-5 text-blue-400" />
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block">إجمالي الفحوصات المنفذة:</span>
              <span className="font-bold text-purple-400 text-sm">{shop?.totalScansPerformed} فحص معتمد</span>
            </div>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
        </div>
      </section>

      {/* Main Grid: Inventory Products & Laboratory Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Products in Store (Cols 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>مخزون بضاعة المتجر المعروضة للبيع ({products.length})</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">مرتبطة بالباركود الرسمي</span>
            </div>

            {products.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                لا توجد بضائع مدخلة حالياً. اضغط على "إضافة بضاعة جديدة" لربط دفعة مفحوصة.
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <img src={p.imageUrl} alt={p.nameAr} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      <div>
                        <h4 className="font-bold text-white text-sm">{p.nameAr}</h4>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          <span className="text-amber-400 font-mono">{p.barcode}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-emerald-400 font-semibold">نقاء {p.purityScore}%</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          علاج: {p.treatedDiseases?.join('، ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div>
                        <span className="text-xs text-slate-400 block">السعر / المخزون:</span>
                        <span className="text-base font-black text-amber-400">{p.price} {p.currency}</span>
                        <span className="text-[11px] text-slate-400 block">({p.stockQuantity} عبوة)</span>
                      </div>

                      {onVerifyBarcode && (
                        <button
                          onClick={() => onVerifyBarcode(p.barcode)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                          title="عرض شهادة الفحص لهذا الباركود"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Certified Scans Ready to be Productized (Cols 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>دفعات الفحص المخبري المعتمدة ({scans.length})</span>
              </h3>
              {onNavigateToLab && (
                <button
                  onClick={onNavigateToLab}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>إجراء فحص جديد</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {scans.map((s) => (
                <div key={s.id} className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{s.honeyTypeNameAr}</span>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {s.qualityScore.toFixed(1)}% نقاء
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{s.barcode}</span>
                    <span>{new Date(s.testedAt).toLocaleDateString('ar-YE')}</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800/60">
                    <a
                      href={`http://localhost:3001/api/scan/reports/${s.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تقرير PDF المعتمد</span>
                    </a>

                    <button
                      onClick={() => {
                        setSelectedScanBatch(s.id);
                        setFormData((prev) => ({
                          ...prev,
                          nameAr: `${s.honeyTypeNameAr} (1 كجم)`,
                          descriptionAr: `عسل خالص موثق مخبرياً بالباركود ${s.barcode}`,
                        }));
                        setShowAddModal(true);
                      }}
                      className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold border border-amber-500/30"
                    >
                      إدراج في المتجر
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incoming Orders Summary */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>الطلبات الواردة لمتجرك ({orders.length})</span>
            </h3>

            {orders.map((o) => (
              <div key={o.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">{o.customerName}</span>
                  <span className="text-[11px] text-slate-400">{o.city} • {o.items?.length} أصناف</span>
                </div>
                <div className="text-left">
                  <span className="font-bold text-amber-400 text-sm block">{o.totalAmount} $</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    مؤكد للشحن
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <span>إدراج بضاعة عسل جديدة بعد الفحص المخبري</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">اختر دفعة الفحص المخبري (الباركود الموثق):</label>
                <select
                  value={selectedScanBatch}
                  onChange={(e) => {
                    setSelectedScanBatch(e.target.value);
                    const chosen = scans.find((s) => s.id === e.target.value);
                    if (chosen) {
                      setFormData((prev) => ({
                        ...prev,
                        nameAr: `${chosen.honeyTypeNameAr} (1 كجم)`,
                        descriptionAr: `عسل ${chosen.honeyType} خالص موثق بنسبة نقاء ${chosen.qualityScore.toFixed(1)}%`,
                      }));
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none"
                >
                  {scans.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.honeyTypeNameAr} - باركود: {s.barcode} (نقاء {s.qualityScore.toFixed(1)}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">عنوان المنتج في المتجر:</label>
                <input
                  type="text"
                  required
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">السعر (USD):</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">الكمية بالمخزن (عبوة):</label>
                  <input
                    type="number"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">الأمراض والفوائد العلاجية (مفصولة بفاصلة):</label>
                <input
                  type="text"
                  value={formData.treatedDiseases}
                  onChange={(e) => setFormData({ ...formData, treatedDiseases: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none"
                  placeholder="مثال: قرحة المعدة والقولون, تقوية المناعة, فقر الدم"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">الوصف التسويقي:</label>
                <textarea
                  rows={3}
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20"
                >
                  نشر البضاعة في السوق فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
