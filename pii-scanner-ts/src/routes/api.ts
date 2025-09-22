import express, { Request, Response } from "express";
import { createPool, getSampleRows } from "../services/db";
import { scanRow, scanTableRow } from "../services/piiScanner";
import { PII_PATTERNS } from "../utils/regexRules";
import { validator } from "../middleware/requestValidator";
import {
  fullPiiScanSchema,
  metadataSchema,
  tablePiiSchema,
} from "../schema/scanSchema";
import { scanTablesWithMetadata } from "../utils/includeMetadata";

const router = express.Router();

router.post(
  "/metadata-classify",
  validator(metadataSchema),
  async (req: Request, res: Response) => {
    try {
      const { conn_string } = req.body;
      const pool = createPool(conn_string);
      const client = await pool.connect();
      const tables = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
      );

      const groupedMetadata: Record<string, Record<string, any>> = {};

      for (const row of tables.rows) {
        const tableName = row.table_name;
        const cols = await client.query(
          `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${tableName}'`
        );

        groupedMetadata[tableName] = {};

        for (const col of cols.rows) {
          const columnName = col.column_name;
          const dataType = col.data_type;
          const inferredPiiType =
            Object.keys(PII_PATTERNS).find((p) =>
              columnName.toLowerCase().includes(p)
            ) || null;

          groupedMetadata[tableName][columnName] = {
            type: dataType,
            pii_type: inferredPiiType,
          };
        }
      }

      client.release();
      res.status(200).json(groupedMetadata);
    } catch (error) {
      console.error(
        `Error in /metadata-classify: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      res.status(500).json({ error: "Failed to classify metadata" });
    }
  }
);

router.post(
  "/full-pii-scan",
  validator(fullPiiScanSchema),
  async (req: Request, res: Response) => {
    try {
      const { conn_string, pii_types, db_type } = req.body;
      const pool = createPool(conn_string);
      const client = await pool.connect();
      const tables = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
      );
      const tableNames = tables.rows.map((row) => row.table_name);
      client.release();

      const scanOutput = await scanTablesWithMetadata(
        conn_string,
        db_type,
        tableNames,
        pii_types
      );
      res.status(200).json(scanOutput);
    } catch (error) {
      console.error(
        `Error in /full-pii-scan: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      res.status(500).json({ error: "Failed to perform full PII scan" });
    }
  }
);

router.post(
  "/table-pii-scan",
  validator(tablePiiSchema),
  async (req: Request, res: Response) => {
    try {
      const { conn_string, table_name, pii_types, db_type } = req.body;
      const { metadata, results } = await scanTablesWithMetadata(
        conn_string,
        db_type,
        [table_name],
        pii_types
      );
      res.status(200).json({ metadata, results });
    } catch (error) {
      console.error(
        `Error in /table-pii-scan: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      res.status(500).json({ error: "Failed to scan table for PII" });
    }
  }
);

export default router;
