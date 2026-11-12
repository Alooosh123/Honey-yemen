"use client";

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Play, FlaskConical, Wifi, WifiOff, AlertTriangle, FileText, Thermometer, Sun, Palette } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface LabScannerViewProps {
  onScanCompletedNavigateToMerchant?: (sample: any) => void;
  onVerifyGeneratedBarcode?: (barcode: string) => void;
}

interface RawReadings {
  color?: { r: number; g: number; b: number };
  uv?: { raw: number; unit: string };
  ir?: { temperatureC: number };
}

export default function LabScannerView({
  onVerifyGeneratedBarcode,
}: LabScannerViewProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [batchNumber, setBatchNumber] = useState('BCH-' + new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 12));
  const [honeyType, setHoneyType] = useState('غير محدد');
  const [originRegion, setOriginRegion] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'COMPLETE' | 'ERROR'>('IDLE');
  const [progress, setProgress] = useState({ stage: 'جاهز لبدء قراءة الحساسات', percent: 0 });
  const [readings, setReadings] = useState<RawReadings>({});
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const client = io(API_BASE_URL, { transports: ['websocket', 'polling'] });
    setSocket(client);
    client.on('connect', () => setConnected(true));
    client.on('disconnect', () => setConnected(false));
    client.on('connect_error', () => setConnected(false));
    client.on('scan_progress', (data) => setProgress(data));
    client.on('scan_data', (data) => {
      setReadings((previous) => ({ ...previous, [data.type]: data.data }));
    });
    client.on('scan_warning', (data) => setError(data.message || 'تحذير من وسيط الحساسات'));
    client.on('scan_complete', (data) => {
      setStatus('COMPLETE');
      setResult(data);
      setError('');
      setProgress({ stage: 'اكتملت قراءة الحساسات وحُفظ التقرير الفني', percent: 100 });
    });
    client.on('scan_error', (data) => {
      setStatus('ERROR');
      setError(data.message || 'تعذر إكمال قراءة الحساسات');
    });

    return () => {
      client.removeAllListeners();
      client.disconnect();
    };
  }, []);

  const startScan = () => {
    const batch = batchNumber.trim();
    if (!socket?.connected || status === 'SCANNING' || !batch) return;
    setReadings({});
    setResult(null);
    setError('');
    setStatus('SCANNING');
    setProgress({ stage: 'إرسال أمر البدء إلى Arduino', percent: 5 });
    socket.emit('start_scan', {
      batchNumber: batch,
      honeyType: honeyType.trim() || 'غير محدد',
      originRegion: originRegion.trim() || 'غير محدد',
    });
  };

  const raw = result?.rawReadings as RawReadings | undefined;
  const shown = raw || readings;
  const completed = status === 'COMPLETE' && Boolean(result);

  return (
    <div className="space-y-6" dir="rtl">
      <section className="glass-panel rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <FlaskConical className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">محطة قراءة جهاز العسل</h2>
              <p className="text-xs text-slate-400 mt-1">TCS34725 · GY-ML8511 · GY-906 / MLX90614</p>
            </div>
          </div>
          <div className={'flex items-center gap-2 rounded-xl px-4 py-2 border ' + (connected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300')}>
            {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-xs font-bold">{connected ? 'الخادم متصل' : 'الخادم غير متصل'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-7">
          <label className="text-xs text-slate-300 space-y-2">
            <span className="block font-bold">رقم دفعة العينة</span>
            <input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} disabled={status === 'SCANNING'} className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-3 text-white" maxLength={80} />
          </label>
          <label className="text-xs text-slate-300 space-y-2">
            <span className="block font-bold">نوع العسل المُدخل (غير مكتشف آلياً)</span>
            <input value={honeyType} onChange={(e) => setHoneyType(e.target.value)} disabled={status === 'SCANNING'} className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-3 text-white" />
          </label>
          <label className="text-xs text-slate-300 space-y-2">
            <span className="block font-bold">منطقة المنشأ المُدخلة</span>
            <input value={originRegion} onChange={(e) => setOriginRegion(e.target.value)} disabled={status === 'SCANNING'} className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-3 text-white" placeholder="مثال: وادي دوعن، حضرموت" />
          </label>
        </div>

        <button onClick={startScan} disabled={!connected || status === 'SCANNING' || !batchNumber.trim()} className="mt-6 w-full sm:w-auto rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black px-7 py-3.5 flex items-center justify-center gap-2">
          <Play className="w-4 h-4" />
          {status === 'SCANNING' ? 'جاري جمع القراءات الفعلية...' : 'بدء قراءة الحساسات'}
        </button>

        {status === 'SCANNING' && (
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>{progress.stage}</span><span>{progress.percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
              <div className="h-full bg-amber-500 transition-all" style={{ width: progress.percent + '%' }} />
            </div>
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />{error}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-300"><Palette className="w-5 h-5" /><span className="font-bold text-sm">TCS34725 — RGB خام</span></div>
          <div className="h-20 rounded-xl border border-slate-700" style={{ backgroundColor: shown.color ? 'rgb(' + Math.min(255, shown.color.r) + ',' + Math.min(255, shown.color.g) + ',' + Math.min(255, shown.color.b) + ')' : '#0f172a' }} />
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950 rounded-lg p-2"><span className="text-slate-500 block">R</span><b className="text-white font-mono">{shown.color?.r ?? '—'}</b></div>
            <div className="bg-slate-950 rounded-lg p-2"><span className="text-slate-500 block">G</span><b className="text-white font-mono">{shown.color?.g ?? '—'}</b></div>
            <div className="bg-slate-950 rounded-lg p-2"><span className="text-slate-500 block">B</span><b className="text-white font-mono">{shown.color?.b ?? '—'}</b></div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-300"><Sun className="w-5 h-5" /><span className="font-bold text-sm">GY-ML8511 — UV</span></div>
          <div className="text-3xl font-black font-mono text-white">{shown.uv?.raw ?? '—'}</div>
          <p className="text-xs text-slate-400">القيمة الخام: {shown.uv?.unit || 'لم تصل قراءة بعد'}</p>
          <p className="text-[11px] text-slate-500">لا تُعرض كطول موجي أو HMF قبل المعايرة والتحويل المعتمد.</p>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-300"><Thermometer className="w-5 h-5" /><span className="font-bold text-sm">GY-906 / MLX90614 — IR</span></div>
          <div className="text-3xl font-black font-mono text-white">{shown.ir ? shown.ir.temperatureC.toFixed(2) + ' °C' : '—'}</div>
          <p className="text-xs text-slate-400">درجة حرارة الجسم المقاسة دون تلامس.</p>
        </div>
      </section>

      {completed && (
        <section className="glass-panel rounded-2xl border border-amber-500/30 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-black"><FileText className="w-5 h-5" />تم حفظ سجل القياسات</div>
          <p className="text-sm text-white">الباركود: <span className="font-mono text-amber-300">{result.barcode}</span></p>
          <p className="text-sm text-slate-300">حالة التقييم: لم يتم تقييم أصالة العسل. هذا سجل قياسات خام وليس شهادة نقاء.</p>
          <p className="text-xs text-slate-400">{result.notes}</p>
          <a className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-amber-300" href={API_BASE_URL + result.pdfUrl} target="_blank" rel="noreferrer">
            <FileText className="w-4 h-4" />فتح تقرير القياسات
          </a>
          {onVerifyGeneratedBarcode && <button onClick={() => onVerifyGeneratedBarcode(result.barcode)} className="mr-2 text-sm text-amber-300 underline">فتح سجل التحقق</button>}
        </section>
      )}
    </div>
  );
}
