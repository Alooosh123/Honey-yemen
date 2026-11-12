"use client";

import React, { useEffect, useState } from 'react';
import { Scan, AlertCircle, FileText, Download, QrCode, ShieldAlert, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface BarcodeVerifierViewProps {
  initialBarcode?: string;
  onClearInitialBarcode?: () => void;
}

export default function BarcodeVerifierView({
  initialBarcode,
  onClearInitialBarcode,
}: BarcodeVerifierViewProps) {
  const [barcodeInput, setBarcodeInput] = useState(initialBarcode || '');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialBarcode) {
      setBarcodeInput(initialBarcode);
      verifyBarcode(initialBarcode);
      onClearInitialBarcode?.();
    }
  }, [initialBarcode]);

  const verifyBarcode = async (value: string) => {
    const code = value.trim();
    if (!code) return;
    setLoading(true);
    setErrorMsg(null);
    setVerificationResult(null);
    try {
      const response = await fetch(API_BASE_URL + '/api/scan/verify/' + encodeURIComponent(code));
      const data = await response.json();
      if (response.ok && data.registered) {
        setVerificationResult(data);
      } else {
        setErrorMsg(data.message || 'لم يتم العثور على سجل لهذا الرمز.');
      }
    } catch {
      setErrorMsg('تعذر الاتصال بخادم السجلات. تحقق من تشغيل الخادم وإعداد عنوان API.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    verifyBarcode(barcodeInput);
  };

  const certificate = verificationResult?.certificate;
  const readings = certificate?.sensorData?.rawReadings;
  const status = certificate?.analysisStatus || 'DEMO';
  const isVerified = status === 'VERIFIED';

  return (
    <div className="space-y-7 max-w-5xl mx-auto" dir="rtl">
      <section className="glass-panel p-7 sm:p-9 rounded-3xl border border-amber-500/30 shadow-xl">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Scan className="w-4 h-4" />
            <span>البحث عن سجل قياس العسل</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">التحقق من سجل القياس</h2>
          <p className="text-sm text-slate-300">أدخل الرمز المطبوع لعرض سجل الجهاز. ظهور سجل في النظام لا يعني وحده ثبوت أصالة العسل.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <QrCode className="w-5 h-5 absolute right-4 text-amber-400 pointer-events-none" />
            <input
              type="text"
              placeholder="أدخل رمز القياس"
              value={barcodeInput}
              onChange={(event) => setBarcodeInput(event.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl pr-12 pl-32 py-4 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
            />
            <button
              type="submit"
              disabled={loading || !barcodeInput.trim()}
              className="absolute left-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs disabled:opacity-50"
            >
              {loading ? 'جارٍ البحث...' : 'بحث'}
            </button>
          </div>
        </form>
      </section>

      {errorMsg && (
        <div className="p-5 glass-panel rounded-2xl border border-red-500/50 bg-red-950/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-200">{errorMsg}</p>
        </div>
      )}

      {certificate && (
        <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className={'w-12 h-12 rounded-xl flex items-center justify-center ' + (isVerified ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300')}>
                {isVerified ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">سجل القياس {certificate.barcode}</h3>
                <p className={'text-xs font-bold mt-1 ' + (isVerified ? 'text-emerald-300' : 'text-amber-300')}>
                  {isVerified ? 'تم اعتماد التقييم' : status === 'DEMO' ? 'سجل تجريبي قديم — ليس إثباتاً مخبرياً' : 'تم تسجيل القراءات — الأصالة غير مقيمة'}
                </p>
              </div>
            </div>
            <a
              href={API_BASE_URL + '/api/scan/verify/' + encodeURIComponent(certificate.barcode) + '/pdf'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-xs font-bold text-amber-300"
            >
              <Download className="w-4 h-4" />تقرير القياس
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-slate-950 rounded-xl p-4"><span className="text-slate-500 text-xs block">رقم الدفعة</span><b className="text-white">{certificate.batchNumber}</b></div>
            <div className="bg-slate-950 rounded-xl p-4"><span className="text-slate-500 text-xs block">نوع العسل المُدخل</span><b className="text-white">{certificate.honeyType}</b></div>
            <div className="bg-slate-950 rounded-xl p-4"><span className="text-slate-500 text-xs block">وقت القياس</span><b className="text-white">{new Date(certificate.testedAt).toLocaleString()}</b></div>
          </div>

          {readings ? (
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">القراءات الخام المسجلة من الحساسات</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 rounded-xl p-4"><span className="text-slate-500 text-xs block">TCS34725 — RGB</span><b className="text-amber-300 font-mono">{readings.color.r} / {readings.color.g} / {readings.color.b}</b></div>
                <div className="bg-slate-950 rounded-xl p-4"><span className="text-slate-500 text-xs block">GY-ML8511 — UV</span><b className="text-amber-300 font-mono">{readings.uv.raw} ({readings.uv.unit})</b></div>
                <div className="bg-slate-950 rounded-xl p-4"><span className="text-slate-500 text-xs block">GY-906 — IR</span><b className="text-amber-300 font-mono">{Number(readings.ir.temperatureC).toFixed(2)} °C</b></div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              هذا سجل من بيانات العرض القديمة. القراءات المخزنة فيه ليست دليلاً على فحص فعلي، وتم إخفاء مؤشرات النقاء والكيمياء غير الموثقة.
            </div>
          )}

          <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-300">
            <b className="text-white block mb-1">حدود النتيجة</b>
            لا تصدر المنظومة حالياً حكماً على أصالة العسل أو نسب الفركتوز والجلوكوز والسكروز والرطوبة وHMF. يلزم تحليل مرجعي ومعايرة وتحقق علمي قبل اعتماد أي شهادة أصالة.
          </div>
        </section>
      )}
    </div>
  );
}
