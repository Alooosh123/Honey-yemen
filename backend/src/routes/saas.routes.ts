import { Router } from 'express';
import { dbStore } from '../db/store';

const router = Router();

// Get SaaS subscription plans
router.get('/plans', (req, res) => {
  res.json({ plans: dbStore.getPlans() });
});

// Central SaaS statistics & overview for Platform Owner
router.get('/stats', (req, res) => {
  const shops = dbStore.getShops();
  const samples = dbStore.getSamples();
  const orders = dbStore.getOrders();
  const products = dbStore.getProducts();

  const totalScans = samples.length;
  const pureScans = samples.filter((s) => s.isPure).length;
  const adulteratedScans = samples.filter((s) => !s.isPure).length;
  const activeShops = shops.filter((s) => s.subscriptionStatus === 'ACTIVE').length;
  const visibleInSearchShops = shops.filter((s) => s.isVisibleInSearch).length;

  const totalMarketRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Calculate SaaS subscription revenue estimate
  const saasRevenue = shops.reduce((sum, s) => {
    if (s.subscriptionPlan === 'ENTERPRISE') return sum + 499;
    if (s.subscriptionPlan === 'COMMERCIAL') return sum + 199;
    return sum + 79;
  }, 0);

  res.json({
    stats: {
      totalScans,
      pureScans,
      adulteratedScans,
      purityRate: totalScans > 0 ? parseFloat(((pureScans / totalScans) * 100).toFixed(1)) : 100,
      totalShops: shops.length,
      activeShops,
      visibleInSearchShops,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalMarketRevenue,
      saasRevenue,
    },
    shops,
  });
});

// Merchant renews or upgrades subscription
router.post('/subscribe', (req, res) => {
  const { shopId, planKey } = req.body;
  if (!shopId || !planKey) {
    return res.status(400).json({ error: 'Shop ID and Plan Key are required' });
  }

  const updatedShop = dbStore.renewShopSubscription(shopId, planKey);
  if (!updatedShop) {
    return res.status(404).json({ error: 'Shop not found' });
  }

  res.json({
    success: true,
    message: `تم تجديد وتفعيل ${planKey} بنجاح، وشحن رصيد الفحوصات المخبرية للمتجر!`,
    shop: updatedShop,
  });
});

// Super Admin toggles merchant visibility in customer search & directory
router.post('/toggle-visibility', (req, res) => {
  const { shopId, isVisible } = req.body;
  if (!shopId) {
    return res.status(400).json({ error: 'shopId is required' });
  }

  const updated = dbStore.toggleShopVisibility(shopId, Boolean(isVisible));
  if (!updated) {
    return res.status(404).json({ error: 'Shop not found' });
  }

  res.json({
    success: true,
    message: isVisible ? 'تم تفعيل ظهور المتجر في تطبيق العميل بنجاح.' : 'تم إخفاء المتجر من نتائج البحث.',
    shop: updated,
  });
});

export default router;
