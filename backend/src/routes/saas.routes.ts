import { Router } from 'express';
import { dbStore } from '../db/store';

const router = Router();

// Public plan descriptions only. Subscription operations are not enabled until
// payment, authentication and auditable billing are connected.
router.get('/plans', (_req, res) => {
  res.json({ plans: dbStore.getPlans() });
});

router.get('/stats', (_req, res) => {
  res.status(503).json({
    error: 'ADMIN_AUTH_REQUIRED',
    message: 'إحصائيات المنصة وبيانات التجار متاحة بعد تفعيل مصادقة الإدارة والصلاحيات.',
  });
});

router.post('/subscribe', (_req, res) => {
  res.status(503).json({
    error: 'BILLING_NOT_CONFIGURED',
    message: 'تجديد الاشتراكات معطل حتى ربط مزود دفع فعلي ونظام فواتير وسجل تدقيق.',
  });
});

router.post('/toggle-visibility', (_req, res) => {
  res.status(503).json({
    error: 'ADMIN_AUTH_REQUIRED',
    message: 'تغيير ظهور المتاجر يتطلب مصادقة مدير وصلاحيات RBAC.',
  });
});

export default router;
