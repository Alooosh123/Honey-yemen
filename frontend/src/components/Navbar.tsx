"use client";

import React from 'react';
import { 
  ShoppingBag, 
  Scan, 
  FlaskConical, 
  Store, 
  ShieldCheck, 
  Layers, 
  UserCheck,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'marketplace' | 'scanner' | 'lab' | 'merchant' | 'saas';
  setActiveTab: (tab: 'marketplace' | 'scanner' | 'lab' | 'merchant' | 'saas') => void;
  cartCount: number;
  onOpenCart: () => void;
  currentRole: 'CUSTOMER' | 'MERCHANT' | 'LAB_TECHNICIAN' | 'ADMIN';
  setCurrentRole: (role: 'CUSTOMER' | 'MERCHANT' | 'LAB_TECHNICIAN' | 'ADMIN') => void;
  isSocketConnected: boolean;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  currentRole,
  setCurrentRole,
  isSocketConnected,
}: NavbarProps) {
  const roleNames: Record<string, { label: string; badge: string; color: string }> = {
    CUSTOMER: { label: 'مشتري / مستهلك', badge: 'عميل', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    MERCHANT: { label: 'تاجر / صاحب منحل', badge: 'متجر', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    LAB_TECHNICIAN: { label: 'كيميائي المختبر', badge: 'مختبر', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    ADMIN: { label: 'مالك المنصة (SaaS Admin)', badge: 'سوبر أدمن', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-amber-500/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & System Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('marketplace')}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg honey-glow">
              <span className="text-2xl">🍯</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold honey-gradient-text tracking-wide">
                  جَوْدَةُ العَسَلِ اليَمَنِي
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  v3.0 SaaS
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>المختبر الصناعي بنقاء 100% & السوق الذكي</span>
                <span className="inline-block w-1 h-1 rounded-full bg-amber-400"></span>
                <span className="text-[11px] text-amber-400/90 font-medium">Zero-Error Tolerance</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'marketplace'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>سوق العسل والفوائد</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'scanner'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>مسح الباركود والشهادة</span>
            </button>

            <button
              onClick={() => setActiveTab('lab')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'lab'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>المختبر وفحص الـ JMAC</span>
            </button>

            <button
              onClick={() => setActiveTab('merchant')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'merchant'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>لوحة المحلات</span>
            </button>

            <button
              onClick={() => setActiveTab('saas')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'saas'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>منصة SaaS المركزية</span>
            </button>
          </nav>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center gap-3">
            
            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-amber-500/50 text-slate-200 hover:text-amber-400 transition-all"
              title="سلة الشراء"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative group">
              <button className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${roleNames[currentRole].color} transition-all`}>
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{roleNames[currentRole].label}</span>
                <span className="sm:hidden">{roleNames[currentRole].badge}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              <div className="absolute left-0 mt-2 w-56 glass-panel rounded-2xl shadow-2xl p-2 border border-slate-700 hidden group-hover:block transition-all z-50">
                <p className="text-[11px] font-bold text-slate-400 px-3 py-1.5 border-b border-slate-700/60">
                  تبديل وضع المستخدم للتجربة:
                </p>
                <button
                  onClick={() => { setCurrentRole('CUSTOMER'); setActiveTab('marketplace'); }}
                  className="w-full text-right px-3 py-2 rounded-xl text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <span>مشتري (تصفح وشراء بالمرض)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">عميل</span>
                </button>
                <button
                  onClick={() => { setCurrentRole('MERCHANT'); setActiveTab('merchant'); }}
                  className="w-full text-right px-3 py-2 rounded-xl text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <span>تاجر (إدارة البضاعة والباركود)</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">متجر</span>
                </button>
                <button
                  onClick={() => { setCurrentRole('LAB_TECHNICIAN'); setActiveTab('lab'); }}
                  className="w-full text-right px-3 py-2 rounded-xl text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <span>فني المختبر (فحص الـ 6 مستشعرات)</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">مختبر</span>
                </button>
                <button
                  onClick={() => { setCurrentRole('ADMIN'); setActiveTab('saas'); }}
                  className="w-full text-right px-3 py-2 rounded-xl text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                >
                  <span>سوبر أدمن (إدارة الاشتراكات والظهور)</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">SaaS</span>
                </button>
              </div>
            </div>

            {/* Socket Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[11px] text-slate-400 hidden xl:inline">
                {isSocketConnected ? 'الأجهزة متصلة' : 'جاري الاتصال'}
              </span>
            </div>

          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-slate-800/80 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'marketplace' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
            }`}
          >
            السوق والأمراض
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'scanner' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
            }`}
          >
            مسح الباركود
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'lab' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
            }`}
          >
            المختبر
          </button>
          <button
            onClick={() => setActiveTab('merchant')}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'merchant' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
            }`}
          >
            لوحة المحل
          </button>
          <button
            onClick={() => setActiveTab('saas')}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'saas' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
            }`}
          >
            SaaS
          </button>
        </div>

      </div>
    </header>
  );
}
