"use client";

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  HeartPulse, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  X,
  Activity,
  Layers,
  Thermometer
} from 'lucide-react';

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
  const [activeTypeId, setActiveTypeId] = useState<string>('type-sidr-doani');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchHoneyTypes();
      if (selectedHoneyTypeId) {
        setActiveTypeId(selectedHoneyTypeId);
      }
    }
  }, [isOpen, selectedHoneyTypeId]);

  const fetchHoneyTypes = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/marketplace/honey-types');
      if (res.ok) {
        const data = await res.json();
        setHoneyTypes(data.honeyTypes || []);
        if (data.honeyTypes?.length > 0 && !selectedHoneyTypeId) {
          setActiveTypeId(data.honeyTypes[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching encyclopedia:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentType = honeyTypes.find((t) => t.id === activeTypeId) || honeyTypes[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel border border-amber-500/40 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg sm:text-xl">
                موسوعة العسل اليمني والدليل العلاجي الشامل
              </h3>
              <p className="text-xs text-slate-400">
                الخصائص الكيميائية المخبرية، الخرائط الجغرافية، والفوائد الطبية لكل نوع
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">جاري تحميل الموسوعة العلمية...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Sidebar Types List (Cols 4) */}
            <div className="md:col-span-4 space-y-2 border-b md:border-b-0 md:border-l border-slate-800 pb-4 md:pb-0 md:pl-4">
              <span className="text-xs font-bold text-slate-400 block mb-2">اختر نوع العسل:</span>
              <div className="space-y-1.5">
                {honeyTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTypeId(t.id)}
                    className={`w-full text-right p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between border ${
                      activeTypeId === t.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                        : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>{t.nameAr}</span>
                    <span className="text-[10px] opacity-75 font-normal">اليمن</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type Detail Card (Cols 8) */}
            {currentType && (
              <div className="md:col-span-8 space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>الموطن والمنطقة: {currentType.region}</span>
                  </div>
                  <h4 className="text-2xl font-black text-white">{currentType.nameAr}</h4>
                  <span className="text-xs text-slate-400 font-mono">{currentType.nameEn}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  {currentType.description}
                </p>

                {/* Treated Diseases & Benefits */}
                <div className="space-y-2.5">
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-amber-400" />
                    <span>الأمراض التي يعالجها والفوائد الصحية المثبتة مخبرياً:</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentType.therapeuticBenefits?.map((b: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chemical Standard Characteristics */}
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span>المعايير الكيميائية القياسية لهذا النوع (مختبر الـ JMAC):</span>
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">الفركتوز:</span>
                      <span className="font-bold text-amber-400">{currentType.standardCharacteristics?.fructose}%</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">الجلوكوز:</span>
                      <span className="font-bold text-amber-400">{currentType.standardCharacteristics?.glucose}%</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">الرطوبة:</span>
                      <span className="font-bold text-emerald-400">{currentType.standardCharacteristics?.moisture}%</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">الكثافة:</span>
                      <span className="font-bold text-purple-400">{currentType.standardCharacteristics?.density} g/cm³</span>
                    </div>
                  </div>
                </div>

                {/* Recommended Medical Usage */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-400 block">طريقة الاستخدام العلاجية الموصى بها:</span>
                  <div className="space-y-1 text-xs text-slate-300">
                    {currentType.recommendedUses?.map((u: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>{u}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
