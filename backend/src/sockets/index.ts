import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { HardwareService } from '../services/hardware.service';
import { prisma } from '../db/prisma';

export let io: Server;

export const setupWebSockets = (server: HttpServer) => {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  io = new Server(server, {
    cors: {
      origin: allowedOrigin.split(',').map((value) => value.trim()),
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    let scanInProgress = false;

    socket.on('start_scan', async (data: { batchNumber?: string }) => {
      if (scanInProgress) {
        socket.emit('scan_error', { message: 'A scan is already running for this connection.' });
        return;
      }

      const batchNumber = String(data?.batchNumber || '').trim();
      if (!/^[a-zA-Z0-9_-]{2,64}$/.test(batchNumber)) {
        socket.emit('scan_error', { message: 'رقم الدفعة غير صالح. استخدم 2 إلى 64 حرفاً أو رقماً أو شرطة.' });
        return;
      }

      scanInProgress = true;
      try {
        const hardwareService = new HardwareService();
        const result = await hardwareService.scan(
          { batchNumber },
          {
            onProgress: (stage, percent) => socket.emit('scan_progress', { stage, percent }),
            onSensorData: (type, sensorData) => socket.emit('scan_data', { type, data: sensorData }),
          },
        );

        // Raw readings are persisted before the UI is told that the scan completed.
        const saved = await prisma.hardwareScan.create({
          data: {
            batchNumber: result.batchNumber,
            device: result.device,
            mode: result.mode,
            status: 'MEASURED_PENDING_LAB_VALIDATION',
            measurements: result.measurements as any,
            limitations: result.limitations as any,
            durationSeconds: result.durationSeconds,
            startedAt: new Date(result.startedAt),
            completedAt: new Date(result.completedAt),
          },
        });

        socket.emit('scan_complete', {
          status: 'MEASURED_PENDING_LAB_VALIDATION',
          scanId: saved.id,
          batchNumber: result.batchNumber,
          device: result.device,
          durationSeconds: result.durationSeconds,
          measurements: result.measurements,
          limitations: result.limitations,
          message: 'تم استقبال القياسات الحقيقية وحفظها. لا يصدر هذا الفحص حكماً على أصالة العسل أو شهادة نقاء.',
          classification: null,
          confidence: null,
          qualityScore: null,
          isPure: null,
          barcode: null,
          pdfUrl: null,
        });
      } catch (error: any) {
        console.error('[Socket] Physical scan failed:', error);
        socket.emit('scan_error', {
          message: error?.message || 'تعذر إكمال القياس الفعلي. تحقق من Arduino والمنفذ التسلسلي وقاعدة البيانات.',
        });
      } finally {
        scanInProgress = false;
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};
