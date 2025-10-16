import React from "react";

interface ColumnScan {
  name: string;
  DataType: string;
  classifications: string;
  scaned: number;
  matched: number;
  accuracy: string;
}
// In DbResultsTable.tsx or a separate types file
export interface DbResultEntry {
  table?: string;
  rowId?: string;
  fields?: {
    [fieldName: string]: {
      pii_type: string;
      detected: boolean;
    };
  };
  metadata?: {
    [key: string]: unknown;
  };
  showMetadata?: boolean;
}
export interface TableScan {
  name: string;
  columns: ColumnScan[];
  showMetadata?: boolean;
}

interface DbResultsTableProps {
  results: TableScan[];
  onToggleMetadata: (index: number) => void;
}

const DbResultsTable: React.FC<DbResultsTableProps> = ({ results }) => {
  return (
    <div className="overflow-x-auto mt-6">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">
        Table Scan Results
      </h3>
      {results.map((table, idx) => (
        <div key={table.name} className="mb-6">
          <h4 className="text-md font-bold text-gray-800 mb-2">
            {idx + 1}. {table.name}
          </h4>
          {table.columns.length > 0 ? (
            <table className="min-w-full bg-white border border-gray-300 rounded">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Column</th>
                  <th className="px-4 py-2 text-left">Data Type</th>
                  <th className="px-4 py-2 text-left">Classification</th>
                  <th className="px-4 py-2 text-left">Scanned</th>
                  <th className="px-4 py-2 text-left">Matched</th>
                  <th className="px-4 py-2 text-left">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((col) => (
                  <tr key={col.name} className="border-t">
                    <td className="px-4 py-2">{col.name}</td>
                    <td className="px-4 py-2">{col.DataType}</td>
                    <td className="px-4 py-2">{col.classifications}</td>
                    <td className="px-4 py-2">{col.scaned}</td>
                    <td className="px-4 py-2">{col.matched}</td>
                    <td className="px-4 py-2">{col.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-600">
              No PII detected in this table.
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DbResultsTable;
