import { z } from "zod";
import { PII_PATTERNS } from "../utils/regexRules";
import { ta } from "zod/v4/locales/index.cjs";

// Create a Zod enum from the keys of PII_PATTERNS
const piiTypeEnum = z.enum(
  Object.keys(PII_PATTERNS) as [keyof typeof PII_PATTERNS, ...string[]]
);

// TODO: clean the below enum
const db_type = z.enum([
  "POSTGRES",
  "MYSQL",
  "ORACLE",
  "postgres",
  "mysql",
  "oracle",
]);

export const metadataSchema = z.object({
  conn_string: z.string().min(5),
  db_type: db_type.optional(),
});

export const fullPiiScanSchema = z.object({
  conn_string: z.string().min(5),
  pii_types: z.array(piiTypeEnum).optional(),
  db_type: db_type.optional(),
});

export const tablePiiSchema = z.object({
  conn_string: z.string().min(5),
  table_name: z.string().min(2).max(100),
  db_type: db_type.optional(),
  pii_types: z.array(piiTypeEnum).optional(),
});
