"use client";

import React, { useState, useEffect } from 'react';
import { 
  Scan, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  Download, 
  ExternalLink, 
  Store, 
  CheckCircle2, 
  Sparkles, 
  Activity,
  Layers,
  Thermometer,
  QrCode,
  Calendar,
  User,
  HeartPulse
} from 'lucide-react';

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
  const [isCameraActive, setIsCameraActive] = useState(false);

  const sampleQuickCodes = [
    { label: 'سدر دوعني ملكي (حضرموت)', code: 'HONEY-DOANI-9821-CERT100' },
    { label: 'سدر عصيمي فاخر (عمران)', code: 'HONEY-OSAIMI-4402-CERT100' },
    { label: 'سمر جرداني (شبوة)', code: 'HONEY-SAMR-7719-CERT100' },
  ];

  useEffect(() => {
    if (initialBarcode) {
      setBarcodeInput(initialBarcode);
      verifyBarcode(initialBarcode);
    }
  }, [initialBarcode]);

  const verifyBarcode = async (codeToVerify: string) => {
    const code = codeToVerify.trim();
    if (!code) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setVerificationResult(null);

      const res = await fetch(`http://localhost:3001/api/scan/verify/${encodeURIComponent(code)}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        setVerificationResult(data);
      } else {
        setErrorMsg(data.message || 'لم يتم العثور على هذا الباركود في قاعدة بيانات الفحوصات المخبرية المعتمدة.');
      }
    } catch (err: any) {
      setErrorMsg('تعذر الاتصال بخادم التحقق المخبري. تأكد من تشغيل الخادم.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyBarcode(barcodeInput);
  };

  const simulateCameraScan = (code: string) => {
    setIsCameraActive(true);
    setTimeout(() => {
      setIsCameraActive(false);
      setBarcodeInput(code);
      verifyBarcode(code);
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Search & Scan Header */}
      <section className="glass-panel p-8 sm:p-10 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Scan className="w-4 h-4 text-amber-400" />
            <span>نظام المسح الضوئي والتحقق من باركود العسل</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white">
            تحقق فوري من <span className="honey-gradient-text">شهادة الفحص ونقاء العسل</span>
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm">
            وجّه كاميرا هاتفك نحو باركود عبوة العسل أو أدخل الرمز المطبوع على الملصق للاطلاع المباشر على نتائج فحص الـ 6 مستشعرات وتحميل شهادة الـ PDF المعتمدة.
          </p>
        </div>

        {/* Input Barcode Form */}
        <form onSubmit={handleFormSubmit} className="mt-8 max-w-2xl mx-auto space-y-4">
          <div className="relative flex items-center">
            <QrCode className="w-6 h-6 absolute right-4 text-amber-400 pointer-events-none" />
            <input
              type="text"
              placeholder="أدخل كود الباركود هنا (مثال: HONEY-DOANI-9821-CERT100)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl pr-14 pl-36 py-4 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm tracking-wide"
            />
            <button
              type="submit"
              disabled={loading || !barcodeInput.trim()}
              className="absolute left-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs transition-all disabled:opacity-50 shadow-md shadow-amber-500/20"
            >
              {loading ? 'جاري الفحص...' : 'فحص الكود'}
            </button>
          </div>

          {/* Quick Test Barcode Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-medium">أكواد تجريبية سريعة مفحوصة:</span>
            {sampleQuickCodes.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => simulateCameraScan(s.code)}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 rounded-lg transition-all text-[11px] font-mono flex items-center gap-1"
              >
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </form>

        {/* Simulated Camera Scanning Effect */}
        {isCameraActive && (
          <div className="mt-6 p-6 rounded-2xl bg-slate-950 border border-amber-500/50 max-w-md mx-auto text-center space-y-3 relative overflow-hidden">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-0 left-0 animate-bounce" />
            <div className="w-16 h-16 mx-auto rounded-full border-2 border-amber-400 border-t-transparent animate-spin flex items-center justify-center">
              <Scan className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-xs text-amber-300 font-bold">جاري مسح الباركود عبر الكاميرا والتعرف على الشهادة الرقمية...</p>
          </div>
        )}
      </section>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-5 glass-panel rounded-2xl border border-red-500/50 bg-red-950/20 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-red-300 text-sm">تنبيه: تعذر إثبات الشهادة</h4>
            <p className="text-xs text-red-200/90 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Verification Result Certificate Display */}
      {verificationResult && (
        <section className="glass-panel p-6 sm:p-10 rounded-3xl border border-emerald-500/40 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Certificate Official Header */}
          <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-right">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase block">
                  شهادة الفحص المخبري المعتمدة بنسبة نقاء 100%
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  {verificationResult.certificate.honeyTypeNameAr}
                </h3>
                <p className="text-xs text-slate-400">
                  كود الفحص المعتمد: <span className="font-mono text-amber-400">{verificationResult.certificate.barcode}</span>
                </p>
              </div>
            </div>

            {/* Download PDF Action */}
            <a
              href={`http://localhost:3001/api/scan/reports/${verificationResult.certificate.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-all shrink-0 transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تحميل شهادة الـ PDF الرسمية</span>
            </a>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">نسبة النقاء والجودة:</span>
              <span className="text-2xl font-black text-emerald-400">
                {verificationResult.certificate.qualityScore.toFixed(1)}%
              </span>
              <span className="text-[10px] text-emerald-500 block mt-0.5">مطابقة 100% للمواصفة</span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">نسبة الرطوبة:</span>
              <span className="text-2xl font-black text-amber-400">
                {verificationResult.certificate.chemicalAnalysis.moisture}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">المعيار: أقل من 18%</span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">مؤشر HMF (الحرارة والتخزين):</span>
              <span className="text-2xl font-black text-blue-400">
                {verificationResult.certificate.chemicalAnalysis.hmf} mg
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">طازج ونخب أول ممتاز</span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">الكثافة النوعية:</span>
              <span className="text-2xl font-black text-purple-400">
                {verificationResult.certificate.chemicalAnalysis.density}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">g/cm³ بميزان HX711</span>
            </div>
          </div>

          {/* Grid Layout: Chemical Analysis + QR Code and Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Chemical Analysis & Sensor Results */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>نتائج التحليل الكيميائي والطيفي المفصل:</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 px-3 font-semibold">المؤشر الكيميائي</th>
                        <th className="py-2 px-3 font-semibold">القيمة المقاسة</th>
                        <th className="py-2 px-3 font-semibold">المعيار المخبري</th>
                        <th className="py-2 px-3 font-semibold">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      <tr>
                        <td className="py-2.5 px-3 text-slate-300">نسبة الفركتوز (Fructose)</td>
                        <td className="py-2.5 px-3 text-amber-400 font-bold">{verificationResult.certificate.chemicalAnalysis.fructose}%</td>
                        <td className="py-2.5 px-3 text-slate-400">38% - 44%</td>
                        <td className="py-2.5 px-3 text-emerald-400">طبيعي ممتاز</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-slate-300">نسبة الجلوكوز (Glucose)</td>
                        <td className="py-2.5 px-3 text-amber-400 font-bold">{verificationResult.certificate.chemicalAnalysis.glucose}%</td>
                        <td className="py-2.5 px-3 text-slate-400">28% - 34%</td>
                        <td className="py-2.5 px-3 text-emerald-400">طبيعي ممتاز</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-slate-300">نسبة السكروز (Sucrose)</td>
                        <td className="py-2.5 px-3 text-amber-400 font-bold">{verificationResult.certificate.chemicalAnalysis.sucrose}%</td>
                        <td className="py-2.5 px-3 text-slate-400">أقل من 5% (لا سكر صناعي)</td>
                        <td className="py-2.5 px-3 text-emerald-400">نقي 100%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-slate-300">مؤشر الروائح العطرية (VOC Gas)</td>
                        <td className="py-2.5 px-3 text-amber-400 font-bold">{verificationResult.certificate.chemicalAnalysis.vocIndex} pts</td>
                        <td className="py-2.5 px-3 text-slate-400">&gt; 60 نقطة (أنف إلكتروني)</td>
                        <td className="py-2.5 px-3 text-emerald-400">بصمة أزهار نقية</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Therapeutic Benefits for this Verified Batch */}
              <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-amber-400" />
                  <span>الأمراض والاستخدامات الطبية المعتمدة لهذه العبوة:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {verificationResult.therapeuticBenefits.map((b: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Col: QR Code, Producer Shop & Official Stamp */}
            <div className="space-y-6">
              
              {/* QR Code Container */}
              <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 text-center space-y-4">
                <h4 className="font-bold text-white text-xs">كود الاستجابة السريعة (QR Code)</h4>
                
                {verificationResult.qrCodeDataUrl && (
                  <div className="bg-white p-3 rounded-2xl inline-block shadow-xl">
                    <img
                      src={verificationResult.qrCodeDataUrl}
                      alt="Verification QR Code"
                      className="w-36 h-36 mx-auto"
                    />
                  </div>
                )}
                
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  يمكن مسح هذا الكود بأي كاميرا هاتف ذكي للتحقق المباشر من صحة الشهادة وسلسلة التوريد.
                </p>
              </div>

              {/* Producer & Laboratory Details */}
              <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2">بيانات المنشأ والجهة الفاحصة</h4>
                
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">المنحل / المتجر:</span>
                    <span className="font-bold text-amber-300">{verificationResult.certificate.shopName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المنطقة الجغرافية:</span>
                    <span className="font-medium text-white">{verificationResult.certificate.originRegion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم الدفعة (Batch):</span>
                    <span className="font-mono text-white">{verificationResult.certificate.batchNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">تاريخ الفحص المخبري:</span>
                    <span className="text-white">{new Date(verificationResult.certificate.testedAt).toLocaleDateString('ar-YE')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الكيميائي المشرف:</span>
                    <span className="text-white font-medium">{verificationResult.certificate.operatorName}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ختم المختبر الرقمي مفعل
                  </span>
                  <span className="text-slate-500 font-mono">ISO/IEC 17025</span>
                </div>
              </div>

            </div>

          </div>

        </section>
      )}

    </div>
  );
}
