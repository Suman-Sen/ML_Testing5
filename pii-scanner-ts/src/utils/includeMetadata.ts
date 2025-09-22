import { scanRow } from "../services/piiScanner";
import { getSampleRows } from "../services/db";
import { PII_PATTERNS } from "../utils/regexRules";
// Example stub (you'll need to implement this based on your DB type)
import { getTableOwner } from "../services/db";

export async function scanTablesWithMetadata(
  conn_string: string,
  db_type: string,
  tables: string[],
  pii_types?: string[]
): Promise<any> {
  const metadataTables: any[] = [];
  const tablesResult: any[] = [];

  for (const table of tables) {
    const rows = await getSampleRows(conn_string, db_type, table);
    const rowCount = rows.length;

    const columnScanStats: Record<string, any> = {};
    const classificationsCount: Record<string, number> = {
      pii: 0,
      identifiers: 0,
      Behavioral: 0,
    };

    for (const dataRow of rows) {
      const rowResult = scanRow(table, dataRow, pii_types);

      for (const [tbl, tblData] of Object.entries(rowResult)) {
        for (const [rowId, piiFields] of Object.entries(tblData)) {
          // @ts-ignore
          for (const [piiType, info] of Object.entries(piiFields)) {
            // @ts-ignore
            const field = info.field;
            if (!columnScanStats[field]) {
              columnScanStats[field] = {
                name: field,
                DataType: typeof dataRow[field],
                classifications: classifyPiiType(piiType),
                scaned: 0,
                matched: 0,
              };
            }
            columnScanStats[field].scaned += 1;
            columnScanStats[field].matched += 1;
            classificationsCount[classifyPiiType(piiType)] += 1;
          }
        }
      }
    }

    const columns = Object.values(columnScanStats).map((col: any) => ({
      ...col,
      accuracy: ((col.matched / col.scaned) * 100).toFixed(2),
    }));
    const owner = await getTableOwner(conn_string, db_type, table);
    metadataTables.push({
      name: table,
      owner,
      rowCount: rowCount.toString(),
      classifications: classificationsCount,
    });

    tablesResult.push({
      name: table,
      columns,
    });
  }
  const dbName = extractDbName(conn_string);

  return {
    results: {
      metadata: {
        db_Name: dbName,
        table_metadata: metadataTables,
      },
      table_scans: tablesResult,
    },
  };
}

function extractDbName(connString: string): string {
  const match = connString.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : "Unknown_DB";
}

function classifyPiiType(
  piiType: string
): "pii" | "identifiers" | "Behavioral" {
  const pii = [
    "email",
    "phone",
    "aadhaar",
    "pan",
    "ssn",
    "dob",
    "gender",
    "name",
  ];
  const identifiers = ["id", "order_id", "sales_id", "employee_id", "voter_id"];
  const behavioral = ["ip_address", "mac_address", "location", "device"];

  if (pii.includes(piiType)) return "pii";
  if (identifiers.includes(piiType)) return "identifiers";
  if (behavioral.includes(piiType)) return "Behavioral";
  return "pii"; // default fallback
}

interface ScanMetadata {
  totalTablesScanned: number;
  totalRowsScanned: number;
  totalPiiFound: number;
  piiTypeDistribution: Record<string, number>;
}

interface ScanResult {
  metadata: ScanMetadata;
  results: Record<string, any>;
}
