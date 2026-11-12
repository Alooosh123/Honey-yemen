import { randomUUID } from 'crypto';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import QRCode from 'qrcode';
import { HardwareService } from '../services/hardware.service';
import { AIService } from '../services/ai.service';
import { PDFService } from '../services/pdf.service';
import { dbStore, HoneySampleRecord } from '../db/store';
import { measurementRepository } from '../db/measurement.repository';

export let io: Server;
const aiService = new AIService();
const pdfService = new PDFService();
const activeScans = new Set<string>();
let hardwareScanInProgress = false;

export const setupWebSockets = (server: HttpServer) => {
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log('[Socket] Client connected: ' + socket.id);

    socket.on('start_scan', async (data) => {
      if (activeScans.has(socket.id)) {
        socket.emit('scan_error', { message: 'يوجد فحص قيد التنفيذ لهذه الجلسة بالفعل.' });
        return;
      }

      if (hardwareScanInProgress) {
        socket.emit('scan_error', { message: 'منفذ Arduino مشغول بفحص آخر. انتظر انتهاء الفحص الحالي.' });
        return;
      }

      const batchNumber = String(data?.batchNumber || '').trim();
      if (!batchNumber || batchNumber.length > 80) {
        socket.emit('scan_error', { message: 'رقم الدفعة مطلوب ويجب ألا يتجاوز 80 حرفاً.' });
        return;
      }

      activeScans.add(socket.id);
      hardwareScanInProgress = true;

      const honeyType = String(data?.honeyType || 'غير محدد');
      const shopId = String(data?.shopId || '');
      const shop = shopId ? dbStore.getShopById(shopId) : undefined;
      const shopName = shop?.name || String(data?.shopName || 'غير محدد');
      const originRegion = String(data?.originRegion || shop?.region || 'غير محدد');
      const sampleId = 'sample-' + randomUUID();
      const barcode = 'HNY-' + randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();

      try {
        if (!(await measurementRepository.isAvailable())) {
          throw new Error('PostgreSQL is not ready. The scan was not started to avoid losing physical sensor measurements.');
        }

        const hardwareService = new HardwareService();
        const readings = await hardwareService.acquireScan(socket, {
          batchNumber,
          honeyType,
          originRegion,
          shopId,
          shopName,
        });

        socket.emit('scan_progress', {
          stage: 'اكتملت قراءة الحساسات الثلاثة؛ لم يصدر حكم أصالة',
          stageEn: 'Raw sensor acquisition completed; authenticity not evaluated',
          percent: 90,
        });

        const assessment = await aiService.predict(readings);
        const appUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
        const verificationUrl = appUrl + '/verify?code=' + encodeURIComponent(barcode);
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { width: 220, margin: 1 });

        const sampleRecord: HoneySampleRecord = {
          id: sampleId,
          batchNumber,
          barcode,
          qrCodeDataUrl,
          honeyType,
          honeyTypeNameAr: assessment.honeyTypeNameAr,
          originRegion,
          shopId,
          shopName,
          testedAt: new Date().toISOString(),
          operatorName: String(data?.operatorName || 'مشغل الجهاز'),
          analysisStatus: 'NOT_EVALUATED',
          classification: assessment.classification,
          confidence: null,
          qualityScore: null,
          isPure: null,
          chemicalAnalysis: {
            fructose: null,
            glucose: null,
            sucrose: null,
            moisture: null,
            hmf: null,
            density: null,
            vocIndex: null,
            colorSpectrumChannels: [readings.color.r, readings.color.g, readings.color.b],
            nirPeakAbsorbance: null,
          },
          sensorData: {
            nirSummary: { points: 0, minWl: 0, maxWl: 0 },
            vis11Channels: [],
            uvResponse: { uva: null, uvb: null, hmfIndex: null },
            thermalAverage: null,
            densityValue: null,
            vocGasLevel: null,
            rawReadings: readings,
          },
        };

        const pdfUrl = await pdfService.generateReport(sampleRecord);
        sampleRecord.pdfUrl = pdfUrl;
        await measurementRepository.create(sampleRecord);

        socket.emit('scan_progress', {
          stage: 'تم حفظ سجل القياسات والتقرير الفني',
          stageEn: 'Measurement record and technical report saved',
          percent: 100,
        });
        socket.emit('scan_complete', {
          message: 'تم جمع قراءات RGB وUV ودرجة حرارة IR الفعلية. لم يتم تقييم نقاء العسل.',
          sampleId,
          barcode,
          qrCodeDataUrl,
          analysisStatus: assessment.analysisStatus,
          classification: assessment.classification,
          honeyTypeNameAr: assessment.honeyTypeNameAr,
          confidence: null,
          qualityScore: null,
          isPure: null,
          notes: assessment.notes,
          rawReadings: readings,
          pdfUrl,
          sampleRecord,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown hardware acquisition error';
        console.error('[Socket] Scan error: ' + message);
        socket.emit('scan_error', { message });
      } finally {
        activeScans.delete(socket.id);
        hardwareScanInProgress = false;
      }
    });

    socket.on('disconnect', () => {
      activeScans.delete(socket.id);
      console.log('[Socket] Client disconnected: ' + socket.id);
    });
  });
};
