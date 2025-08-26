import express, { Request, Response } from 'express';
import { createPool, getSampleRows } from '../services/db';
import { scanRow, scanTableRow } from '../services/piiScanner';
import { PII_PATTERNS } from '../utils/regexRules';
import { validator } from '../middleware/requestValidator';
import { fullPiiScanSchema, metadataSchema, tablePiiSchema } from '../schema/scanSchema';

const router = express.Router();

router.post('/metadata-classify', validator(metadataSchema), async (req: Request, res: Response) => {
    try {
        const { conn_string } = req.body;
        const pool = createPool(conn_string);
        const client = await pool.connect();
        const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);

        const groupedMetadata: Record<string, any[]> = {};

        for (const row of tables.rows) {
            const tableName = row.table_name;
            const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${tableName}'`);

            groupedMetadata[tableName] = cols.rows.map(col => ({
                column: col.column_name,
                type: col.data_type,
                pii_type: Object.keys(PII_PATTERNS).find(p => col.column_name.toLowerCase().includes(p)) || null
            }));
        }

        client.release();
        // res.json(metadata).status(200);
        res.status(200).json(groupedMetadata);

    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error in /metadata-classify: ${error.message}`);
        } else {
            console.error(`Error in /metadata-classify: ${String(error)}`);
        }
    }
});

router.post('/full-pii-scan', validator(fullPiiScanSchema), async (req: Request, res: Response) => {
    try {
        const { conn_string, pii_types, db_type } = req.body; // Added db_type extraction
        const pool = createPool(conn_string);
        const client = await pool.connect();
        const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
        const results: Record<string, any> = {};

        for (const row of tables.rows) {
            const rows = await getSampleRows(conn_string, db_type, row.table_name);
            for (const dataRow of rows) {
                const rowResult = scanRow(row.table_name, dataRow, pii_types);
                for (const [tbl, tblData] of Object.entries(rowResult)) {
                    if (!results[tbl]) results[tbl] = {};
                    Object.assign(results[tbl], tblData);
                }
            }
        }

        client.release();
        res.json(results).status(200);

    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error in /full-pii-scan: ${error.message}`);
        } else {
            console.error(`Error in /full-pii-scan: ${String(error)}`);
        }
    }
});

router.post('/table-pii-scan', validator(tablePiiSchema), async (req: Request, res: Response) => {
    try {
        const { conn_string, table_name, pii_types } = req.body;
        const pool = createPool(conn_string);
        const client = await pool.connect();
        const data = await client.query(`SELECT * FROM ${table_name} LIMIT 100`);
        //   @ts-ignore
        // const results = data.rows.flatMap(row => scanTableRow(table_name, row, pii_types));
        const results = data.rows.flatMap(row => scanTableRow(table_name, row, pii_types));
        client.release();
        res.json(results).status(200);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error in /table-pii-scan: ${error.message}`);
        } else {
            console.error(`Error in /table-pii-scan: ${String(error)}`);
        }
    }
});

export default router;
