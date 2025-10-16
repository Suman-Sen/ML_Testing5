import React from "react";
export interface TableMetadata {
  name: string;
  owner: string;
  rowCount: string;
  classifications: {
    pii: number;
    identifiers: number;
    Behavioral: number;
  };
}

interface DbScanMetadataProps {
  metadata: {
    db_Name: string;
    table_metadata: TableMetadata[];
  };
}

const DbScanMetadata: React.FC<DbScanMetadataProps> = ({ metadata }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">
        Database Metadata
      </h3>
      <p className="text-sm text-gray-700 mb-4">
        <strong>Database Name:</strong> {metadata.db_Name}
      </p>
      <table className="min-w-full bg-white border border-gray-300 rounded">
        <thead className="bg-gray-200 text-gray-700">
          <tr>
            <th className="px-4 py-2 text-left">Table</th>
            <th className="px-4 py-2 text-left">Owner</th>
            <th className="px-4 py-2 text-left">Row Count</th>
            <th className="px-4 py-2 text-left">PII</th>
            <th className="px-4 py-2 text-left">Identifiers</th>
            <th className="px-4 py-2 text-left">Behavioral</th>
          </tr>
        </thead>
        <tbody>
          {metadata.table_metadata.map((table) => (
            <tr key={table.name} className="border-t">
              <td className="px-4 py-2">{table.name}</td>
              <td className="px-4 py-2">{table.owner}</td>
              <td className="px-4 py-2">{table.rowCount}</td>
              <td className="px-4 py-2">{table.classifications.pii}</td>
              <td className="px-4 py-2">{table.classifications.identifiers}</td>
              <td className="px-4 py-2">{table.classifications.Behavioral}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DbScanMetadata;
