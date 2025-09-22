import React from "react";
import PiiTypeSelector from "./forms/PiiTypeSelector";

interface DbScanFormProps {
  dbConnString: string;
  dbScanType: "pii-meta" | "pii-full" | "pii-table";
  tableName: string;
  dbLoading: boolean;
  setDbConnString: (val: string) => void;
  setDbScanType: (val: "pii-meta" | "pii-full" | "pii-table") => void;
  setTableName: (val: string) => void;
  runDbScan: () => void;
  selectedPiiTypes: string[];
  setSelectedPiiTypes: (types: string[]) => void;
}

const DbScanForm: React.FC<DbScanFormProps> = ({
  dbConnString,
  dbScanType,
  tableName,
  dbLoading,
  setDbConnString,
  setDbScanType,
  setTableName,
  runDbScan,
  selectedPiiTypes,
  setSelectedPiiTypes
}) => {
  return (
    <>
      <h2 className="text-xl font-bold text-blue-800 mb-4">DB Scan</h2>
      <div className="space-y-4 mb-6">
        <label className="block text-sm font-medium text-gray-700">
          DB Connection String
        </label>
        <input
          type="text"
          value={dbConnString}
          onChange={(e) => setDbConnString(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          title="Enter database connection string"
          placeholder="Database connection string"
        />

        <label htmlFor="scan-type-select" className="block text-sm font-medium text-gray-700">
          Scan Type
        </label>
        <select
          id="scan-type-select"
          value={dbScanType}
          onChange={(e) => setDbScanType(e.target.value as "pii-meta" | "pii-full" | "pii-table")}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="pii-meta">Metadata Only</option>
          <option value="pii-full">Full Scan</option>
          <option value="pii-table">Single Table</option>
        </select>

        {dbScanType === "pii-table" && (
          <>
            <label className="block text-sm font-medium text-gray-700">
              Table Name
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="e.g. customers"
            />
          </>
        )}

        {/* PII Type Selector */}
        
        {(dbScanType==='pii-full' ||dbScanType==='pii-table' )&&<PiiTypeSelector
          selected={selectedPiiTypes}
          setSelected={setSelectedPiiTypes}
        />
        }
        <button
          onClick={runDbScan}
          className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          disabled={dbLoading || !dbConnString}
        >
          Run DB Scan
        </button>
      </div>
    </>
  );
};

export default DbScanForm;
