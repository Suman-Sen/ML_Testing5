import type { DbResultEntry } from "../components/results/DbResultsTable";

// utils/flattenMetadataResults.ts
export interface MetadataEntry {
  table: string;
  column: string;
  type: string;
  pii_type: string | null;
}

export const flattenScanResults = (
    data: Record<string, Record<string, Record<string, { field: string; detected: boolean }>>>
): DbResultEntry[] => {
    const flattened: DbResultEntry[] = [];

    for (const [tableName, rows] of Object.entries(data)) {
        for (const [rowId, piiMap] of Object.entries(rows)) {
            for (const [piiType, piiInfo] of Object.entries(piiMap)) {
                flattened.push({
                    table: tableName,
                    // @ts-ignore
                    column: piiInfo.field,
                    pii_type: piiType,
                    metadata: piiInfo,
                    showMetadata: false,
                });
                
            }
        }
    }

    return flattened;
};


export const flattenMetadataResults = (
  data: Record<string, Record<string, { type: string; pii_type: string | null }>>
): MetadataEntry[] => {
  const flattened: MetadataEntry[] = [];

  for (const [tableName, columns] of Object.entries(data)) {
    for (const [columnName, info] of Object.entries(columns)) {
      flattened.push({
        table: tableName,
        column: columnName,
        type: info.type,
        pii_type: info.pii_type,
      });
    }
  }

  return flattened;
};
