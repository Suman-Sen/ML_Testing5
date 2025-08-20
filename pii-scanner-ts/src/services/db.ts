import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export function createPool(connString: string) {
  return new Pool({ connectionString: connString });
}
