import React, { Fragment } from "react";

interface DocumentPiiResult {
  file_name: string;
  pii_found: boolean;
  pii_types?: {
    [key: string]: string[];
  };
  showMetadata?: boolean;
  [key: string]: any;
}

interface DocumentPiiResultsTableProps {
  results: DocumentPiiResult[];
  loading?: boolean;
  onToggleMetadata: (index: number) => void;
}

const DocumentPiiResultsTable: React.FC<DocumentPiiResultsTableProps> = ({
  results,
  loading = false,
  onToggleMetadata,
}) => {
  if (!loading && results.length === 0) {
    return <div className="text-gray-700 py-3">No results for Document PII scan.</div>;
  }

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-200 text-gray-700">
          <tr>
            <th className="px-4 py-2 text-left">Sl. No</th>
            <th className="px-4 py-2 text-left">File</th>
            <th className="px-4 py-2 text-left">PII Found</th>
            <th className="px-4 py-2 text-left">PII Types</th>
            <th className="px-4 py-2 text-left">Show Details</th>
          </tr>
        </thead>
        <tbody>
          {results.map((res, idx) => {
            const piiTypeNames = res.pii_types
              ? Object.keys(res.pii_types).filter((k) => res.pii_types?.[k]?.length)
              : [];

            return (
              <Fragment key={`${res.file_name || "docpii"}-${idx}`}>
                <tr className="border-t bg-white hover:bg-gray-50 transition">
                  <td className="px-4 py-3">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {res.file_name || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {res.pii_found ? (
                      <span className="text-green-700 font-bold">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {piiTypeNames.length > 0 ? piiTypeNames.join(", ") : "-"}
                  </td>
                  <td className="px-4 py-3">
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
                          {JSON.stringify(res, null, 2)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentPiiResultsTable;
