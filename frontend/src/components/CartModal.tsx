"use client";

import { API_BASE_URL } from '@/lib/api';
import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  Truck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface CartItem {
  product: any;
  quantity: number;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onVerifyBarcode?: (barcode: string) => void;
}

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onVerifyBarcode,
}: CartModalProps) {
  const [customerName, setCustomerName] = useState('سالم الكندي');
  const [customerPhone, setCustomerPhone] = useState('+967 771 234 567');
  const [customerCity, setCustomerCity] = useState('صنعاء');
  const [deliveryAddress, setDeliveryAddress] = useState('شارع الستين - جوار مجمع النخبة');
  const [loading, setLoading] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<any>(null);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    try {
      setLoading(true);
      const itemsPayload = cartItems.map((it) => ({
        productId: it.product.id,
        productName: it.product.nameAr,
        honeyType: it.product.honeyTypeId,
        quantity: it.quantity,
        unitPrice: it.product.price,
        barcode: it.product.barcode,
      }));

      const res = await fetch(API_BASE_URL + '/api/marketplace/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail: 'customer@honey.io',
          city: customerCity,
          deliveryAddress,
          items: itemsPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderConfirmation(data.order);
        onClearCart();
      }
    } catch (err) {
      console.error('Error placing order:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel border border-amber-500/40 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">سلة شراء العسل الموثق</h3>
              <p className="text-xs text-slate-400">عبوات أصلية 100% مصحوبة بشهادة الفحص المخبري</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        {orderConfirmation ? (
          /* Order Confirmed Screen */
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h4 className="text-2xl font-black text-white">تم تأكيد طلبك بنجاح!</h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              تم حجز العبوات المفحوصة والمختومة مخبرياً بنقاء 100%، ويجري تجهيزها للشحن إلى {orderConfirmation.deliveryAddress} ({orderConfirmation.city}).
            </p>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 max-w-md mx-auto text-xs space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-slate-400">رقم الطلب:</span>
                <span className="font-mono text-amber-400 font-bold">{orderConfirmation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المبلغ الإجمالي:</span>
                <span className="font-bold text-white text-sm">{orderConfirmation.totalAmount} $</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المستلم:</span>
                <span className="text-white">{orderConfirmation.customerName} ({orderConfirmation.customerPhone})</span>
              </div>
            </div>

            <button
              onClick={() => {
                setOrderConfirmation(null);
                onClose();
              }}
              className="mt-4 px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-2xl text-xs"
            >
              متابعة التسوق في المتجر
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-12 space-y-3">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-600" />
            <p className="text-slate-400 text-sm">سلة المشتريات فارغة حالياً.</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold"
            >
              تصفح أنواع العسل المتاحة
            </button>
          </div>
        ) : (
          /* Cart Items List & Checkout Form */
          <div className="space-y-6">
            
            {/* Items List */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.nameAr}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-white text-xs line-clamp-1">{item.product.nameAr}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-amber-300 font-semibold">{item.product.shopName}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">{item.product.barcode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs text-white px-1.5">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-left w-16">
                      <span className="font-black text-amber-400 text-xs block">
                        {item.product.price * item.quantity} $
                      </span>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">المجموع النهائي للطلب:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-400">{totalAmount}</span>
                <span className="font-bold text-slate-300">USD</span>
              </div>
            </div>

            {/* Customer Details Form */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs pt-2 border-t border-slate-800">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>بيانات الشحن والتسليم المباشر:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">اسم المشتري الكريم:</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">رقم الهاتف / الواتساب:</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">المدينة / المحافظة:</label>
                  <input
                    type="text"
                    required
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">عنوان التوصيل التفصيلي:</label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  متابعة التسوق
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-xl shadow-amber-500/20 disabled:opacity-50"
                >
                  {loading ? 'جاري تأكيد الطلب...' : 'تأكيد الشراء الفوري (نقاء 100%)'}
                </button>
              </div>
            </form>

          </div>
        )}

      </div>
    </div>
  );
}
