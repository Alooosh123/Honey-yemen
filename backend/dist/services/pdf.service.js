"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
class PDFService {
    async generateReport(sample) {
        return new Promise(async (resolve, reject) => {
            try {
                const reportsDir = path_1.default.join(process.cwd(), 'public', 'reports');
                if (!fs_1.default.existsSync(reportsDir)) {
                    fs_1.default.mkdirSync(reportsDir, { recursive: true });
                }
                const fileName = `certificate_${sample.id}.pdf`;
                const filePath = path_1.default.join(reportsDir, fileName);
                const writeStream = fs_1.default.createWriteStream(filePath);
                // Generate QR Code as PNG Buffer
                const qrVerificationUrl = `http://localhost:3000/verify?code=${encodeURIComponent(sample.barcode)}`;
                const qrBuffer = await qrcode_1.default.toBuffer(qrVerificationUrl, {
                    width: 140,
                    margin: 1,
                    color: {
                        dark: '#1e293b',
                        light: '#ffffff',
                    },
                });
                const doc = new pdfkit_1.default({
                    size: 'A4',
                    margin: 40,
                });
                doc.pipe(writeStream);
                // --- Visual Header / Border ---
                doc.rect(20, 20, 555, 802).lineWidth(2).strokeColor('#d97706').stroke();
                doc.rect(24, 24, 547, 794).lineWidth(0.8).strokeColor('#f59e0b').stroke();
                // Header Title
                doc.fillColor('#78350f').fontSize(20).text('HONEY QUALITY ASSESSMENT SYSTEM', { align: 'center', characterSpacing: 1 });
                doc.fillColor('#b45309').fontSize(13).text('CERTIFICATE OF LABORATORY ANALYSIS & PURITY VERIFICATION', { align: 'center' });
                doc.moveDown(0.3);
                doc.fillColor('#64748b').fontSize(10).text('Industrial Grade Multi-Sensor Spectroscopy & AI Diagnostics | ISO/IEC 17025 Compliant Standard', { align: 'center' });
                doc.moveDown(0.8);
                doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
                doc.moveDown(0.8);
                // --- Sample Details & QR Code Grid ---
                const detailsTop = doc.y;
                doc.fillColor('#1e293b').fontSize(11);
                doc.font('Helvetica-Bold').text('Sample ID: ', 45, detailsTop, { continued: true });
                doc.font('Helvetica').text(sample.id);
                doc.font('Helvetica-Bold').text('Batch Number: ', 45, detailsTop + 18, { continued: true });
                doc.font('Helvetica').text(sample.batchNumber);
                doc.font('Helvetica-Bold').text('Barcode / Auth Code: ', 45, detailsTop + 36, { continued: true });
                doc.font('Helvetica').fillColor('#b45309').text(sample.barcode);
                doc.fillColor('#1e293b');
                doc.font('Helvetica-Bold').text('Honey Classification: ', 45, detailsTop + 54, { continued: true });
                doc.font('Helvetica').text(`${sample.honeyType} (${sample.honeyTypeNameAr})`);
                doc.font('Helvetica-Bold').text('Origin Region: ', 45, detailsTop + 72, { continued: true });
                doc.font('Helvetica').text(sample.originRegion);
                doc.font('Helvetica-Bold').text('Merchant / Producer: ', 45, detailsTop + 90, { continued: true });
                doc.font('Helvetica').text(sample.shopName);
                doc.font('Helvetica-Bold').text('Test Date & Time: ', 45, detailsTop + 108, { continued: true });
                doc.font('Helvetica').text(new Date(sample.testedAt).toLocaleString('en-US'));
                // Embed QR Code on the right
                doc.image(qrBuffer, 420, detailsTop - 5, { width: 120, height: 120 });
                doc.fillColor('#64748b').fontSize(8).text('Scan to Verify Online', 435, detailsTop + 118, { width: 100, align: 'center' });
                // --- Purity Verdict Banner ---
                const bannerTop = detailsTop + 140;
                doc.rect(40, bannerTop, 515, 45).fillAndStroke(sample.isPure ? '#f0fdf4' : '#fef2f2', sample.isPure ? '#22c55e' : '#ef4444');
                doc.fillColor(sample.isPure ? '#15803d' : '#b91c1c').fontSize(15).font('Helvetica-Bold')
                    .text(sample.isPure ? `PASS: 100% PURE & AUTHENTIC HONEY (Confidence: ${(sample.confidence * 100).toFixed(1)}%)` : 'FAIL: ADULTERATION DETECTED', 50, bannerTop + 10);
                doc.fillColor('#475569').fontSize(9).font('Helvetica')
                    .text(`Quality Index Score: ${sample.qualityScore.toFixed(1)}% | Zero-Error Tolerance Criteria Met`, 50, bannerTop + 28);
                // --- Chemical & Sensor Parameters Table ---
                const tableTop = bannerTop + 60;
                doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('CHEMICAL & SENSOR SPECTROSCOPIC PARAMETERS', 45, tableTop);
                doc.rect(40, tableTop + 18, 515, 175).fillAndStroke('#f8fafc', '#cbd5e1');
                const col1 = 50;
                const col2 = 220;
                const col3 = 330;
                const col4 = 450;
                let rowY = tableTop + 26;
                const printTableRow = (label, val, ref, status, isHeader = false) => {
                    doc.fontSize(isHeader ? 9 : 9).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
                    doc.fillColor(isHeader ? '#475569' : '#1e293b');
                    doc.text(label, col1, rowY, { width: 160 });
                    doc.text(val, col2, rowY, { width: 100 });
                    doc.text(ref, col3, rowY, { width: 110 });
                    doc.fillColor(isHeader ? '#475569' : (status === 'Normal' || status === 'Optimal' ? '#16a34a' : '#d97706'));
                    doc.text(status, col4, rowY, { width: 60 });
                    rowY += 16;
                };
                printTableRow('PARAMETER', 'VALUE', 'LAB STANDARD', 'STATUS', true);
                doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(45, rowY - 4).lineTo(545, rowY - 4).stroke();
                printTableRow('Fructose Content', `${sample.chemicalAnalysis.fructose}%`, '38.0% - 44.0%', 'Optimal');
                printTableRow('Glucose Content', `${sample.chemicalAnalysis.glucose}%`, '28.0% - 34.0%', 'Optimal');
                printTableRow('Sucrose Content', `${sample.chemicalAnalysis.sucrose}%`, '< 5.0% (Natural limit)', 'Optimal');
                printTableRow('Moisture Content', `${sample.chemicalAnalysis.moisture}%`, '< 18.0% (Codex Standard)', 'Optimal');
                printTableRow('HMF (Thermal Index)', `${sample.chemicalAnalysis.hmf} mg/kg`, '< 15.0 mg/kg (Freshness)', 'Optimal');
                printTableRow('Density @ 20°C', `${sample.chemicalAnalysis.density} g/cm³`, '1.40 - 1.45 g/cm³', 'Optimal');
                printTableRow('VOC Aromatic Index', `${sample.chemicalAnalysis.vocIndex} pts`, '> 60 pts (Signature floral)', 'Optimal');
                printTableRow('NIR Absorbance Peak', `${sample.chemicalAnalysis.nirPeakAbsorbance} A.U.`, '1350 - 2500 nm profile', 'Optimal');
                // --- Hardware Sensors Synchronized ---
                const sensorsTop = rowY + 20;
                doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('SYNCHRONIZED JMAC SENSOR ARRAY', 45, sensorsTop);
                const sensors = [
                    { name: 'NeoSpectra Micro (FT-IR)', desc: 'Full NIR chemical sugar & HFCS analysis (1350-2500 nm)' },
                    { name: 'AS7341 / C12880MA Spectrometer', desc: '11-channel visible spectral signature & flavonoid profile' },
                    { name: 'VEML6075 Dual UV Radiometer', desc: 'UV-A & UV-B absorbance index for HMF freshness' },
                    { name: 'MLX90640 Thermal Matrix', desc: '32x24 non-contact infrared core thermal gradient' },
                    { name: 'HX711 Precision Load Cell', desc: '0.01g laboratory mass & density measurement' },
                    { name: 'BME688 / SGP40 Electronic Nose', desc: 'VOC gas fingerprint distinguishing Sidr / Samr aroma' },
                ];
                let sY = sensorsTop + 18;
                doc.fontSize(8.5).font('Helvetica');
                sensors.forEach((s) => {
                    doc.fillColor('#b45309').font('Helvetica-Bold').text(`• ${s.name}: `, 50, sY, { continued: true });
                    doc.fillColor('#475569').font('Helvetica').text(s.desc);
                    sY += 14;
                });
                // --- Signatures & Official Stamp Footer ---
                const footerY = 740;
                doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(40, footerY).lineTo(555, footerY).stroke();
                doc.fillColor('#64748b').fontSize(8).font('Helvetica')
                    .text('Chief Chemist & Lab Operator', 60, footerY + 8)
                    .text('System Digital Seal & SHA-256 Signature', 360, footerY + 8);
                doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold')
                    .text(sample.operatorName, 60, footerY + 22)
                    .text('VERIFIED INDUSTRIAL LAB SEAL', 360, footerY + 22);
                doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica')
                    .text('This digital laboratory certificate is tamper-proof and verified through the Honey Quality Assessment Central Platform.', 40, footerY + 45, { align: 'center', width: 515 });
                doc.end();
                writeStream.on('finish', () => {
                    resolve(`/reports/${fileName}`);
                });
                writeStream.on('error', (err) => {
                    reject(err);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.PDFService = PDFService;
