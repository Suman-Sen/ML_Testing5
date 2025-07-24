from flask import Blueprint, request, jsonify
from db.connector import create_connection
from utils.metadata_extractor import classify_metadata
from utils.pii_detector import scan_table

routes = Blueprint('routes', __name__)

@routes.route('/metadata-classify', methods=['POST'])
def metadata_classify():
    conn_str = request.json.get('conn_string')
    engine, inspector = create_connection(conn_str)
    metadata = classify_metadata(inspector)
    return jsonify(metadata)

@routes.route('/full-pii-scan', methods=['POST'])
def full_scan():
    conn_str = request.json.get('conn_string')
    pii_types = request.json.get('pii_types')  # may be None
    engine, inspector = create_connection(conn_str)
    all_tables = inspector.get_table_names()
    full_scan_data = []
    for tbl in all_tables:
        full_scan_data.extend(scan_table(engine, tbl, allowed_types=pii_types))
    return jsonify(full_scan_data)

@routes.route('/table-pii-scan', methods=['POST'])
def table_scan():
    conn_str = request.json.get('conn_string')
    table_name = request.json.get('table_name')
    pii_types = request.json.get('pii_types')
    engine, _ = create_connection(conn_str)
    scan_result = scan_table(engine, table_name, allowed_types=pii_types)
    return jsonify(scan_result)
