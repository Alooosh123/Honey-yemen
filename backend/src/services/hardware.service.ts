import { spawn } from 'child_process';
import path from 'path';
import { Socket } from 'socket.io';

export interface ScanOptions {
  batchNumber: string;
  honeyType?: string;
  originRegion?: string;
  shopId?: string;
  shopName?: string;
}

export interface RawHardwareReadings {
  color: { r: number; g: number; b: number };
  uv: { raw: number; unit: string };
  ir: { temperatureC: number };
  device: { port: string; baudRate: number };
  acquiredAt: string;
}

type BridgeEvent =
  | { event: 'progress'; stage: string; percent: number }
  | { event: 'data'; type: 'color' | 'uv' | 'ir'; data: unknown; percent: number }
  | { event: 'warning'; message: string; line?: string }
  | { event: 'error'; message: string }
  | { event: 'complete'; readings: RawHardwareReadings };

export class HardwareService {
  async acquireScan(socket: Socket, _options: ScanOptions): Promise<RawHardwareReadings> {
    const serialPort = process.env.HONEY_SERIAL_PORT?.trim();
    if (!serialPort) {
      throw new Error(
        'HONEY_SERIAL_PORT is not configured. Set it to the Arduino COM port (for example COM5) before starting a real scan.'
      );
    }

    const python = process.env.HONEY_PYTHON_EXECUTABLE ||
      (process.platform === 'win32' ? 'python' : 'python3');
    const scriptPath = process.env.HONEY_SERIAL_BRIDGE_SCRIPT ||
      path.resolve(__dirname, '../../../hardware/serial_bridge.py');
    const scanTimeout = Number(process.env.HONEY_SCAN_TIMEOUT_SECONDS || 45);
    if (!Number.isFinite(scanTimeout) || scanTimeout <= 0) {
      throw new Error('HONEY_SCAN_TIMEOUT_SECONDS must be a positive number.');
    }

    socket.emit('scan_progress', {
      stage: 'الاتصال بمنفذ Arduino وتهيئة القراءة الحقيقية',
      stageEn: 'Connecting to Arduino serial device',
      percent: 5,
    });

    return new Promise<RawHardwareReadings>((resolve, reject) => {
      const child = spawn(python, [scriptPath], {
        cwd: path.resolve(__dirname, '../../..'),
        env: {
          ...process.env,
          HONEY_SERIAL_PORT: serialPort,
          HONEY_SERIAL_BAUD: process.env.HONEY_SERIAL_BAUD || '9600',
          HONEY_SCAN_TIMEOUT_SECONDS: String(scanTimeout),
        },
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdoutBuffer = '';
      let stderrBuffer = '';
      let settled = false;

      const timer = setTimeout(() => {
        child.kill();
        finish(new Error('Hardware scan exceeded ' + (scanTimeout + 10) + ' seconds.'));
      }, (scanTimeout + 10) * 1000);

      const finish = (error?: Error, result?: RawHardwareReadings) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) {
          child.kill();
          reject(error);
        } else if (result) resolve(result);
        else reject(new Error('Hardware bridge exited without a completed measurement set.'));
      };

      child.stdout!.setEncoding('utf8');
      child.stdout!.on('data', (chunk: string) => {
        stdoutBuffer += chunk;
        const lines = stdoutBuffer.split(/\r?\n/);
        stdoutBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: BridgeEvent;
          try {
            event = JSON.parse(line) as BridgeEvent;
          } catch {
            socket.emit('scan_warning', { message: 'Ignored malformed hardware bridge output.' });
            continue;
          }

          if (event.event === 'progress') {
            socket.emit('scan_progress', {
              stage: event.stage,
              stageEn: 'Collecting real sensor readings',
              percent: event.percent,
            });
          } else if (event.event === 'data') {
            socket.emit('scan_data', { type: event.type, data: event.data });
            socket.emit('scan_progress', {
              stage: 'تم استلام قراءة ' + event.type.toUpperCase(),
              stageEn: 'Received ' + event.type.toUpperCase() + ' measurement',
              percent: event.percent,
            });
          } else if (event.event === 'warning') {
            socket.emit('scan_warning', { message: event.message });
          } else if (event.event === 'error') {
            finish(new Error(event.message));
          } else if (event.event === 'complete') {
            finish(undefined, event.readings);
          }
        }
      });

      child.stderr!.setEncoding('utf8');
      child.stderr!.on('data', (chunk: string) => {
        stderrBuffer = (stderrBuffer + chunk).slice(-4000);
      });

      child.on('error', (error) => {
        finish(new Error('Unable to start the Python serial bridge: ' + error.message));
      });

      child.on('close', (code) => {
        if (settled) return;
        if (stdoutBuffer.trim()) {
          try {
            const event = JSON.parse(stdoutBuffer) as BridgeEvent;
            if (event.event === 'complete') {
              finish(undefined, event.readings);
              return;
            }
            if (event.event === 'error') {
              finish(new Error(event.message));
              return;
            }
          } catch {
            // The process exit handling below reports a useful diagnostic.
          }
        }
        finish(new Error(
          ('Hardware bridge exited with code ' + (code ?? 'unknown') + '. ' + stderrBuffer.trim()).trim()
        ));
      });
    });
  }
}
