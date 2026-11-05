"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const store_1 = require("../db/store");
const router = (0, express_1.Router)();
// Get products with advanced therapeutic and search filters
router.get('/products', (req, res) => {
    const { search, honeyType, disease, shopId } = req.query;
    let products = store_1.dbStore.getProducts();
    // Only show products from visible/active shops
    const shops = store_1.dbStore.getShops();
    const visibleShopIds = new Set(shops.filter((s) => s.isVisibleInSearch).map((s) => s.id));
    products = products.filter((p) => visibleShopIds.has(p.shopId));
    if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        products = products.filter((p) => p.nameAr.toLowerCase().includes(q) ||
            p.nameEn.toLowerCase().includes(q) ||
            p.descriptionAr.toLowerCase().includes(q) ||
            p.barcode.toLowerCase().includes(q));
    }
    if (honeyType && typeof honeyType === 'string') {
        products = products.filter((p) => p.honeyTypeId === honeyType || p.nameAr.includes(honeyType));
    }
    if (disease && typeof disease === 'string') {
        const dLower = disease.toLowerCase();
        products = products.filter((p) => p.treatedDiseases.some((d) => d.toLowerCase().includes(dLower)));
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
router.get('/diseases', (req, res) => {
    const honeyTypes = store_1.dbStore.getHoneyTypes();
    const allDiseasesSet = new Set();
    const diseaseMapping = [];
    honeyTypes.forEach((ht) => {
        ht.therapeuticBenefits.forEach((b) => {
            // Extract short disease keywords or use full benefit
            allDiseasesSet.add(b);
        });
    });
    const categories = [
        {
            id: 'digestive',
            nameAr: 'الجهاز الهضمي والمعدة',
            conditions: ['قرحة المعدة والقولون', 'جرثومة المعدة (H. Pylori)', 'حموضة المعدة وسوء الهضم', 'القولون العصبي'],
            recommendedTypes: ['عسل سدر دوعني ملكي', 'عسل سلام تهامي'],
        },
        {
            id: 'respiratory',
            nameAr: 'الجهاز التنفسي والربو',
            conditions: ['الربو والحساسية الصدرية', 'التهاب الجيوب الأنفية والسعال', 'إذابة وطرد البلغم الرئوي', 'نزلات البرد والتهاب اللوزتين'],
            recommendedTypes: ['عسل صال يمني حار', 'عسل سدر عصيمي فاخر'],
        },
        {
            id: 'liver-blood',
            nameAr: 'الكبد وفقر الدم (الأنيميا)',
            conditions: ['فقر الدم الحاد (الأنيميا) ونقص الحديد', 'تنشيط وظائف الكبد وحمايته من التليف', 'فيروسات الكبد وتنشيط الإنزيمات'],
            recommendedTypes: ['عسل سمر حضرمي نقي', 'عسل سدر دوعني ملكي'],
        },
        {
            id: 'diabetes-kidney',
            nameAr: 'السكري والكلى والمسالك',
            conditions: ['صديق لمرضى السكري والوقاية', 'أمراض الكلى والمسالك البولية', 'تنظيم ضغط الدم والدورة الدموية'],
            recommendedTypes: ['عسل سلام تهامي صافي'],
        },
        {
            id: 'immunity-vitality',
            nameAr: 'المناعة والخصوبة والعائلة',
            conditions: ['تقوية المناعة ومكافحة الأورام', 'الضعف العام والخصوبة', 'صحة ونمو الأطفال والمناعة', 'محاربة الأرق واضطرابات النوم'],
            recommendedTypes: ['عسل سدر دوعني ملكي', 'عسل مراعي جبلي طبيعي'],
        },
    ];
    res.json({ categories, rawList: Array.from(allDiseasesSet) });
});
// Get honey types encyclopedia
router.get('/honey-types', (req, res) => {
    res.json({ honeyTypes: store_1.dbStore.getHoneyTypes() });
});
// Customer Checkout / Create Order
router.post('/orders', (req, res) => {
    const { customerName, customerPhone, customerEmail, deliveryAddress, city, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    const totalAmount = items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1), 0);
    const order = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        customerName: customerName || 'مشتري كريم',
        customerPhone: customerPhone || '+967 770 000 000',
        customerEmail: customerEmail || 'customer@honey.io',
        deliveryAddress: deliveryAddress || 'التسليم المباشر',
        city: city || 'صنعاء / الرياض',
        items,
        totalAmount,
        status: 'CONFIRMED',
        orderDate: new Date().toISOString(),
    };
    store_1.dbStore.createOrder(order);
    res.status(201).json({
        success: true,
        message: 'تم تسجيل طلب الشراء بنجاح! يتم تجهيز العبوات المفحوصة والمختومة.',
        order,
    });
});
// View orders
router.get('/orders', (req, res) => {
    res.json({ orders: store_1.dbStore.getOrders() });
});
exports.default = router;
