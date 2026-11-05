"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Play, 
  FlaskConical, 
  ShieldCheck, 
  AlertTriangle, 
  Waves, 
  Activity, 
  Thermometer, 
  Gauge, 
  Wind, 
  SunMedium, 
  QrCode, 
  FileText, 
  Download, 
  ArrowRight,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LabScannerViewProps {
  onScanCompletedNavigateToMerchant?: (sample: any) => void;
  onVerifyGeneratedBarcode?: (barcode: string) => void;
}

export default function LabScannerView({
  onScanCompletedNavigateToMerchant,
  onVerifyGeneratedBarcode,
}: LabScannerViewProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [batchNumber, setBatchNumber] = useState(`BCH-DOANI-${Math.floor(1000 + Math.random() * 9000)}`);
  const [honeyType, setHoneyType] = useState('Sidr Doani');
  const [originRegion, setOriginRegion] = useState('وادي دوعن، حضرموت');
  const [selectedShopId, setSelectedShopId] = useState('shop-1');
  const [isSimulatedAdulterated, setIsSimulatedAdulterated] = useState(false);

  const [scanStatus, setScanStatus] = useState<'IDLE' | 'SCANNING' | 'COMPLETE' | 'ERROR'>('IDLE');
  const [progress, setProgress] = useState<{ stage: string; stageEn?: string; percent: number }>({
    stage: 'جاهز لبدء الفحص المخبري',
    percent: 0,
  });

  const [sensorData, setSensorData] = useState<{
    nir?: number[];
    vis?: number[];
    thermal?: number[][];
    density?: number;
    voc?: number;
    uv?: { uva: number; uvb: number; hmfIndex: number };
  }>({});

  const [scanResult, setScanResult] = useState<any>(null);

  useEffect(() => {
    const s = io('http://localhost:3001');
    setSocket(s);

    s.on('connect', () => {
      console.log('Connected to JMAC hardware WebSocket backend');
    });

    s.on('scan_progress', (data) => {
      setProgress(data);
    });

    s.on('scan_data', (data) => {
      setSensorData((prev) => ({
        ...prev,
        [data.type]: data.data,
      }));
    });

    s.on('scan_complete', (data) => {
      setScanStatus('COMPLETE');
      setScanResult(data);
    });

    s.on('scan_error', (data) => {
      setScanStatus('ERROR');
      console.error(data.message);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const handleStartScan = () => {
    if (!socket || scanStatus === 'SCANNING') return;

    setScanStatus('SCANNING');
    setProgress({ stage: 'تهيئة الغرفة المظلمة المعزولة', percent: 5 });
    setSensorData({});
    setScanResult(null);

    socket.emit('start_scan', {
      batchNumber,
      honeyType,
      originRegion,
      shopId: selectedShopId,
      isSimulatedAdulterated,
    });
  };

  const nirChartData = useMemo(() => {
    if (!sensorData.nir) return [];
    return sensorData.nir.map((val: number, i: number) => ({
      wavelength: 1350 + i * ((2500 - 1350) / 100),
      absorbance: val,
    }));
  }, [sensorData.nir]);

  const visChartData = useMemo(() => {
    if (!sensorData.vis) return [];
    return sensorData.vis.map((val: number, i: number) => ({
      channel: `Ch ${i + 1}`,
      intensity: val,
    }));
  }, [sensorData.vis]);

  return (
    <div className="space-y-8">
      
      {/* Lab Station Header */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4 text-center sm:text-right">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg honey-glow">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                محطة الفحص المخبري الصناعية (Dark Chamber JMAC)
              </h2>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                6 مستشعرات متزامنة
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              فحص استقطابي كامل للأشعة تحت الحمراء NIR (1350-2500 nm)، البصمة الضوئية، الكثافة، والأنف الإلكتروني بنقاء 100%.
            </p>
          </div>
        </div>

        {/* Hardware Status Tag */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-2xl border border-slate-700">
          <span className={`w-3 h-3 rounded-full ${socket?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-slate-300 font-semibold">
            {socket?.connected ? 'متحكم JMAC & المتحكمات متصلة' : 'جاري الاتصال بوحدة الـ Hardware'}
          </span>
        </div>
      </section>

      {/* Main Grid: Control Panel (Left) & Live Multi-Sensor Telemetry (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Control Panel (Cols 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
              <Play className="w-4 h-4 text-amber-400" />
              <span>إعدادات العينة وتجهيز الفحص</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">رقم دفعة العينة (Batch Number):</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  disabled={scanStatus === 'SCANNING'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">نوع العسل المراد تحليله:</label>
                <select
                  value={honeyType}
                  onChange={(e) => {
                    setHoneyType(e.target.value);
                    if (e.target.value.includes('Doani')) setOriginRegion('وادي دوعن، حضرموت');
                    else if (e.target.value.includes('Osaimi')) setOriginRegion('جبال العصيمات، عمران');
                    else if (e.target.value.includes('Samr')) setOriginRegion('وادي جردان، شبوة');
                    else if (e.target.value.includes('Salam')) setOriginRegion('سهل تهامة، الحديدة');
                    else setOriginRegion('المرتفعات الجبلية');
                  }}
                  disabled={scanStatus === 'SCANNING'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Sidr Doani">عسل سدر دوعني ملكي (حضرموت)</option>
                  <option value="Sidr Osaimi">عسل سدر عصيمي فاخر (عمران)</option>
                  <option value="Samr Hadrami">عسل سمر حضرمي نقي (شبوة/حضرموت)</option>
                  <option value="Salam Tihama">عسل سلام تهامي صافي (تهامة)</option>
                  <option value="Wild Mountain Marai">عسل مراعي جبلي طبيعي</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">المنطقة الجغرافية للمنحل:</label>
                <input
                  type="text"
                  value={originRegion}
                  onChange={(e) => setOriginRegion(e.target.value)}
                  disabled={scanStatus === 'SCANNING'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">المحل / المورد المستفيد:</label>
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  disabled={scanStatus === 'SCANNING'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="shop-1">مناحل وادي دوعن الملكية</option>
                  <option value="shop-2">متجر عسل العصيمي الفاخر</option>
                  <option value="shop-3">مناحل إكسير جردان للسمر والسدر</option>
                  <option value="shop-4">واحة تهامة للعسل الشوكي والسلام</option>
                </select>
              </div>

              {/* Simulation Mode Toggle (Adulteration Test) */}
              <div className="pt-2">
                <label className="flex items-center gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:border-amber-500/40 transition-all">
                  <input
                    type="checkbox"
                    checked={isSimulatedAdulterated}
                    onChange={(e) => setIsSimulatedAdulterated(e.target.checked)}
                    disabled={scanStatus === 'SCANNING'}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-amber-300 block">اختبار كشف عينة مغشوشة (Adulterated Test)</span>
                    <span className="text-[10px] text-slate-400 block">
                      محاكاة إضافة شراب الذرة أو السكر الصناعي واختبار رفض النظام الآلي
                    </span>
                  </div>
                </label>
              </div>

              {/* Scan Trigger Button */}
              <button
                onClick={handleStartScan}
                disabled={scanStatus === 'SCANNING'}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-xl shadow-amber-500/20 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{scanStatus === 'SCANNING' ? 'جاري الفحص الميكانيكي والطيفي...' : 'بدء تسلسل الفحص في الغرفة المظلمة'}</span>
              </button>
            </div>

            {/* Live Progress Indicator */}
            {scanStatus === 'SCANNING' && (
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-400 font-bold">{progress.stage}</span>
                  <span className="text-white font-mono">{progress.percent}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-700 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-300 h-3 rounded-full transition-all duration-300 relative"
                    style={{ width: `${progress.percent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Scan Complete / AI Verdict Summary */}
            {scanStatus === 'COMPLETE' && scanResult && (
              <div className="p-5 bg-slate-900/90 rounded-2xl border border-emerald-500/40 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  {scanResult.isPure ? (
                    <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                  )}
                  <div>
                    <span className="text-[11px] text-slate-400 block">قرار الذكاء الاصطناعي (CNN 100%):</span>
                    <span className={`text-base font-black ${scanResult.isPure ? 'text-emerald-400' : 'text-red-400'}`}>
                      {scanResult.classification}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1 pt-1 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span>درجة النقاء:</span>
                    <span className="font-bold text-emerald-400">{scanResult.qualityScore.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الباركود المولّد:</span>
                    <span className="font-mono text-amber-400 font-bold">{scanResult.barcode}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href={`http://localhost:3001${scanResult.pdfUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-amber-500/30"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل تقرير الفحص PDF</span>
                  </a>

                  {onVerifyGeneratedBarcode && (
                    <button
                      onClick={() => onVerifyGeneratedBarcode(scanResult.barcode)}
                      className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/40"
                    >
                      عرض الشهادة الرسمية وكود الـ QR
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Multi-Sensor Telemetry (Cols 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Sensor 1: NeoSpectra FT-IR NIR Spectral Curve (1350-2500 nm) */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Waves className="w-4 h-4 text-amber-400" />
                <span>مستشعر NeoSpectra Micro (FT-IR NIR 1350 - 2500 nm) - كشف السكريات والـ HFCS</span>
              </h4>
              <span className="text-[11px] text-amber-400/90 font-mono">MEMS FT-IR</span>
            </div>

            <div className="h-56 w-full">
              {nirChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={nirChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="wavelength"
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(v) => `${v.toFixed(0)}nm`}
                    />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(val: number) => [`${val.toFixed(2)} A.U.`, 'الامتصاص الطيفي']}
                    />
                    <Line type="monotone" dataKey="absorbance" stroke="#f59e0b" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-2xl">
                  في انتظار بدء تسلسل الفحص الطيفي بالأشعة تحت الحمراء...
                </div>
              )}
            </div>
          </div>

          {/* Sensors 2 & 3: VIS Spectrum 11-Channel & MLX90640 Thermal Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* VIS Spectrum (11 Channels) */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>طيف الألوان AS7341 (11 قناة لونية)</span>
                </h4>
                <span className="text-[10px] text-blue-400 font-mono">Visible Band</span>
              </div>

              <div className="h-44 w-full">
                {visChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visChartData}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                      <XAxis dataKey="channel" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px' }} />
                      <Line type="stepAfter" dataKey="intensity" stroke="#38bdf8" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-xl">
                    في انتظار بيانات AS7341...
                  </div>
                )}
              </div>
            </div>

            {/* MLX90640 Thermal Matrix (32x24) */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-red-400" />
                  <span>المصفوفة الحرارية MLX90640 (32x24)</span>
                </h4>
                <span className="text-[10px] text-red-400 font-mono">Heatmap</span>
              </div>

              <div className="h-44 w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                {sensorData.thermal ? (
                  <div
                    className="w-full h-full grid"
                    style={{
                      gridTemplateColumns: `repeat(32, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(24, minmax(0, 1fr))`,
                    }}
                  >
                    {sensorData.thermal.map((row: number[], y: number) =>
                      row.map((temp: number, x: number) => {
                        const norm = Math.max(0, Math.min(1, (temp - 24.5) / 2.5));
                        const r = Math.floor(norm * 240);
                        const b = Math.floor((1 - norm) * 220);
                        return (
                          <div
                            key={`${x}-${y}`}
                            style={{ backgroundColor: `rgb(${r}, 40, ${b})` }}
                            className="w-full h-full"
                            title={`T: ${temp.toFixed(1)}°C`}
                          />
                        );
                      })
                    )}
                  </div>
                ) : (
                  <span className="text-slate-500 text-xs font-mono">في انتظار قراءة مصفوفة الكاميرا الحرارية...</span>
                )}
              </div>
            </div>

          </div>

          {/* Sensors 4, 5, 6: Load Cell HX711, VOC BME688, UV VEML6075 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Density & Load Cell */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-purple-400" />
                <span>ميزان الكثافة HX711:</span>
              </span>
              <span className="text-2xl font-black text-purple-400 font-mono">
                {sensorData.density ? `${sensorData.density} g/cm³` : '---'}
              </span>
              <span className="text-[10px] text-slate-500 block">دقة 0.01 جرام مخبرية</span>
            </div>

            {/* VOC Electronic Nose */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
                <span>الأنف الإلكتروني VOCs:</span>
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {sensorData.voc ? `${sensorData.voc} pts` : '---'}
              </span>
              <span className="text-[10px] text-slate-500 block">Bosch BME688 / SGP40</span>
            </div>

            {/* VEML6075 UV/HMF Index */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                <span>تحليل HMF بالأشعة UV:</span>
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {sensorData.uv ? `${sensorData.uv.hmfIndex} mg/kg` : '---'}
              </span>
              <span className="text-[10px] text-slate-500 block">VEML6075 Dual 16-bit</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
