import { Router } from 'express';
import { dbStore } from '../db/store';

const router = Router();

// Public directory exposes only shops with at least one verified listed product.
router.get('/', (_req, res) => {
  const verifiedSampleIds = new Set(
    dbStore.getSamples()
      .filter((sample) => sample.analysisStatus === 'VERIFIED')
      .map((sample) => sample.id)
  );
  const verifiedShopIds = new Set(
    dbStore.getProducts()
      .filter((product) => verifiedSampleIds.has(product.sampleId))
      .map((product) => product.shopId)
  );
  const shops = dbStore.getShops()
    .filter((shop) => shop.isVisibleInSearch && verifiedShopIds.has(shop.id))
    .map((shop) => ({
      id: shop.id,
      name: shop.name,
      city: shop.city,
      region: shop.region,
      logo: shop.logo,
      rating: shop.rating,
      isVerified: true,
    }));

  res.json({ shops });
});

// Merchant details and all private shop records require authentication and RBAC.
router.get('/:id', (_req, res) => {
  res.status(503).json({
    error: 'MERCHANT_ACCESS_LOCKED',
    message: 'بيانات التاجر وسجلاته تتطلب تسجيل دخول وصلاحيات لم يتم تفعيلها بعد.',
  });
});

router.post('/:id/products', (_req, res) => {
  res.status(503).json({
    error: 'PRODUCT_PUBLISHING_LOCKED',
    message: 'نشر المنتجات متوقف حتى تفعيل مصادقة التاجر وربط المنتج بسجل عينة معتمد فعلياً.',
  });
});

router.patch('/:id/visibility', (_req, res) => {
  res.status(503).json({
    error: 'SHOP_ADMIN_LOCKED',
    message: 'تغيير حالة ظهور المتاجر يتطلب مصادقة مدير وصلاحيات RBAC غير مفعّلة بعد.',
  });
});

export default router;
