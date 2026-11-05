"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const store_1 = require("../db/store");
const crypto_1 = require("crypto");
const router = (0, express_1.Router)();
// Get all shops (filter by search visibility for customer storefront)
router.get('/', (req, res) => {
    const { visibleOnly } = req.query;
    let shops = store_1.dbStore.getShops();
    if (visibleOnly === 'true') {
        shops = shops.filter((s) => s.isVisibleInSearch && s.subscriptionStatus === 'ACTIVE');
    }
    res.json({ shops });
});
// Get shop details by ID
router.get('/:id', (req, res) => {
    const shop = store_1.dbStore.getShopById(req.params.id);
    if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
    }
    const products = store_1.dbStore.getProducts().filter((p) => p.shopId === shop.id);
    const scans = store_1.dbStore.getSamples().filter((s) => s.shopId === shop.id);
    res.json({
        shop,
        products,
        scans,
    });
});
// Merchant adds product after laboratory scan
router.post('/:id/products', (req, res) => {
    const shop = store_1.dbStore.getShopById(req.params.id);
    if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
    }
    const { nameAr, nameEn, honeyTypeId, sampleId, barcode, price, weightGrams, stockQuantity, treatedDiseases, descriptionAr, imageUrl, } = req.body;
    if (!barcode) {
        return res.status(400).json({ error: 'Barcode from certified lab scan is required' });
    }
    const newProduct = {
        id: `prod-${(0, crypto_1.randomUUID)().slice(0, 8)}`,
        nameAr: nameAr || 'عسل يمني فاخر مفحوص',
        nameEn: nameEn || 'Certified Yemeni Honey',
        honeyTypeId: honeyTypeId || 'type-sidr-doani',
        shopId: shop.id,
        shopName: shop.name,
        sampleId: sampleId || '',
        barcode,
        price: Number(price) || 80,
        currency: 'USD',
        weightGrams: Number(weightGrams) || 1000,
        stockQuantity: Number(stockQuantity) || 20,
        purityScore: 99.8,
        treatedDiseases: Array.isArray(treatedDiseases) ? treatedDiseases : ['تقوية المناعة', 'صحة الجهاز الهضمي'],
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
        descriptionAr: descriptionAr || 'عسل طبيعي خالص وموثق بباركود الفحص المخبري.',
        badge: 'مفحوص وموثق 100%',
        rating: 5.0,
        reviewsCount: 1,
    };
    store_1.dbStore.addProduct(newProduct);
    res.status(201).json({ success: true, product: newProduct });
});
// Toggle shop search visibility (Admin SaaS)
router.patch('/:id/visibility', (req, res) => {
    const { isVisible } = req.body;
    const updated = store_1.dbStore.toggleShopVisibility(req.params.id, Boolean(isVisible));
    if (!updated) {
        return res.status(404).json({ error: 'Shop not found' });
    }
    res.json({ success: true, shop: updated });
});
exports.default = router;
