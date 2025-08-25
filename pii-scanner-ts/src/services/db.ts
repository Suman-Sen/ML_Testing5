import { Pool } from 'pg';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import oracledb from 'oracledb';
dotenv.config();

export function createPool(connString: string) {
  return new Pool({ connectionString: connString });
}

// src/services/db.ts
export async function getSampleRows(connString: string, dbType: string, table: string): Promise<any[]> {
  if (dbType === 'postgres') {
    const pool = new Pool({ connectionString: connString });
    const client = await pool.connect();
    const res = await client.query(`SELECT * FROM "${table}" LIMIT 100`);
    client.release();
    return res.rows;
  }

  if (dbType === 'mysql') {
    const conn = await mysql.createConnection(connString);
    const [rows] = await conn.execute(`SELECT * FROM \`${table}\` LIMIT 100`);
    return rows as any[];
  }

  if (dbType === 'oracle') {
    const conn = await oracledb.getConnection({ connectString: connString });
    const result = await conn.execute(`SELECT * FROM "${table}" WHERE ROWNUM <= 100`);
    await conn.close();
    return result.rows || [];
  }

  throw new Error(`Unsupported DB type: ${dbType}`);
}
