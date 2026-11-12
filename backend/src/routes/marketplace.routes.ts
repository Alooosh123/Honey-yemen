import { Router } from 'express';
import { dbStore } from '../db/store';

const router = Router();

// Get products with advanced therapeutic and search filters
router.get('/products', (req, res) => {
  const { search, honeyType, disease, shopId } = req.query;
  let products = dbStore.getProducts();

  // Only show products from visible/active shops
  const shops = dbStore.getShops();
  const visibleShopIds = new Set(shops.filter((s) => s.isVisibleInSearch).map((s) => s.id));
  products = products.filter((p) => visibleShopIds.has(p.shopId));

  // Never publish seed/demo products or products without a verified sample record.
  const verifiedSampleIds = new Set(
    dbStore.getSamples()
      .filter((sample) => sample.analysisStatus === 'VERIFIED')
      .map((sample) => sample.id)
  );
  products = products.filter((product) => verifiedSampleIds.has(product.sampleId));

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.descriptionAr.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
    );
  }

  if (honeyType && typeof honeyType === 'string') {
    products = products.filter((p) => p.honeyTypeId === honeyType || p.nameAr.includes(honeyType));
  }

  if (disease && typeof disease === 'string') {
    const dLower = disease.toLowerCase();
    products = products.filter((p) =>
      p.treatedDiseases.some((d) => d.toLowerCase().includes(dLower))
    );
  }

  if (shopId && typeof shopId === 'string') {
    products = products.filter((p) => p.shopId === shopId);
  }

  res.json({
    total: products.length,
    products,
  });
});

// Get catalog of all diseases and medical conditions treated by honey
router.get('/diseases', (_req, res) => {
  res.status(200).json({
    categories: [],
    rawList: [],
    message: 'لا يقدم النظام ادعاءات بعلاج الأمراض. العسل غذاء وليس بديلاً عن التشخيص أو العلاج الطبي.',
  });
});

// Get honey types encyclopedia
router.get('/honey-types', (_req, res) => {
  const honeyTypes = dbStore.getHoneyTypes().map((type) => ({
    id: type.id,
    nameAr: type.nameAr,
    nameEn: type.nameEn,
    description: type.description,
    region: type.region,
  }));
  res.json({
    honeyTypes,
    message: 'معلومات تعريفية فقط؛ لم يتم اعتماد بصمات كيميائية أو فوائد علاجية لكل نوع داخل النظام.',
  });
});

// Customer Checkout / Create Order
router.post('/orders', (_req, res) => {
  res.status(503).json({
    error: 'CHECKOUT_NOT_CONFIGURED',
    message: 'إنشاء الطلبات والدفع معطلان حتى تفعيل المصادقة والتحقق من المخزون ومزود دفع فعلي.',
  });
});

// View orders
router.get('/orders', (_req, res) => {
  res.status(503).json({
    error: 'ORDER_ACCESS_LOCKED',
    message: 'عرض الطلبات يتطلب مصادقة وصلاحيات مستخدم غير مفعّلة بعد.',
  });
});

export default router;
