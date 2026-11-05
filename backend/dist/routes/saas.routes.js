"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const store_1 = require("../db/store");
const router = (0, express_1.Router)();
// Get SaaS subscription plans
router.get('/plans', (req, res) => {
    res.json({ plans: store_1.dbStore.getPlans() });
});
// Central SaaS statistics & overview for Platform Owner
router.get('/stats', (req, res) => {
    const shops = store_1.dbStore.getShops();
    const samples = store_1.dbStore.getSamples();
    const orders = store_1.dbStore.getOrders();
    const products = store_1.dbStore.getProducts();
    const totalScans = samples.length;
    const pureScans = samples.filter((s) => s.isPure).length;
    const adulteratedScans = samples.filter((s) => !s.isPure).length;
    const activeShops = shops.filter((s) => s.subscriptionStatus === 'ACTIVE').length;
    const visibleInSearchShops = shops.filter((s) => s.isVisibleInSearch).length;
    const totalMarketRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    // Calculate SaaS subscription revenue estimate
    const saasRevenue = shops.reduce((sum, s) => {
        if (s.subscriptionPlan === 'ENTERPRISE')
            return sum + 499;
        if (s.subscriptionPlan === 'COMMERCIAL')
            return sum + 199;
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
    const updatedShop = store_1.dbStore.renewShopSubscription(shopId, planKey);
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
    const updated = store_1.dbStore.toggleShopVisibility(shopId, Boolean(isVisible));
    if (!updated) {
        return res.status(404).json({ error: 'Shop not found' });
    }
    res.json({
        success: true,
        message: isVisible ? 'تم تفعيل ظهور المتجر في تطبيق العميل بنجاح.' : 'تم إخفاء المتجر من نتائج البحث.',
        shop: updated,
    });
});
exports.default = router;
