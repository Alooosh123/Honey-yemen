import { Router } from 'express';
import { dbStore } from '../db/store';
import { measurementRepository } from '../db/measurement.repository';
import { PDFService } from '../services/pdf.service';
import QRCode from 'qrcode';

const router = Router();
const pdfService = new PDFService();

const safeMeasurementRecord = (sample: any) => {
  if (sample.analysisStatus === 'VERIFIED') return sample;
  const hasRealReadings = Boolean(sample.sensorData?.rawReadings);
  return {
    ...sample,
    analysisStatus: sample.analysisStatus || 'DEMO',
    classification: 'NOT_EVALUATED',
    confidence: null,
    qualityScore: null,
    isPure: null,
    chemicalAnalysis: null,
    sensorData: hasRealReadings ? sample.sensorData : {
      nirSummary: { points: 0, minWl: 0, maxWl: 0 },
      vis11Channels: [],
      uvResponse: { uva: null, uvb: null, hmfIndex: null },
      thermalAverage: null,
      densityValue: null,
      vocGasLevel: null,
    },
  };
};

const publicRecord = (sample: any) => {
  const safe = safeMeasurementRecord(sample);
  return {
    id: safe.id,
    barcode: safe.barcode,
    batchNumber: safe.batchNumber,
    testedAt: safe.testedAt,
    honeyType: safe.honeyType,
    honeyTypeNameAr: safe.honeyTypeNameAr,
    analysisStatus: safe.analysisStatus,
    classification: safe.classification,
    confidence: safe.confidence,
    qualityScore: safe.qualityScore,
    isPure: safe.isPure,
    sensorData: {
      rawReadings: safe.sensorData?.rawReadings || null,
    },
  };
};

// Bulk and internal record APIs stay closed until authenticated RBAC is implemented.
router.get('/reports', (_req, res) => {
  res.status(503).json({
    error: 'ADMIN_AUTH_REQUIRED',
    message: 'قائمة سجلات الفحص الكاملة متاحة بعد تفعيل تسجيل الدخول وصلاحيات الإدارة.',
  });
});

router.get('/reports/:id', (_req, res) => {
  res.status(503).json({
    error: 'ADMIN_AUTH_REQUIRED',
    message: 'الوصول المباشر لسجل القياس يتطلب تسجيل دخول وصلاحيات مناسبة.',
  });
});

router.get('/reports/:id/pdf', (_req, res) => {
  res.status(503).json({
    error: 'ADMIN_AUTH_REQUIRED',
    message: 'تقارير PDF الداخلية تتطلب تسجيل دخول وصلاحيات مناسبة.',
  });
});

// Public QR lookup returns only the limited fields needed to verify a printed record.
router.get('/verify/:code', async (req, res) => {
  const code = String(req.params.code || '').trim();
  if (!code) {
    return res.status(400).json({ valid: false, registered: false, message: 'رمز القياس مطلوب.' });
  }

  try {
    const sample = await measurementRepository.findByBarcode(code)
      || dbStore.getSampleByBarcode(code);

    if (!sample) {
      return res.status(404).json({
        valid: false,
        registered: false,
        message: 'هذا الرمز غير مسجل في قاعدة سجلات القياس.',
        code,
      });
    }

    const record = publicRecord(sample);
    const appUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const verifyUrl = appUrl + '/verify?code=' + encodeURIComponent(record.barcode);
    const qrCodeDataUrl = sample.qrCodeDataUrl ||
      await QRCode.toDataURL(verifyUrl, { width: 220, margin: 1 });

    const isVerified = record.analysisStatus === 'VERIFIED';

    return res.status(200).json({
      valid: true,
      registered: true,
      analysisStatus: record.analysisStatus,
      message: isVerified
        ? 'تم العثور على سجل تقييم معتمد في النظام.'
        : 'تم العثور على سجل القياس، لكن أصالة العسل لم يتم التحقق منها. لا تعتبر هذه النتيجة شهادة نقاء.',
      certificate: record,
      qrCodeDataUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Measurement database unavailable';
    return res.status(503).json({
      valid: false,
      registered: false,
      error: 'MEASUREMENT_DATABASE_UNAVAILABLE',
      message: 'تعذر الاتصال بقاعدة بيانات سجلات القياس.',
      details: message,
    });
  }
});

// A high-entropy barcode is required to retrieve its public technical PDF.
router.get('/verify/:code/pdf', async (req, res) => {
  const code = String(req.params.code || '').trim();
  try {
    const sample = await measurementRepository.findByBarcode(code)
      || dbStore.getSampleByBarcode(code);
    if (!sample) return res.status(404).json({ error: 'Measurement record not found' });

    const safe = safeMeasurementRecord(sample);
    const pdfRecord = {
      ...safe,
      operatorName: '',
      shopId: '',
      shopName: '',
      originRegion: '',
    };
    const reportPath = await pdfService.generateReport(pdfRecord);
    return res.redirect(reportPath);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown report generation error';
    return res.status(503).json({
      error: 'MEASUREMENT_REPORT_UNAVAILABLE',
      details: message,
    });
  }
});

export default router;
