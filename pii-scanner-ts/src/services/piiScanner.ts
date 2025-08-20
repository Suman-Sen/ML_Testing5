import { PII_PATTERNS } from '../utils/regexRules';

export function scanRow(row: Record<string, any>, allowedTypes?: string[]) {
  const results = [];
  const patterns = allowedTypes
    ? Object.fromEntries(Object.entries(PII_PATTERNS).filter(([k]) => allowedTypes.includes(k)))
    : PII_PATTERNS;

  for (const [key, value] of Object.entries(row)) {
    for (const [piiType, regex] of Object.entries(patterns)) {
      if (typeof value === 'string' && regex.test(value)) {
        results.push({ column: key, value, piiType });
      }
    }
  }
  return results;
}
