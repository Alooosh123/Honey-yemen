import { Router } from 'express';
import { dbStore, HoneyProduct } from '../db/store';
import { randomUUID } from 'crypto';

const router = Router();

// Get all shops (filter by search visibility for customer storefront)
router.get('/', (req, res) => {
  const { visibleOnly } = req.query;
  let shops = dbStore.getShops();

  if (visibleOnly === 'true') {
    shops = shops.filter((s) => s.isVisibleInSearch && s.subscriptionStatus === 'ACTIVE');
  }

  res.json({ shops });
});

// Get shop details by ID
router.get('/:id', (req, res) => {
  const shop = dbStore.getShopById(req.params.id);
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }

  const products = dbStore.getProducts().filter((p) => p.shopId === shop.id);
  const scans = dbStore.getSamples().filter((s) => s.shopId === shop.id);

  res.json({
    shop,
    products,
    scans,
  });
});

// Merchant adds product after laboratory scan
router.post('/:id/products', (_req, res) => {
  res.status(503).json({
    error: 'PRODUCT_PUBLISHING_LOCKED',
    message: 'نشر المنتجات متوقف حتى تفعيل مصادقة التاجر وربط المنتج بسجل عينة معتمد فعلياً.',
  });
});

// Toggle shop search visibility (Admin SaaS)
router.patch('/:id/visibility', (_req, res) => {
  res.status(503).json({
    error: 'SHOP_ADMIN_LOCKED',
    message: 'تغيير حالة ظهور المتاجر يتطلب مصادقة مدير وصلاحيات RBAC غير مفعّلة بعد.',
  });
});

export default router;
