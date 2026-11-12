const { randomUUID } = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const id = 'ci-' + randomUUID();
const barcode = 'CI-' + randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();

async function main() {
  const record = {
    id,
    batchNumber: 'CI-' + Date.now(),
    barcode,
    testedAt: new Date().toISOString(),
    analysisStatus: 'NOT_EVALUATED',
    sensorData: {
      rawReadings: {
        color: { r: 10, g: 20, b: 30 },
        uv: { raw: 400, unit: 'raw_adc' },
        ir: { temperatureC: 28.5 },
        acquiredAt: new Date().toISOString(),
        device: { port: 'CI', baudRate: 9600 },
      },
    },
  };

  try {
    await prisma.hardwareMeasurement.create({
      data: {
        id,
        batchNumber: record.batchNumber,
        barcode,
        testedAt: new Date(record.testedAt),
        analysisStatus: record.analysisStatus,
        record,
      },
    });

    const saved = await prisma.hardwareMeasurement.findUnique({ where: { id } });
    if (!saved || saved.barcode !== barcode || saved.record.sensorData.rawReadings.uv.raw !== 400) {
      throw new Error('PostgreSQL measurement round-trip verification failed.');
    }

    console.log('PostgreSQL measurement create/read smoke test passed.');
  } finally {
    await prisma.hardwareMeasurement.deleteMany({ where: { id } });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
