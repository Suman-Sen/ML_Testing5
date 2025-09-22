import React from "react";

interface DbScanMetadataProps {
  metadata: {
    totalTablesScanned: number;
    totalRowsScanned: number;
    totalPiiFound: number;
    piiTypeDistribution: Record<string, number>;
  };
}

const DbScanMetadata: React.FC<DbScanMetadataProps> = ({ metadata }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">Scan Summary</h3>
      <ul className="text-sm text-gray-700 space-y-1">
        <li><strong>Total Tables Scanned:</strong> {metadata.totalTablesScanned}</li>
        <li><strong>Total Rows Scanned:</strong> {metadata.totalRowsScanned}</li>
        <li><strong>Total PII Found:</strong> {metadata.totalPiiFound}</li>
        <li><strong>PII Type Distribution:</strong>
          <ul className="ml-4 list-disc">
            {Object.entries(metadata.piiTypeDistribution).map(([type, count]) => (
              <li key={type}>{type}: {count}</li>
            ))}
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default DbScanMetadata;
