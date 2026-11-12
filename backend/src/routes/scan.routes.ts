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

router.get('/reports', async (_req, res) => {
  try {
    const persisted = await measurementRepository.list();
    const legacyDemo = dbStore.getSamples().map(safeMeasurementRecord);
    const reports = [...persisted.map(safeMeasurementRecord), ...legacyDemo];
    res.status(200).json({ reports });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Measurement database unavailable';
    res.status(503).json({
      error: 'MEASUREMENT_DATABASE_UNAVAILABLE',
      message: 'تعذر الاتصال بقاعدة بيانات سجلات القياس.',
      details: message,
    });
  }
});

router.get('/reports/:id', async (req, res) => {
  try {
    const sample = await measurementRepository.findById(req.params.id)
      || dbStore.getSampleById(req.params.id);
    if (!sample) return res.status(404).json({ error: 'Measurement record not found' });
    res.status(200).json({ report: safeMeasurementRecord(sample) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Measurement database unavailable';
    res.status(503).json({ error: 'MEASUREMENT_DATABASE_UNAVAILABLE', details: message });
  }
});

router.get('/reports/:id/pdf', async (req, res) => {
  try {
    const sample = await measurementRepository.findById(req.params.id)
      || dbStore.getSampleById(req.params.id);
    if (!sample) return res.status(404).json({ error: 'Measurement record not found' });

    const reportPath = await pdfService.generateReport(safeMeasurementRecord(sample));
    res.redirect(reportPath);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown report generation error';
    res.status(503).json({ error: 'Failed to generate measurement report', details: message });
  }
});

// A registered barcode is not, by itself, proof of authenticity.
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

    const safeSample = safeMeasurementRecord(sample);
    const status = safeSample.analysisStatus || 'DEMO';
    const appUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const verifyUrl = appUrl + '/verify?code=' + encodeURIComponent(safeSample.barcode);
    const qrCodeDataUrl = safeSample.qrCodeDataUrl ||
      await QRCode.toDataURL(verifyUrl, { width: 220, margin: 1 });

    const isVerified = status === 'VERIFIED';

    return res.status(200).json({
      valid: true,
      registered: true,
      analysisStatus: status,
      message: isVerified
        ? 'تم العثور على سجل تقييم معتمد في النظام.'
        : 'تم العثور على سجل القياس، لكن أصالة العسل لم يتم التحقق منها. لا تعتبر هذه النتيجة شهادة نقاء.',
      certificate: safeSample,
      shop: null,
      therapeuticBenefits: [],
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

export default router;
