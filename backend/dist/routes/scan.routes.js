"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const store_1 = require("../db/store");
const pdf_service_1 = require("../services/pdf.service");
const qrcode_1 = __importDefault(require("qrcode"));
const router = (0, express_1.Router)();
const pdfService = new pdf_service_1.PDFService();
// Retrieve all laboratory scan certificates
router.get('/reports', (req, res) => {
    const samples = store_1.dbStore.getSamples();
    res.status(200).json({ reports: samples });
});
// Retrieve specific scan certificate
router.get('/reports/:id', (req, res) => {
    const sample = store_1.dbStore.getSampleById(req.params.id);
    if (!sample) {
        return res.status(404).json({ error: 'Certificate not found' });
    }
    res.status(200).json({ report: sample });
});
// Download or view PDF certificate
router.get('/reports/:id/pdf', async (req, res) => {
    const sample = store_1.dbStore.getSampleById(req.params.id);
    if (!sample) {
        return res.status(404).json({ error: 'Certificate not found' });
    }
    try {
        const pdfPathRel = await pdfService.generateReport(sample);
        res.redirect(pdfPathRel);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to generate PDF report', details: err?.message });
    }
});
// Verify Barcode / QR Code (Scanned via phone or typed by consumer)
router.get('/verify/:code', async (req, res) => {
    const code = req.params.code;
    const sample = store_1.dbStore.getSampleByBarcode(code);
    if (!sample) {
        return res.status(404).json({
            valid: false,
            message: 'الرمز غير مسجل في المنظومة. احذر قد يكون هذا العسل غير مفحوص أو مقلد!',
            code,
        });
    }
    // Generate QR Code data URL if not present
    let qrCodeDataUrl = sample.qrCodeDataUrl;
    if (!qrCodeDataUrl) {
        const verifyUrl = `http://localhost:3000/verify?code=${encodeURIComponent(sample.barcode)}`;
        qrCodeDataUrl = await qrcode_1.default.toDataURL(verifyUrl, { width: 220, margin: 1 });
        sample.qrCodeDataUrl = qrCodeDataUrl;
    }
    // Find linked shop
    const shop = store_1.dbStore.getShopById(sample.shopId);
    // Find linked honey type info with disease treatment
    const honeyTypes = store_1.dbStore.getHoneyTypes();
    const honeyTypeDetail = honeyTypes.find((t) => sample.honeyType.includes(t.nameAr) || t.id.includes(sample.honeyType.toLowerCase()));
    res.status(200).json({
        valid: true,
        message: 'تم التحقق بنجاح: العسل أصلي ومفحوص مخبرياً بنسبة نقاء 100%',
        certificate: sample,
        shop,
        therapeuticBenefits: honeyTypeDetail?.therapeuticBenefits || [
            'تعزيز المناعة ومضاد حيوي طبيعي',
            'صحة الجهاز الهضمي والقولون',
            'مكافحة فقر الدم والضعف العام',
        ],
        qrCodeDataUrl,
    });
});
exports.default = router;
