import { Pool } from "pg";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import oracledb from "oracledb";

dotenv.config();

export function createPool(connString: string) {
  return new Pool({ connectionString: connString });
}

export async function getSampleRows(
  connString: string,
  dbType: string,
  table: string
): Promise<any[]> {
  if (dbType === "postgres") {
    const pool = new Pool({ connectionString: connString });
    const client = await pool.connect();
    const res = await client.query(`SELECT * FROM "${table}"`);
    client.release();
    return res.rows;
  }

  if (dbType === "mysql") {
    const conn = await mysql.createConnection(connString);
    const [rows] = await conn.execute(`SELECT * FROM \`${table}\``);
    return rows as any[];
  }

  if (dbType === "oracle") {
    const conn = await oracledb.getConnection({ connectString: connString });
    const result = await conn.execute(`SELECT * FROM "${table}"`);
    await conn.close();
    return result.rows || [];
  }

  throw new Error(`Unsupported DB type: ${dbType}`);
}

export async function getTableOwner(
  connString: string,
  dbType: string,
  table: string
): Promise<string> {
  try {
    if (dbType === "postgres") {
      const pool = new Pool({ connectionString: connString });
      const client = await pool.connect();
      const query = `
        SELECT pg_user.usename AS owner
        FROM pg_tables
        JOIN pg_user ON pg_tables.tableowner = pg_user.usename
        WHERE tablename = $1
      `;
      const res = await client.query(query, [table]);
      client.release();
      return res.rows[0]?.owner || "Unknown";
    }

    if (dbType === "mysql") {
      const conn = await mysql.createConnection(connString);
      const [rows] = await conn.execute(
        `SELECT table_name, table_schema, table_type, table_comment, create_options 
         FROM information_schema.tables 
         WHERE table_name = ?`,
        [table]
      );
      // MySQL doesn't store owner directly; fallback to user from connection
      return conn.config.user || "Unknown";
    }

    if (dbType === "oracle") {
      const conn = await oracledb.getConnection({ connectString: connString });
      const result = await conn.execute(
        `SELECT owner FROM all_tables WHERE table_name = :table`,
        [table.toUpperCase()],
        { outFormat: oracledb.OUT_FORMAT_OBJECT } // ✅ Correct format
      );
      await conn.close();

      const rows = result.rows as { owner: string }[]; // ✅ Type assertion
      return rows?.[0]?.owner || "Unknown";
    }

    return "Unknown";
  } catch (err) {
    console.error(`Error fetching owner for table ${table}:`, err);
    return "Unknown";
  }
}
