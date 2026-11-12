import { spawn } from 'child_process';
import { createInterface } from 'readline';
import path from 'path';

export interface ScanOptions {
  batchNumber: string;
}

export interface HardwareScanResult {
  mode: 'serial';
  device: string;
  batchNumber: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  measurements: {
    color: { r: number; g: number; b: number; samples: number };
    uv: { adcRaw: number; voltage: number | null; samples: number };
    infrared: { objectTemperatureC: number; samples: number };
  };
  limitations: string[];
}

export interface HardwareScanCallbacks {
  onProgress?: (stage: string, percent: number) => void;
  onSensorData?: (type: 'color' | 'uv' | 'ir', data: unknown) => void;
}

/**
 * Real Arduino serial integration.
 *
 * There is deliberately no simulated fallback. A missing port, missing pySerial
 * installation, malformed frame or absent sensor must fail rather than
 * manufacture a measurement.
 */
export class HardwareService {
  async scan(options: ScanOptions, callbacks: HardwareScanCallbacks = {}): Promise<HardwareScanResult> {
    const port = process.env.SERIAL_PORT?.trim();
    if (!port) {
      throw new Error('SERIAL_PORT is not configured. Set it to the Arduino port (for example COM5 or /dev/ttyACM0).');
    }

    const baud = Number(process.env.SERIAL_BAUD_RATE || 9600);
    if (!Number.isInteger(baud) || baud < 300 || baud > 2000000) {
      throw new Error('SERIAL_BAUD_RATE is invalid.');
    }

    const python = process.env.HARDWARE_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
    const script = path.resolve(__dirname, '../../hardware/serial_bridge.py');
    const timeoutMs = Number(process.env.HARDWARE_TIMEOUT_MS || 45000);
    const startedAt = new Date().toISOString();

    callbacks.onProgress?.('فتح الاتصال التسلسلي مع Arduino والتحقق من وصول البيانات', 5);

    return new Promise<HardwareScanResult>((resolve, reject) => {
      let settled = false;
      let finalResult: HardwareScanResult | null = null;

      const child = spawn(python, [script, port, String(baud), options.batchNumber], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
        windowsHide: true,
      });

      const timeout = setTimeout(() => {
        child.kill();
        finish(new Error(`Hardware scan timed out after ${timeoutMs} ms.`));
      }, timeoutMs);

      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (error) reject(error);
        else if (finalResult) resolve(finalResult);
        else reject(new Error('Hardware bridge exited without a completed measurement.'));
      };

      const lines = createInterface({ input: child.stdout });
      lines.on('line', (line) => {
        try {
          const event = JSON.parse(line);
          if (event.type === 'progress') {
            callbacks.onProgress?.(String(event.stage || 'جاري جمع القراءات'), Number(event.percent || 0));
          } else if (event.type === 'sensor') {
            callbacks.onSensorData?.(event.sensor, event.data);
          } else if (event.type === 'complete') {
            finalResult = {
              mode: 'serial',
              device: port,
              batchNumber: options.batchNumber,
              startedAt,
              completedAt: new Date().toISOString(),
              durationSeconds: Number(event.durationSeconds || 0),
              measurements: event.measurements,
              limitations: [
                'TCS34725 reports RGB/clear-channel color readings; it is not a multi-wavelength spectrometer.',
                'GY-ML8511 provides an analog UV response; no wavelength-resolved spectrum or absorbance is inferred.',
                'MLX90614 reports infrared temperature; it is not an MLX90640 thermal imaging array.',
                'No honey-purity or adulteration verdict is produced until reference-lab data and a validated method are available.',
              ],
            };
          } else if (event.type === 'error') {
            finish(new Error(String(event.message || 'Hardware bridge error.')));
          }
        } catch {
          // The Python bridge reserves stdout for JSON; ignore unexpected diagnostic lines.
        }
      });

      let stderr = '';
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
        if (stderr.length > 8000) stderr = stderr.slice(-8000);
      });

      child.on('error', (error) => finish(new Error(`Cannot start hardware bridge: ${error.message}`)));
      child.on('close', (code) => {
        if (code === 0 && finalResult) finish();
        else finish(new Error(stderr.trim() || `Hardware bridge exited with code ${code}.`));
      });
    });
  }
}
