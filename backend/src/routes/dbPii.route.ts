import axios from "axios";
import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import { PrismaClient } from "../../prisma/generated/prisma";

const DB_scan_URL = "http://localhost:5000";
const router = Router();
const prisma = new PrismaClient();

type payload = {
  conn_string: string;
  db_type: string;
  pii_types?: string | string[];
};

router.post(
  "/db-pii",
  asyncHandler(async (req: Request, res: Response) => {
    const { conn_string, scan_type, table_name, pii_types, db_type } = req.body;
    const payload: payload = { conn_string, db_type };
    let endpoint: string = "";

    switch (scan_type) {
      case "pii-meta":
        endpoint = "/metadata-classify";
        break;
      case "pii-full":
        endpoint = "/full-pii-scan";
        payload.pii_types = pii_types;
        break;
      case "pii-table":
        endpoint = "/table-pii-scan";
        payload.pii_types = pii_types;
        break;
      default:
        res.status(400).json({ error: "Invalid pii scan type" });
        return;
    }

    try {
      const response = await axios.post(`${DB_scan_URL}${endpoint}`, payload);
      const scanData = response.data.results;

      // TODO: Delete it after users are built
      // Creates or reuses the user
      const user = await prisma.user.upsert({
        where: { email: "johndoe@example.com" },
        update: {},
        create: {
          email: "johndoe@example.com",
          role: "SCANNER",
          firstName: "Seeded",
          lastName: "User",
        },
      });

      // Creates the batch
      const batch = await prisma.batch.create({
        data: {
          scanType: "DOCUMENT_SCAN",
          creatorId: user.id,
          totalNumFiles: 1,
        },
      });

      // Creates the DB record
      const dbRecord = await prisma.db.create({
        data: {
          databaseName: scanData.metadata.db_Name,
          scanType: "PII_FULL",
          dbType: db_type.toUpperCase(),
          batchId: batch.id,
          totalNumOfTableScans: scanData.table_scans.length,
        },
      });

      // Stores the metadata
      for (const table of scanData.metadata.table_metadata) {
        await prisma.dbFullPiiMetadata.create({
          data: {
            tableName: table.name,
            rowCount: parseInt(table.rowCount),
            pii: table.classifications.pii,
            identifiers: table.classifications.identifiers,
            behavioral: table.classifications.Behavioral,
            owner: table.owner,
            dbId: dbRecord.id,
          },
        });
      }

      // Store full scan results
      for (const table of scanData.table_scans) {
        for (const column of table.columns) {
          await prisma.dbFullPiiResult.create({
            data: {
              tableName: table.name,
              columnName: column.name,
              datatype: column.DataType,
              classification: column.classifications,
              scanned: column.scaned,
              matched: column.matched,
              accuracy: parseFloat(column.accuracy),
              dbId: dbRecord.id,
            },
          });
        }
      }

      res.json({ status: "DB scan complete", batchId: batch.id });
    } catch (error) {
      //   console.error("DB scan failed:", error);
      res.status(500).json({ error: "Failed to query the DB scan server" });
    }
  })
);

export default router;
