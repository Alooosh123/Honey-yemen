"use client";

import React, { useEffect, useState } from 'react';
import { BookOpen, MapPin, X, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface HoneyEncyclopediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHoneyTypeId?: string;
}

export default function HoneyEncyclopediaModal({
  isOpen,
  onClose,
  selectedHoneyTypeId,
}: HoneyEncyclopediaModalProps) {
  const [honeyTypes, setHoneyTypes] = useState<any[]>([]);
  const [activeTypeId, setActiveTypeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const loadTypes = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(API_BASE_URL + '/api/marketplace/honey-types');
        if (!response.ok) throw new Error('تعذر تحميل أنواع العسل.');
        const data = await response.json();
        if (cancelled) return;
        const types = Array.isArray(data.honeyTypes) ? data.honeyTypes : [];
        setHoneyTypes(types);
        setActiveTypeId(
          (selectedHoneyTypeId && types.some((item: any) => item.id === selectedHoneyTypeId))
            ? selectedHoneyTypeId
            : (types[0]?.id || '')
        );
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحميل.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadTypes();
    return () => { cancelled = true; };
  }, [isOpen, selectedHoneyTypeId]);

  if (!isOpen) return null;
  const currentType = honeyTypes.find((item) => item.id === activeTypeId);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <div className="glass-panel border border-amber-500/40 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">معلومات تعريفية عن أنواع العسل اليمني</h3>
              <p className="text-xs text-slate-400">وصف عام ومناطق اشتهار، وليس تصنيفاً مخبرياً</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold p-1" aria-label="إغلاق">✕</button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">جاري تحميل المعلومات...</div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-red-500/30 text-red-200 bg-red-500/10">{error}</div>
        ) : honeyTypes.length === 0 ? (
          <div className="p-8 text-center text-slate-400">لا توجد بيانات تعريفية متاحة حالياً.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-4 space-y-2">
              {honeyTypes.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTypeId(item.id)}
                  className={'w-full text-right p-3 rounded-xl text-xs font-bold border ' + (
                    activeTypeId === item.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  )}
                >
                  {item.nameAr}
                </button>
              ))}
            </div>

            {currentType && (
              <div className="md:col-span-8 space-y-4">
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <MapPin className="w-4 h-4" />
                  <span>منطقة اشتهار مذكورة في البيانات: {currentType.region || 'غير محددة'}</span>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white">{currentType.nameAr}</h4>
                  <span className="text-xs text-slate-400 font-mono">{currentType.nameEn}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  {currentType.description}
                </p>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex gap-3 text-sm text-amber-100">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>هذه معلومات تعريفية وليست إثباتاً للمنشأ أو التركيب أو الأصالة. لا يقدم النظام حالياً ادعاءات بعلاج الأمراض أو نتائج كيميائية معتمدة.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
