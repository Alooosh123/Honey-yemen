import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { HoneySampleRecord } from '../db/store';

export class PDFService {
  async generateReport(sample: HoneySampleRecord): Promise<string> {
    const reportsDir = path.join(process.cwd(), 'public', 'reports');
    await fs.promises.mkdir(reportsDir, { recursive: true });

    const fileName = 'measurement_' + sample.id.replace(/[^a-zA-Z0-9_-]/g, '') + '.pdf';
    const filePath = path.join(reportsDir, fileName);
    const appUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const verificationUrl = appUrl + '/verify?code=' + encodeURIComponent(sample.barcode);
    const qrBuffer = await QRCode.toBuffer(verificationUrl, { width: 150, margin: 1 });

    return new Promise<string>((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      doc.on('error', reject);
      stream.on('error', reject);
      stream.on('finish', () => resolve('/reports/' + fileName));
      doc.pipe(stream);

      const raw = sample.sensorData.rawReadings;
      const line = (label: string, value: string) => {
        doc.font('Helvetica-Bold').fillColor('#334155').text(label, 52, doc.y, { continued: true, width: 210 });
        doc.font('Helvetica').fillColor('#0f172a').text(value);
        doc.moveDown(0.35);
      };

      doc.rect(28, 28, 539, 785).lineWidth(1.5).strokeColor('#d97706').stroke();
      doc.fillColor('#78350f').font('Helvetica-Bold').fontSize(21)
        .text('HONEY DEVICE MEASUREMENT RECORD', 48, 55, { align: 'center' });
      doc.fillColor('#b91c1c').fontSize(12)
        .text('NOT AN AUTHENTICITY CERTIFICATE — PURITY NOT EVALUATED', { align: 'center' });
      doc.moveDown(1.5);

      doc.image(qrBuffer, 414, 125, { width: 115, height: 115 });
      doc.fillColor('#475569').font('Helvetica').fontSize(8)
        .text('Open verification record', 414, 244, { width: 115, align: 'center' });

      doc.fillColor('#0f172a').fontSize(10);
      line('Record ID: ', sample.id);
      line('Batch number: ', sample.batchNumber);
      line('Barcode: ', sample.barcode);
      line('Operator-entered honey type: ', sample.honeyType || 'Not provided');
      line('Origin entered by operator: ', sample.originRegion || 'Not provided');
      line('Acquisition time: ', new Date(sample.testedAt).toISOString());
      line('Assessment status: ', 'NOT EVALUATED — reference laboratory validation required');

      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#92400e')
        .text('MEASURED RAW SENSOR READINGS');
      doc.moveDown(0.5);
      doc.fontSize(10);

      if (raw) {
        line('TCS34725 red count: ', String(raw.color.r));
        line('TCS34725 green count: ', String(raw.color.g));
        line('TCS34725 blue count: ', String(raw.color.b));
        line('GY-ML8511 output: ', String(raw.uv.raw) + ' (' + raw.uv.unit + ')');
        line('GY-906 / MLX90614 object temperature: ', raw.ir.temperatureC.toFixed(2) + ' °C');
        line('Serial baud rate: ', String(raw.device.baudRate));
      } else {
        line('Raw sensor readings: ', 'Not available for this record');
      }

      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#92400e')
        .text('INTERPRETATION LIMITATION');
      doc.moveDown(0.4);
      doc.font('Helvetica').fontSize(9).fillColor('#334155')
        .text(
          'This report stores raw RGB, UV sensor output and infrared object-temperature readings only. ' +
          'These measurements do not directly determine fructose, glucose, sucrose, moisture, HMF, density, ' +
          'botanical origin or honey authenticity. No purity score, AI confidence or pass/fail decision is issued. ' +
          'A validated reference method, traceable calibration and representative blinded sample validation ' +
          'are required before any authenticity claim can be made.',
          { width: 485, align: 'justify', lineGap: 4 }
        );

      doc.moveDown(2);
      doc.strokeColor('#cbd5e1').moveTo(48, doc.y).lineTo(547, doc.y).stroke();
      doc.moveDown(0.6);
      doc.font('Helvetica').fontSize(8).fillColor('#64748b')
        .text('Automatically generated technical record. It is not a laboratory accreditation or conformity certificate.', {
          width: 500,
          align: 'center',
        });

      doc.end();
    });
  }
}
