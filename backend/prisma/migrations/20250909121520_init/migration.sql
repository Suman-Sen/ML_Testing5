-- CreateEnum
CREATE TYPE "public"."imageLabel" AS ENUM ('AADHAAR', 'PAN', 'PASSPORT');

-- CreateEnum
CREATE TYPE "public"."scanType" AS ENUM ('IMAGE_SCAN', 'PDF_SCAN', 'DOCUMENT_SCAN');

-- CreateEnum
CREATE TYPE "public"."dbScanType" AS ENUM ('PII_META', 'PII_FULL', 'PII_TABLE');

-- CreateEnum
CREATE TYPE "public"."dbType" AS ENUM ('POSTGRES', 'MYSQL', 'ORACLE');

-- CreateEnum
CREATE TYPE "public"."Classification" AS ENUM ('pii', 'identifiers', 'Behavioral', 'Operational');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "emp_id" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'dv-1.0.0',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Batch" (
    "id" TEXT NOT NULL,
    "scanType" "public"."scanType" NOT NULL,
    "totalNumFiles" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'dv-1.0.0',

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PiiSelected" (
    "id" TEXT NOT NULL,
    "piiName" TEXT[],
    "version" TEXT NOT NULL DEFAULT 'dv-1.0.0',
    "batchId" TEXT,

    CONSTRAINT "PiiSelected_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Db" (
    "id" TEXT NOT NULL,
    "databaseName" TEXT NOT NULL,
    "scanType" "public"."dbScanType" NOT NULL,
    "dbType" "public"."dbType" NOT NULL,
    "totalNumOfTableScans" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'dv-1.0.0',
    "batchId" TEXT NOT NULL,

    CONSTRAINT "Db_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dbFullPiiMetadata" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "pii" INTEGER NOT NULL,
    "identifiers" INTEGER NOT NULL,
    "behavioral" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'dv-1.0.0',
    "dbId" TEXT NOT NULL,

    CONSTRAINT "dbFullPiiMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dbFullPiiResult" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "columnName" TEXT,
    "datatype" TEXT,
    "classification" "public"."Classification",
    "scanned" INTEGER,
    "matched" INTEGER,
    "accuracy" DOUBLE PRECISION,
    "version" TEXT NOT NULL DEFAULT 'dv-1.0.0',
    "dbId" TEXT NOT NULL,

    CONSTRAINT "dbFullPiiResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_emp_id_key" ON "public"."User"("emp_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "PiiSelected_batchId_idx" ON "public"."PiiSelected"("batchId");

-- CreateIndex
CREATE INDEX "Db_batchId_idx" ON "public"."Db"("batchId");

-- CreateIndex
CREATE INDEX "dbFullPiiMetadata_dbId_idx" ON "public"."dbFullPiiMetadata"("dbId");

-- CreateIndex
CREATE INDEX "dbFullPiiResult_dbId_idx" ON "public"."dbFullPiiResult"("dbId");

-- AddForeignKey
ALTER TABLE "public"."Batch" ADD CONSTRAINT "Batch_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PiiSelected" ADD CONSTRAINT "PiiSelected_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Db" ADD CONSTRAINT "Db_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dbFullPiiMetadata" ADD CONSTRAINT "dbFullPiiMetadata_dbId_fkey" FOREIGN KEY ("dbId") REFERENCES "public"."Db"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dbFullPiiResult" ADD CONSTRAINT "dbFullPiiResult_dbId_fkey" FOREIGN KEY ("dbId") REFERENCES "public"."Db"("id") ON DELETE CASCADE ON UPDATE CASCADE;
