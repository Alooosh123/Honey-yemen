import { Router } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// Historical JSON-backed certificates were generated from simulated data.
// They are deliberately not returned as valid certificates.
router.get('/reports', (_req, res) => {
  res.status(200).json({
    reports: [],
    notice: 'Legacy demonstration certificates are disabled and are not valid laboratory certificates.',
  });
});

router.get('/hardware-measurements', async (_req, res) => {
  try {
    const measurements = await prisma.hardwareScan.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.status(200).json({ measurements });
  } catch (error: any) {
    res.status(503).json({ error: 'Measurement database is unavailable.' });
  }
});

router.get('/reports/:id', (_req, res) => {
  res.status(410).json({
    error: 'Legacy demonstration certificate endpoint is disabled.',
    message: 'Only validated laboratory methods may issue certificates.',
  });
});

router.get('/reports/:id/pdf', (_req, res) => {
  res.status(410).json({
    error: 'PDF certificates are disabled until the measurement method is validated.',
  });
});

router.get('/verify/:code', (req, res) => {
  res.status(410).json({
    valid: false,
    code: req.params.code,
    message: 'التحقق من شهادات الأصالة معطل حالياً؛ الرموز القديمة تخص بيانات تجريبية ولا تثبت جودة العسل.',
  });
});

export default router;
