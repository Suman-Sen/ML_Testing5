import React, { Fragment } from "react";

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
    [key: string]: any;
  };
  showMetadata?: boolean;
}

interface DbResultsTableProps {
  results: DbResultEntry[];
  onToggleMetadata: (index: number) => void;
}

const DbResultsTable: React.FC<DbResultsTableProps> = ({ results, onToggleMetadata }) => {
  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-200 text-gray-700">
          <tr>
            <th className="px-4 py-2 text-left">Sl. No</th>
            <th className="px-4 py-2 text-left">Table</th>
            <th className="px-4 py-2 text-left">Row ID</th>
            <th className="px-4 py-2 text-left">Fields</th>
            <th className="px-4 py-2 text-left">Details</th>
          </tr>
        </thead>
        <tbody>
          {results.map((res, idx) => (
            <Fragment key={`db-${res.table}-${res.rowId || idx}`}>
              <tr className="border-t bg-white hover:bg-gray-50 transition">
                <td className="px-4 py-3">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{res.table || "-"}</td>
                <td className="px-4 py-3">{res.rowId || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {res.fields
                    ? Object.entries(res.fields).map(([field, info]) => (
                        <div key={field}>
                          <strong>{field}</strong>: {info.pii_type}
                        </div>
                      ))
                    : "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <button
                    onClick={() => onToggleMetadata(idx)}
                    className="text-blue-600 underline"
                  >
                    {res.showMetadata ? "Hide" : "Show"} Details
                  </button>
                </td>
              </tr>
              {res.showMetadata && (
                <tr className="bg-gray-100 border-t">
                  <td colSpan={5} className="px-6 py-4 text-xs">
                    <div className="bg-white rounded border p-3 shadow-sm max-w-4xl overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-words text-xs text-gray-800">
                        {JSON.stringify(res.metadata || {}, null, 2)}
                      </pre>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DbResultsTable;
