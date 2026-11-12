CREATE TABLE "HardwareMeasurement" (
    "id" TEXT NOT NULL,
    "batchNumber" VARCHAR(80) NOT NULL,
    "barcode" VARCHAR(32) NOT NULL,
    "testedAt" TIMESTAMP(3) NOT NULL,
    "analysisStatus" VARCHAR(32) NOT NULL DEFAULT 'NOT_EVALUATED',
    "record" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HardwareMeasurement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HardwareMeasurement_barcode_key"
    ON "HardwareMeasurement"("barcode");

CREATE INDEX "HardwareMeasurement_batchNumber_idx"
    ON "HardwareMeasurement"("batchNumber");

CREATE INDEX "HardwareMeasurement_testedAt_idx"
    ON "HardwareMeasurement"("testedAt");
