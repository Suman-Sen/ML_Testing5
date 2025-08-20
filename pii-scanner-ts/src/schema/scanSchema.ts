import { z } from "zod";
import { PII_PATTERNS } from "../utils/regexRules";


const db_type = z.enum(["POSTGRES", "MYSQL", "ORACLE"]);


export const metadataSchema = z.object({
    conn_string: z.string().min(5),
    db_type: db_type
});

export const fullPiiScanSchema = z.object({
    conn_string: z.string().min(5),
    pii_type: PII_PATTERNS,
    db_type: db_type

})

export const tablePiiSchema = z.object({
    conn_string: z.string().min(5),
    db_type: db_type,
    pii_type: PII_PATTERNS
})