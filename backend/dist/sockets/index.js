"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSockets = exports.io = void 0;
const crypto_1 = require("crypto");
const socket_io_1 = require("socket.io");
const qrcode_1 = __importDefault(require("qrcode"));
const hardware_service_1 = require("../services/hardware.service");
const ai_service_1 = require("../services/ai.service");
const pdf_service_1 = require("../services/pdf.service");
const store_1 = require("../db/store");
const aiService = new ai_service_1.AIService();
const pdfService = new pdf_service_1.PDFService();
const setupWebSockets = (server) => {
    exports.io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });
    exports.io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);
        socket.on('start_scan', async (data) => {
            const batchNumber = data?.batchNumber || `BCH-${Math.floor(1000 + Math.random() * 9000)}`;
            const honeyType = data?.honeyType || 'Sidr Doani';
            const shopId = data?.shopId || 'shop-1';
            const shop = store_1.dbStore.getShopById(shopId);
            const shopName = shop ? shop.name : (data?.shopName || 'مناحل وادي دوعن الملكية');
            const originRegion = data?.originRegion || (shop ? shop.region : 'وادي دوعن، حضرموت');
            const isSimulatedAdulterated = Boolean(data?.isSimulatedAdulterated);
            console.log(`[Socket] Received start_scan command for batch: ${batchNumber} (${honeyType})`);
            const sampleId = `sample-${(0, crypto_1.randomUUID)().slice(0, 8)}`;
            const barcode = `HONEY-${batchNumber.replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
            try {
                const hardwareService = new hardware_service_1.HardwareService();
                const sensorData = await hardwareService.simulateScanSequence(socket, {
                    batchNumber,
                    honeyType,
                    originRegion,
                    shopId,
                    shopName,
                    isSimulatedAdulterated,
                });
                socket.emit('scan_progress', { stage: 'تحليل البصمة الطيفية والكيميائية بالذكاء الاصطناعي', stageEn: 'AI Neural Inference', percent: 92 });
                const aiResult = await aiService.predict(sensorData);
                socket.emit('scan_progress', { stage: 'توليد الباركود وشهادة الفحص المخبرية الرقمية', stageEn: 'Generating Digital Certificate & QR Code', percent: 97 });
                // Generate QR code data URL for instant verification on phones
                const verifyUrl = `http://localhost:3000/verify?code=${encodeURIComponent(barcode)}`;
                const qrCodeDataUrl = await qrcode_1.default.toDataURL(verifyUrl, { width: 220, margin: 1 });
                const sampleRecord = {
                    id: sampleId,
                    batchNumber,
                    barcode,
                    qrCodeDataUrl,
                    honeyType,
                    honeyTypeNameAr: aiResult.honeyTypeNameAr,
                    originRegion,
                    shopId,
                    shopName,
                    testedAt: new Date().toISOString(),
                    operatorName: 'م. أحمد باصديق (كبير كيميائيي المختبر)',
                    classification: aiResult.classification,
                    confidence: aiResult.confidence,
                    qualityScore: aiResult.qualityScore,
                    isPure: aiResult.isPure,
                    chemicalAnalysis: sensorData.chemicalAnalysis,
                    sensorData: {
                        nirSummary: { points: 100, minWl: 1350, maxWl: 2500 },
                        vis11Channels: sensorData.visData,
                        uvResponse: sensorData.uvData,
                        thermalAverage: 25.4,
                        densityValue: sensorData.density,
                        vocGasLevel: sensorData.voc,
                    },
                };
                const pdfUrl = await pdfService.generateReport(sampleRecord);
                sampleRecord.pdfUrl = pdfUrl;
                // Persist in local database store
                store_1.dbStore.addSample(sampleRecord);
                socket.emit('scan_complete', {
                    message: 'تم الفحص المخبري بنجاح واكتملت المطابقة الطيفية 100%',
                    sampleId,
                    barcode,
                    qrCodeDataUrl,
                    classification: aiResult.classification,
                    honeyTypeNameAr: aiResult.honeyTypeNameAr,
                    confidence: aiResult.confidence,
                    qualityScore: aiResult.qualityScore,
                    isPure: aiResult.isPure,
                    notes: aiResult.notes,
                    chemicalAnalysis: sensorData.chemicalAnalysis,
                    pdfUrl,
                    sampleRecord,
                });
            }
            catch (error) {
                console.error('[Socket] Scan error:', error);
                socket.emit('scan_error', { message: error.message || 'Failed to complete scan sequence.' });
            }
        });
        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });
};
exports.setupWebSockets = setupWebSockets;
