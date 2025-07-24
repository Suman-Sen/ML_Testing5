PII_PATTERNS = {
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'phone': r'\b\d{10}\b',
    'aadhaar': r'\b\d{4}\s\d{4}\s\d{4}\b',
    'pan': r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b',
    'passport': r'\b[A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9]\b',
    'ssn': r'\b\d{3}-\d{2}-\d{4}\b',
     "ifsc": r"\b[A-Z]{4}0[A-Z0-9]{6}\b",
    "credit_card": r"\b(?:\d[ -]*?){13,16}\b",
    "ip_address": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    "mac_address": r"\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b",
    "dob": r"\b(?:\d{1,2}[-/th|st|nd|rd\s]*)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\s]*\d{2,4}\b|\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b",
    "gender": r"\b(?:male|female|other|non-binary|transgender)\b",
    "name": r"\b[A-Z][a-z]+\s[A-Z][a-z]+\b",
    "address": r"\d{1,5}\s\w+\s\w+",
    "voter_id": r"\b[A-Z]{3}[0-9]{7}\b",
    "bank_account": r"\b\d{9,18}\b",
    "vehicle_reg": r"\b[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}\b",
    "employee_id": r"\bEMP[0-9]{4,6}\b",
    "medical_record": r"\bMRN[0-9]{6,8}\b",
    "insurance_policy": r"\b[A-Z]{2}[0-9]{10}\b"

}
