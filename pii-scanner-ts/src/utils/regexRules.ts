export const PII_PATTERNS: Record<string, RegExp> = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  phone: /\b\d{10}\b/,
  aadhaar: /\b\d{12}\b/, // 12 continuous digits only
  pan: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/,
  passport: /\b[A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9]\b/,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
  ifsc: /\b[A-Z]{4}0[A-Z0-9]{6}\b/,
  credit_card: /\b\d{16}\b/, // 16 continuous digits only
  ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  mac_address: /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/,
  dob: /\b(?:\d{1,2}[-/th|st|nd|rd\s]*)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\s]*\d{2,4}\b|\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/,
  gender: /\b(?:male|female|other|non-binary|transgender)\b/,
  name: /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/,
  address: /\d{1,5}\s\w+\s\w+/,
  voter_id: /\b[A-Z]{3}[0-9]{7}\b/,
  bank_account: /\b\d{9,18}\b/,
  vehicle_reg: /\b[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}\b/,
  employee_id: /\bEMP[0-9]{4,6}\b/,
  medical_record: /\bMRN[0-9]{6,8}\b/,
  insurance_policy: /\b[A-Z]{2}[0-9]{10}\b/,
};
