import { randomUUID } from 'crypto';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import QRCode from 'qrcode';
import { HardwareService } from '../services/hardware.service';
import { AIService } from '../services/ai.service';
import { PDFService } from '../services/pdf.service';
import { dbStore, HoneySampleRecord } from '../db/store';

export let io: Server;
const aiService = new AIService();
const pdfService = new PDFService();

export const setupWebSockets = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('start_scan', async (data) => {
      const batchNumber = data?.batchNumber || `BCH-${Math.floor(1000 + Math.random() * 9000)}`;
      const honeyType = data?.honeyType || 'Sidr Doani';
      const shopId = data?.shopId || 'shop-1';
      const shop = dbStore.getShopById(shopId);
      const shopName = shop ? shop.name : (data?.shopName || 'مناحل وادي دوعن الملكية');
      const originRegion = data?.originRegion || (shop ? shop.region : 'وادي دوعن، حضرموت');
      const isSimulatedAdulterated = Boolean(data?.isSimulatedAdulterated);

      console.log(`[Socket] Received start_scan command for batch: ${batchNumber} (${honeyType})`);
      const sampleId = `sample-${randomUUID().slice(0, 8)}`;
      const barcode = `HONEY-${batchNumber.replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

      try {
        const hardwareService = new HardwareService();
        const sensorData = await hardwareService.simulateScanSequence(socket, {
          batchNumber,
          honeyType,
          originRegion,
          shopId,
          shopName,
          isSimulatedAdulterated,
        });

        socket.emit('scan_progress', { stage: 'تحليل البصمة الطيفية والكيميائية بالذكاء الاصطناعي', stageEn: 'AI Neural Inference', percent: 92 });
        const aiResult = await aiService.predict(sensorData);

        socket.emit('scan_progress', { stage: 'توليد الباركود وشهادة الفحص المخبرية الرقمية', stageEn: 'Generating Digital Certificate & QR Code', percent: 97 });

        // Generate QR code data URL for instant verification on phones
        const verifyUrl = `http://localhost:3000/verify?code=${encodeURIComponent(barcode)}`;
        const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { width: 220, margin: 1 });

        const sampleRecord: HoneySampleRecord = {
          id: sampleId,
          batchNumber,
          barcode,
          qrCodeDataUrl,
          honeyType,
          honeyTypeNameAr: aiResult.honeyTypeNameAr,
          originRegion,
          shopId,
          shopName,
          testedAt: new Date().toISOString(),
          operatorName: 'م. أحمد باصديق (كبير كيميائيي المختبر)',
          classification: aiResult.classification,
          confidence: aiResult.confidence,
          qualityScore: aiResult.qualityScore,
          isPure: aiResult.isPure,
          chemicalAnalysis: sensorData.chemicalAnalysis,
          sensorData: {
            nirSummary: { points: 100, minWl: 1350, maxWl: 2500 },
            vis11Channels: sensorData.visData,
            uvResponse: sensorData.uvData,
            thermalAverage: 25.4,
            densityValue: sensorData.density,
            vocGasLevel: sensorData.voc,
          },
        };

        const pdfUrl = await pdfService.generateReport(sampleRecord);
        sampleRecord.pdfUrl = pdfUrl;

        // Persist in local database store
        dbStore.addSample(sampleRecord);

        socket.emit('scan_complete', {
          message: 'تم الفحص المخبري بنجاح واكتملت المطابقة الطيفية 100%',
          sampleId,
          barcode,
          qrCodeDataUrl,
          classification: aiResult.classification,
          honeyTypeNameAr: aiResult.honeyTypeNameAr,
          confidence: aiResult.confidence,
          qualityScore: aiResult.qualityScore,
          isPure: aiResult.isPure,
          notes: aiResult.notes,
          chemicalAnalysis: sensorData.chemicalAnalysis,
          pdfUrl,
          sampleRecord,
        });
      } catch (error: any) {
        console.error('[Socket] Scan error:', error);
        socket.emit('scan_error', { message: error.message || 'Failed to complete scan sequence.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};
