import { Router } from 'express';
import { dbStore } from '../db/store';
import { PDFService } from '../services/pdf.service';
import QRCode from 'qrcode';

const router = Router();
const pdfService = new PDFService();

router.get('/reports', (_req, res) => {
  res.status(200).json({ reports: dbStore.getSamples() });
});

router.get('/reports/:id', (req, res) => {
  const sample = dbStore.getSampleById(req.params.id);
  if (!sample) return res.status(404).json({ error: 'Measurement record not found' });

  const status = sample.analysisStatus || 'DEMO';
  res.status(200).json({
    report: status === 'VERIFIED' ? sample : {
      ...sample,
      analysisStatus: status,
      classification: 'NOT_EVALUATED',
      confidence: null,
      qualityScore: null,
      isPure: null,
      chemicalAnalysis: null,
    },
  });
});

router.get('/reports/:id/pdf', async (req, res) => {
  const sample = dbStore.getSampleById(req.params.id);
  if (!sample) return res.status(404).json({ error: 'Measurement record not found' });

  try {
    const reportPath = await pdfService.generateReport(sample);
    res.redirect(reportPath);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown report generation error';
    res.status(500).json({ error: 'Failed to generate measurement report', details: message });
  }
});

// A registered barcode is not, by itself, proof of authenticity.
router.get('/verify/:code', async (req, res) => {
  const code = String(req.params.code || '').trim();
  const sample = dbStore.getSampleByBarcode(code);

  if (!sample) {
    return res.status(404).json({
      valid: false,
      registered: false,
      message: 'هذا الرمز غير مسجل في قاعدة سجلات القياس.',
      code,
    });
  }

  const status = sample.analysisStatus || 'DEMO';
  const appUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const verifyUrl = appUrl + '/verify?code=' + encodeURIComponent(sample.barcode);
  const qrCodeDataUrl = sample.qrCodeDataUrl ||
    await QRCode.toDataURL(verifyUrl, { width: 220, margin: 1 });

  const isVerified = status === 'VERIFIED';
  const certificate = isVerified ? sample : {
    ...sample,
    analysisStatus: status,
    classification: 'NOT_EVALUATED',
    confidence: null,
    qualityScore: null,
    isPure: null,
    chemicalAnalysis: null,
  };

  res.status(200).json({
    valid: true,
    registered: true,
    analysisStatus: status,
    message: isVerified
      ? 'تم العثور على سجل تقييم معتمد في النظام.'
      : 'تم العثور على سجل القياس، لكن أصالة العسل لم يتم التحقق منها. لا تعتبر هذه النتيجة شهادة نقاء.',
    certificate,
    shop: sample.shopId ? dbStore.getShopById(sample.shopId) : null,
    therapeuticBenefits: [],
    qrCodeDataUrl,
  });
});

export default router;
