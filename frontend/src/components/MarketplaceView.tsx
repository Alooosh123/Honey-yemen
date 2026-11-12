"use client";

import { API_BASE_URL } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  HeartPulse, 
  Sparkles, 
  ShoppingCart, 
  ExternalLink, 
  Store, 
  QrCode,
  Info,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';

interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  honeyTypeId: string;
  shopId: string;
  shopName: string;
  sampleId: string;
  barcode: string;
  price: number;
  currency: string;
  weightGrams: number;
  stockQuantity: number;
  purityScore: number;
  treatedDiseases: string[];
  imageUrl: string;
  descriptionAr: string;
  badge: string;
  rating: number;
  reviewsCount: number;
}

interface MarketplaceViewProps {
  onAddToCart: (product: Product) => void;
  onVerifyBarcode: (barcode: string) => void;
  onOpenEncyclopedia: (honeyTypeId?: string) => void;
}

export default function MarketplaceView({
  onAddToCart,
  onVerifyBarcode,
  onOpenEncyclopedia,
}: MarketplaceViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisease, setSelectedDisease] = useState<string>('ALL');
  const [selectedHoneyType, setSelectedHoneyType] = useState<string>('ALL');

  const popularDiseases = [
    { key: 'ALL', label: 'جميع المنتجات' },
  ];

  const honeyTypesList = [
    { key: 'ALL', label: 'كافة الأنواع' },
    { key: 'type-sidr-doani', label: 'سدر دوعني ملكي' },
    { key: 'type-sidr-osaimi', label: 'سدر عصيمي فاخر' },
    { key: 'type-samr-hadrami', label: 'سمر حضرمي نقي' },
    { key: 'type-salam-tihama', label: 'سلام تهامي صافي' },
    { key: 'type-marai-mountain', label: 'مراعي جبلي طبيعي' },
  ];

  useEffect(() => {
    fetchProducts();
  }, [selectedDisease, selectedHoneyType]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDisease !== 'ALL') params.append('disease', selectedDisease);
      if (selectedHoneyType !== 'ALL') params.append('honeyType', selectedHoneyType);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`${API_BASE_URL}/api/marketplace/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching marketplace products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="space-y-10">
      
      {/* Hero Showcase Banner */}
      <section className="relative overflow-hidden rounded-3xl glass-panel border border-amber-500/30 p-8 sm:p-12 shadow-2xl">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>سوق العسل اليمني — عرض المنتجات ذات سجلات التقييم المعتمدة فقط</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            اكتشف <span className="honey-gradient-text">أنواع العسل اليمني</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            لا تظهر المنتجات في السوق إلا بعد ربطها بسجل تقييم معتمد. قراءات الجهاز وحدها لا تثبت الأصالة أو التركيب الكيميائي، والعسل غذاء وليس بديلاً عن الرعاية الطبية.
          </p>

          {/* Quick Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute right-4 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث باسم العسل، المحل، المرض (مثال: قرحة، مناعة، سدر دوعن)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl pr-12 pl-4 py-3.5 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              بحث ذكي
            </button>
          </form>
        </div>
      </section>

      {/* Disease Filter Pills */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
            <HeartPulse className="w-5 h-5" />
            <span>تصفية المنتجات:</span>
          </div>
          <button 
            onClick={() => onOpenEncyclopedia()} 
            className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>دليل أنواع العسل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {popularDiseases.map((d) => (
            <button
              key={d.key}
              onClick={() => setSelectedDisease(d.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedDisease === d.key
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </section>

      {/* Honey Type Filter Pills */}
      <section className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 whitespace-nowrap font-medium flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-amber-400" /> النوع:
        </span>
        {honeyTypesList.map((t) => (
          <button
            key={t.key}
            onClick={() => setSelectedHoneyType(t.key)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
              selectedHoneyType === t.key
                ? 'bg-slate-800 text-amber-300 border-amber-500 font-bold'
                : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </section>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 glass-panel rounded-3xl animate-pulse p-6" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl border border-dashed border-slate-800 p-8">
          <p className="text-slate-400 text-lg">لم يتم العثور على منتجات عسل مطابقة لخيارات البحث المحددة.</p>
          <button
            onClick={() => { setSelectedDisease('ALL'); setSelectedHoneyType('ALL'); setSearchQuery(''); }}
            className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-sm font-semibold"
          >
            إعادة تعيين كافة الفلاتر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {products.map((product) => (
            <div
              key={product.id}
              className="glass-panel glass-panel-hover rounded-3xl overflow-hidden border border-slate-800 flex flex-col justify-between group"
            >
              <div>
                {/* Product Image & Top Badges */}
                <div className="relative h-56 w-full overflow-hidden bg-slate-950">
                  <img
                    src={product.imageUrl}
                    alt={product.nameAr}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Certified 100% Purity Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/90 text-slate-950 font-black text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
                    <ShieldCheck className="w-4 h-4" />
                    <span>مرتبط بسجل تقييم</span>
                  </div>

                  {/* Weight tag */}
                  <div className="absolute top-3 left-3 bg-slate-900/80 text-slate-300 font-bold text-xs px-2.5 py-1 rounded-lg backdrop-blur-md border border-slate-700/60">
                    {product.weightGrams >= 1000 ? `${product.weightGrams / 1000} كجم` : `${product.weightGrams} جرام`}
                  </div>

                  {/* Shop Details */}
                  <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 bg-slate-900/90 text-amber-300 px-3 py-1 rounded-xl border border-amber-500/30">
                      <Store className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-semibold">{product.shopName}</span>
                    </div>
                    <div className="text-amber-400 font-bold bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-700">
                      ★ {product.rating}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {product.nameAr}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {product.descriptionAr}
                    </p>
                  </div>

                  {/* Barcode Tag (Clickable to verify!) */}
                  <div 
                    onClick={() => onVerifyBarcode(product.barcode)}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/20 hover:border-amber-500/60 transition-all cursor-pointer flex items-center justify-between group/barcode"
                    title="انقر لفحص شهادة المختبر لهذا الباركود"
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-amber-400" />
                      <span className="font-mono text-xs text-slate-300 font-medium tracking-wide">
                        {product.barcode}
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-400 group-hover/barcode:underline font-semibold flex items-center gap-1">
                      <span>عرض الشهادة</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Treated Diseases Tags */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-amber-400" />
                      <span>ملاحظات المنتج:</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.treatedDiseases.map((disease, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-amber-500/10 text-amber-200 border border-amber-500/20 px-2 py-0.5 rounded-md"
                        >
                          {disease}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Cart Actions Footer */}
              <div className="p-6 pt-0 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">السعر للعبوة:</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-400">{product.price}</span>
                    <span className="text-xs text-slate-300 font-bold">{product.currency}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddToCart(product)}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all transform active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>شراء العسل</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Scientific Guarantee Footer Banner */}
      <section className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-white text-base">معلومات الفحص والشفافية</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              يعرض النظام بيانات القياس وحالة التقييم المتاحة لكل منتج. لا تصدر المنظومة حالياً حكماً على الأصالة.
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenEncyclopedia()}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
        >
          استعراض موسوعة العسل والفوائد
        </button>
      </section>

    </div>
  );
}
