import { Router } from 'express';

const router = Router();

// Do not issue demo tokens or silently fall back to an administrator account.
// Real authentication is intentionally fail-closed until password storage,
// token signing, user provisioning and RBAC are connected to persistent storage.
router.get('/users', (_req, res) => {
  res.status(503).json({
    error: 'AUTHENTICATION_NOT_CONFIGURED',
    message: 'تسجيل الدخول وإدارة المستخدمين غير مفعّلين للإنتاج بعد. تم إيقاف حسابات العرض والرموز الوهمية.',
  });
});

router.post('/login', (_req, res) => {
  res.status(503).json({
    success: false,
    error: 'AUTHENTICATION_NOT_CONFIGURED',
    message: 'لا يقبل النظام تسجيل الدخول قبل إعداد المصادقة الآمنة وحساب المدير الأول.',
  });
});

export default router;
