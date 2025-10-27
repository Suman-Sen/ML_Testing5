import React, { Fragment } from "react";

export interface DocumentPiiResult {
  file_name: string;
  pii_found: boolean;

  // counts per PII type
  classifications?: Record<string, number>;

  pii_types?: {
    [key: string]: unknown[];
  };

  showMetadata?: boolean;
  // Allow additional fields from backend
  [key: string]: unknown;
}

interface DocumentPiiResultsTableProps {
  results: DocumentPiiResult[];
  loading?: boolean;
  onToggleMetadata: (index: number) => void;
}

const PII_TYPE_ORDER = [
  "name",
  "email",
  "phone",
  "address",
  "aadhaar",
  "pan",
  "ssn",
  "bank_account",
];

function sortCounts(
  arr: Array<{ type: string; count: number }>
): Array<{ type: string; count: number }> {
  return arr
    .filter((t) => t.count > 0)
    .sort((a, b) => {
      const ia = PII_TYPE_ORDER.indexOf(a.type);
      const ib = PII_TYPE_ORDER.indexOf(b.type);
      if (ia !== -1 && ib !== -1 && ia !== ib) return ia - ib; // preferred order
      if (a.count !== b.count) return b.count - a.count; // then by count desc
      return a.type.localeCompare(b.type); // then alpha
    });
}

/** Unify new (classifications) and old (pii_types) formats into counts */
function getPiiTypeCounts(res: DocumentPiiResult): Array<{ type: string; count: number }> {
  if (res.classifications && typeof res.classifications === "object") {
    return sortCounts(
      Object.entries(res.classifications).map(([type, count]) => ({
        type,
        count: Number(count) || 0,
      }))
    );
  }

  if (res.pii_types && typeof res.pii_types === "object") {
    return sortCounts(
      Object.entries(res.pii_types).map(([type, arr]) => ({
        type,
        count: Array.isArray(arr) ? arr.length : 0,
      }))
    );
  }

  return [];
}

function totalHits(counts: Array<{ type: string; count: number }>) {
  return counts.reduce((sum, t) => sum + t.count, 0);
}

/** Compact summary like: "name (7), phone (6), email (2), +3 more" */
function formatSummary(counts: Array<{ type: string; count: number }>, maxItems = 4) {
  if (!counts.length) return "-";
  const shown = counts.slice(0, maxItems).map((c) => `${c.type} (${c.count})`);
  const extra = counts.length - shown.length;
  return extra > 0 ? `${shown.join(", ")}, +${extra} more` : shown.join(", ");
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
            const counts = getPiiTypeCounts(res);
            const summary = formatSummary(counts, Infinity);
            const total = totalHits(counts);

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
                    {res.pii_found && total > 0 && (
                      <span className="ml-2 text-xs text-gray-600">({total})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{summary}</td>
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Counts Table */}
                        <div className="bg-white rounded border p-3 shadow-sm overflow-x-auto">
                          <div className="font-semibold text-gray-800 mb-2">
                            PII Type Breakdown
                          </div>
                          {counts.length > 0 ? (
                            <table className="min-w-[320px] text-xs">
                              <thead>
                                <tr className="text-gray-600">
                                  <th className="text-left py-1 pr-4">Type</th>
                                  <th className="text-right py-1">Count</th>
                                </tr>
                              </thead>
                              <tbody>
                                {counts.map((c) => (
                                  <tr key={c.type} className="border-t">
                                    <td className="py-1 pr-4">{c.type}</td>
                                    <td className="py-1 text-right">{c.count}</td>
                                  </tr>
                                ))}
                                <tr className="border-t font-semibold">
                                  <td className="py-1 pr-4">Total</td>
                                  <td className="py-1 text-right">{total}</td>
                                </tr>
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-gray-600">No PII counts available.</div>
                          )}
                        </div>

                        {/* Raw JSON */}
                        <div className="bg-white rounded border p-3 shadow-sm max-w-full overflow-x-auto">
                          <div className="font-semibold text-gray-800 mb-2">Raw Result</div>
                          <pre className="whitespace-pre-wrap break-words text-gray-800">
                            {JSON.stringify(res, null, 2)}
                          </pre>
                        </div>
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
