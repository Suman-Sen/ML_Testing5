from .regex_rules import PII_PATTERNS
import re

def scan_table(engine, table_name):
    results = []
    with engine.connect() as conn:
        query = f'SELECT * FROM "{table_name}" LIMIT 1000'  # Avoid scanning huge data
        result_proxy = conn.execute(query)
        rows = result_proxy.fetchall()
        columns = result_proxy.keys()

        for row in rows:
            for idx, value in enumerate(row):
                for pii, pattern in PII_PATTERNS.items():
                    if value and re.search(pattern, str(value)):
                        results.append({
                            'table': table_name,
                            'column': columns[idx],
                            'value': str(value),
                            'pii_type': pii
                        })
    return results
