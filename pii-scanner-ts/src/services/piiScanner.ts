import { PII_PATTERNS } from "../utils/regexRules";

let rowCounter = 0;
export function scanRow(
  table: string,
  row: Record<string, any>,
  allowedTypes?: string[]
) {
  const results: Record<string, any> = {};
  const rowId = `row_${rowCounter++}`;
  const patterns = allowedTypes
    ? Object.fromEntries(
        Object.entries(PII_PATTERNS).filter(([k]) => allowedTypes.includes(k))
      )
    : PII_PATTERNS;

  for (const [key, value] of Object.entries(row)) {
    for (const [piiType, regex] of Object.entries(patterns)) {
      if (typeof value === "string" && regex.test(value)) {
        if (!results[table]) results[table] = {};
        if (!results[table][rowId]) results[table][rowId] = {};
        results[table][rowId][piiType] = {
          field: key,
          detected: true,
        };
      }
    }
  }
  return results;
}

let tableRowCounter = 0;
export function scanTableRow(
  table: string,
  row: Record<string, any>,
  allowedTypes?: string[]
) {
  const rowId = `row_${tableRowCounter++}`;
  const patterns = allowedTypes
    ? Object.fromEntries(
        Object.entries(PII_PATTERNS).filter(([k]) => allowedTypes.includes(k))
      )
    : PII_PATTERNS;

  const detectedTypes: Set<string> = new Set();
  for (const value of Object.values(row)) {
    if (typeof value !== "string") continue;

    for (const [piiType, regex] of Object.entries(patterns)) {
      if (regex.test(value)) {
        detectedTypes.add(piiType);
      }
    }
  }
  return {
    table,
    rowId,
    piiFound: detectedTypes.size > 0,
    types: Array.from(detectedTypes),
  };
}
