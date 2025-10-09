-- CreateTable
CREATE TABLE "public"."ImageResult" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "label" "public"."imageLabel" NOT NULL,
    "confidence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'dv-1.0.0',
    "batchId" TEXT,

    CONSTRAINT "ImageResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentResult" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "piiFound" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'dv-1.0.0',
    "batchId" TEXT,

    CONSTRAINT "DocumentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentClassification" (
    "id" TEXT NOT NULL,
    "piiType" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'dv-1.0.0',

    CONSTRAINT "DocumentClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentResult_batchId_idx" ON "public"."DocumentResult"("batchId");

-- CreateIndex
CREATE INDEX "DocumentClassification_documentId_idx" ON "public"."DocumentClassification"("documentId");

-- AddForeignKey
ALTER TABLE "public"."ImageResult" ADD CONSTRAINT "ImageResult_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentResult" ADD CONSTRAINT "DocumentResult_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentClassification" ADD CONSTRAINT "DocumentClassification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."DocumentResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
