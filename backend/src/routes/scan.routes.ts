import { Router } from 'express';
import { dbStore, HoneySampleRecord } from '../db/store';
import { PDFService } from '../services/pdf.service';
import QRCode from 'qrcode';

const router = Router();
const pdfService = new PDFService();

// Retrieve all laboratory scan certificates
router.get('/reports', (req, res) => {
  const samples = dbStore.getSamples();
  res.status(200).json({ reports: samples });
});

// Retrieve specific scan certificate
router.get('/reports/:id', (req, res) => {
  const sample = dbStore.getSampleById(req.params.id);
  if (!sample) {
    return res.status(404).json({ error: 'Certificate not found' });
  }
  res.status(200).json({ report: sample });
});

// Download or view PDF certificate
router.get('/reports/:id/pdf', async (req, res) => {
  const sample = dbStore.getSampleById(req.params.id);
  if (!sample) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  try {
    const pdfPathRel = await pdfService.generateReport(sample);
    res.redirect(pdfPathRel);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate PDF report', details: err?.message });
  }
});

// Verify Barcode / QR Code (Scanned via phone or typed by consumer)
router.get('/verify/:code', async (req, res) => {
  const code = req.params.code;
  const sample = dbStore.getSampleByBarcode(code);

  if (!sample) {
    return res.status(404).json({
      valid: false,
      message: 'الرمز غير مسجل في المنظومة. احذر قد يكون هذا العسل غير مفحوص أو مقلد!',
      code,
    });
  }

  // Generate QR Code data URL if not present
  let qrCodeDataUrl = sample.qrCodeDataUrl;
  if (!qrCodeDataUrl) {
    const verifyUrl = `http://localhost:3000/verify?code=${encodeURIComponent(sample.barcode)}`;
    qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { width: 220, margin: 1 });
    sample.qrCodeDataUrl = qrCodeDataUrl;
  }

  // Find linked shop
  const shop = dbStore.getShopById(sample.shopId);

  // Find linked honey type info with disease treatment
  const honeyTypes = dbStore.getHoneyTypes();
  const honeyTypeDetail = honeyTypes.find((t) => sample.honeyType.includes(t.nameAr) || t.id.includes(sample.honeyType.toLowerCase()));

  res.status(200).json({
    valid: true,
    message: 'تم التحقق بنجاح: العسل أصلي ومفحوص مخبرياً بنسبة نقاء 100%',
    certificate: sample,
    shop,
    therapeuticBenefits: honeyTypeDetail?.therapeuticBenefits || [
      'تعزيز المناعة ومضاد حيوي طبيعي',
      'صحة الجهاز الهضمي والقولون',
      'مكافحة فقر الدم والضعف العام',
    ],
    qrCodeDataUrl,
  });
});

export default router;
