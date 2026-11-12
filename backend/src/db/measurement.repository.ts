import { Prisma, PrismaClient } from '@prisma/client';
import { HoneySampleRecord } from './store';

class MeasurementRepository {
  private readonly client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  private toJson(record: HoneySampleRecord): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(record)) as Prisma.InputJsonValue;
  }

  private fromJson(value: Prisma.JsonValue): HoneySampleRecord {
    return value as unknown as HoneySampleRecord;
  }

  async create(record: HoneySampleRecord): Promise<void> {
    await this.client.hardwareMeasurement.create({
      data: {
        id: record.id,
        batchNumber: record.batchNumber,
        barcode: record.barcode,
        testedAt: new Date(record.testedAt),
        analysisStatus: record.analysisStatus || 'NOT_EVALUATED',
        record: this.toJson(record),
      },
    });
  }

  async list(limit = 250): Promise<HoneySampleRecord[]> {
    const rows = await this.client.hardwareMeasurement.findMany({
      orderBy: { testedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
    });
    return rows.map((row) => this.fromJson(row.record));
  }

  async findById(id: string): Promise<HoneySampleRecord | null> {
    const row = await this.client.hardwareMeasurement.findUnique({ where: { id } });
    return row ? this.fromJson(row.record) : null;
  }

  async findByBarcode(barcode: string): Promise<HoneySampleRecord | null> {
    const row = await this.client.hardwareMeasurement.findUnique({
      where: { barcode: barcode.trim().toUpperCase() },
    });
    return row ? this.fromJson(row.record) : null;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.$queryRawUnsafe('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}

export const measurementRepository = new MeasurementRepository();
