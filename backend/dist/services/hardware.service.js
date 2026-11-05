"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HardwareService = void 0;
class HardwareService {
    async simulateScanSequence(socket, options) {
        const isAdulterated = options?.isSimulatedAdulterated || false;
        const honeyType = options?.honeyType || 'Sidr Doani';
        console.log(`[HardwareService] Initiating Dark Chamber mechanical sequence for batch: ${options?.batchNumber}`);
        // Stage 1: Mechanical chamber & ambient light seal
        socket.emit('scan_progress', { stage: 'إغلاق الغرفة المظلمة المعزولة والتحقق من نفاذية الكوارتز', stageEn: 'Sealing Dark Chamber & Quartz Glass', percent: 15 });
        await this.delay(800);
        // Stage 2: Thermal Sensor Matrix (MLX90640 32x24)
        socket.emit('scan_progress', { stage: 'معايرة وقراءة المصفوفة الحرارية (MLX90640)', stageEn: 'Capturing Thermal Matrix (32x24)', percent: 30 });
        const thermalMatrix = this.generateThermalMatrix(isAdulterated);
        const thermalAvg = 25.0 + Math.random() * 0.8;
        socket.emit('scan_data', { type: 'thermal', data: thermalMatrix, average: thermalAvg });
        await this.delay(800);
        // Stage 3: Spectral Acquisition (NeoSpectra FT-IR & VIS 11-ch & VEML6075 UV)
        socket.emit('scan_progress', { stage: 'إطلاق الطيف الضوئي والأشعة تحت الحمراء وفوق البنفسجية (FT-IR / VIS / UV)', stageEn: 'Firing Synchronized NIR / VIS / UV Beams', percent: 55 });
        const nirData = this.generateNIRData(honeyType, isAdulterated);
        const visData = this.generateVISData(honeyType, isAdulterated);
        const uvData = this.generateUVData(isAdulterated);
        socket.emit('scan_data', { type: 'nir', data: nirData });
        socket.emit('scan_data', { type: 'vis', data: visData });
        socket.emit('scan_data', { type: 'uv', data: uvData });
        await this.delay(900);
        // Stage 4: Physical & Chemical Sensor Fusion (Load Cell + VOC BME688)
        socket.emit('scan_progress', { stage: 'قياس الكثافة والميزان المخبري والأثر العطري (HX711 & VOC Gas)', stageEn: 'Measuring Density & Electronic Nose VOC Fingerprint', percent: 75 });
        const density = isAdulterated ? 1.34 + Math.random() * 0.03 : 1.42 + Math.random() * 0.02;
        const voc = isAdulterated ? 30 + Math.random() * 10 : 80 + Math.random() * 15;
        socket.emit('scan_data', { type: 'density', data: density });
        socket.emit('scan_data', { type: 'voc', data: voc });
        await this.delay(800);
        // Stage 5: Final hardware sensor fusion package
        socket.emit('scan_progress', { stage: 'استكمال جمع البيانات وتمريرها لنواة الذكاء الاصطناعي', stageEn: 'Synthesizing Multidimensional Feature Vector', percent: 90 });
        const chemicalAnalysis = this.calculateChemicalEstimates(honeyType, density, uvData, isAdulterated);
        return {
            batchNumber: options?.batchNumber,
            honeyType,
            originRegion: options?.originRegion || 'اليمن',
            shopId: options?.shopId || 'shop-1',
            shopName: options?.shopName || 'مناحل وادي دوعن الملكية',
            nirData,
            visData,
            uvData,
            thermalMatrix,
            density: parseFloat(density.toFixed(3)),
            voc: parseFloat(voc.toFixed(1)),
            chemicalAnalysis,
            isAdulterated,
        };
    }
    generateNIRData(honeyType, isAdulterated) {
        // 100 data points across 1350 - 2500 nm
        const points = [];
        const baseShift = isAdulterated ? 15 : 0;
        for (let i = 0; i < 100; i++) {
            const wl = 1350 + i * ((2500 - 1350) / 100);
            // Characteristic honey absorption peaks around 1450nm (water) and 1940nm (sugar C-H/O-H)
            const waterPeak = Math.exp(-Math.pow((wl - 1450) / 70, 2)) * 60;
            const sugarPeak = Math.exp(-Math.pow((wl - 1940) / 90, 2)) * 85;
            const noise = (Math.random() - 0.5) * 4;
            const adulterationOffset = isAdulterated && wl > 1900 ? 25 : 0;
            const val = Math.max(5, waterPeak + sugarPeak + noise - baseShift + adulterationOffset + 20);
            points.push(parseFloat(val.toFixed(2)));
        }
        return points;
    }
    generateVISData(honeyType, isAdulterated) {
        // 11 visible wavelength channels
        if (isAdulterated) {
            return [30, 45, 60, 80, 110, 140, 160, 140, 110, 80, 50];
        }
        // Deep golden / dark amber profile for Sidr/Samr
        return [18, 42, 65, 112, 185, 230, 245, 210, 175, 130, 80].map((v) => Math.min(255, Math.max(10, Math.round(v + (Math.random() - 0.5) * 8))));
    }
    generateUVData(isAdulterated) {
        if (isAdulterated) {
            return {
                uva: 220 + Math.random() * 40,
                uvb: 45 + Math.random() * 15,
                hmfIndex: parseFloat((25 + Math.random() * 20).toFixed(1)), // High HMF indicates overheating/adulteration
            };
        }
        return {
            uva: parseFloat((135 + Math.random() * 15).toFixed(1)),
            uvb: parseFloat((14 + Math.random() * 3).toFixed(1)),
            hmfIndex: parseFloat((3.0 + Math.random() * 2.5).toFixed(1)), // Very fresh
        };
    }
    generateThermalMatrix(isAdulterated) {
        const matrix = [];
        for (let y = 0; y < 24; y++) {
            const row = [];
            for (let x = 0; x < 32; x++) {
                // Temperature gradient around center sample
                const distFromCenter = Math.sqrt(Math.pow(x - 16, 2) + Math.pow(y - 12, 2));
                const temp = 25.0 + Math.exp(-distFromCenter / 8) * 1.5 + (Math.random() - 0.5) * 0.3;
                row.push(parseFloat(temp.toFixed(2)));
            }
            matrix.push(row);
        }
        return matrix;
    }
    calculateChemicalEstimates(honeyType, density, uvData, isAdulterated) {
        if (isAdulterated) {
            return {
                fructose: 28.5,
                glucose: 24.0,
                sucrose: 14.8, // Abnormally high sucrose or corn syrup
                moisture: 21.2,
                hmf: uvData.hmfIndex,
                density: parseFloat(density.toFixed(2)),
                vocIndex: 32.0,
                colorSpectrumChannels: [30, 45, 60, 80, 110, 140, 160, 140, 110, 80, 50],
                nirPeakAbsorbance: 0.62,
            };
        }
        return {
            fructose: parseFloat((41.0 + (Math.random() - 0.5) * 1.5).toFixed(1)),
            glucose: parseFloat((31.0 + (Math.random() - 0.5) * 1.5).toFixed(1)),
            sucrose: parseFloat((0.6 + Math.random() * 0.4).toFixed(1)),
            moisture: parseFloat((15.3 + (Math.random() - 0.5) * 0.8).toFixed(1)),
            hmf: uvData.hmfIndex,
            density: parseFloat(density.toFixed(2)),
            vocIndex: parseFloat((84.0 + (Math.random() - 0.5) * 5).toFixed(1)),
            colorSpectrumChannels: [18, 42, 65, 112, 185, 230, 245, 210, 175, 130, 80],
            nirPeakAbsorbance: 0.94,
        };
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.HardwareService = HardwareService;
