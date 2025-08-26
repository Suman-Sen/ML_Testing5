// // components/tables/DbResultsTable.tsx
// import React, { Fragment } from "react";

// export interface DbResultEntry {
//   filename?: string;
//   table?: string;
//   column?: string;
//   value?: string | number | null;
//   pii_type?: string;
//   label?: string;
//   inferred_label?: string;
//   metadata?: object;
//   showMetadata?: boolean;
// }

// interface DbResultsTableProps {
//   results: DbResultEntry[];
//   onToggleMetadata: (index: number) => void;
// }

// const DbResultsTable: React.FC<DbResultsTableProps> = ({ results, onToggleMetadata }) => {
//   return (
//     <div className="overflow-x-auto mt-6">
//       <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
//         <thead className="bg-gray-200 text-gray-700">
//           <tr>
//             <th className="px-4 py-2 text-left">Sl. No</th>
//             <th className="px-4 py-2 text-left">Table/File</th>
//             <th className="px-4 py-2 text-left">PII Type</th>
//             <th className="px-4 py-2 text-left">Details</th>
//           </tr>
//         </thead>
//         <tbody>
//           {results.map((res, idx) => (
//             <Fragment key={`db-${res.filename || res.table || idx}`}>
//               <tr className="border-t bg-white hover:bg-gray-50 transition">
//                 <td className="px-4 py-3">{idx + 1}</td>
//                 <td className="px-4 py-3 font-medium text-gray-900">{res.filename || res.table || "-"}</td>
//                 <td className="px-4 py-3">{res.pii_type || res.label || res.inferred_label || "-"}</td>
//                 <td className="px-4 py-3 text-sm text-gray-700">
//                   <button
//                     onClick={() => onToggleMetadata(idx)}
//                     className="text-blue-600 underline"
//                   >
//                     {res.showMetadata ? "Hide" : "Show"} Details
//                   </button>
//                 </td>
//               </tr>
//               {res.showMetadata && (
//                 <tr className="bg-gray-100 border-t">
//                   <td colSpan={4} className="px-6 py-4 text-xs">
//                     <div className="bg-white rounded border p-3 shadow-sm max-w-4xl overflow-x-auto">
//                       <pre className="whitespace-pre-wrap break-words text-xs text-gray-800">
//                         {JSON.stringify(
//                           res.metadata || {
//                             table: res.table,
//                             column: res.column,
//                             value: res.value,
//                             pii_type: res.pii_type,
//                           },
//                           null,
//                           2
//                         )}
//                       </pre>
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default DbResultsTable;

import React, { Fragment } from "react";

export interface DbResultEntry {
  filename?: string;
  table?: string;
  column?: string;
  value?: string | number | null;
  pii_type?: string;
  label?: string;
  inferred_label?: string;
  metadata?: object;
  showMetadata?: boolean;
}

interface DbResultsTableProps {
  results: DbResultEntry[];
  onToggleMetadata: (index: number) => void;
}

const DbResultsTable: React.FC<DbResultsTableProps> = ({
  results,
  onToggleMetadata,
}) => {
  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-200 text-gray-700">
          <tr>
            <th className="px-4 py-2 text-left">Sl. No</th>
            <th className="px-4 py-2 text-left">Table/File</th>
            <th className="px-4 py-2 text-left">PII Type</th>
            <th className="px-4 py-2 text-left">Details</th>
          </tr>
        </thead>
        <tbody>
          {results.map((res, idx) => (
            <Fragment key={`db-${res.filename || res.table || idx}`}>
              <tr className="border-t bg-white hover:bg-gray-50 transition">
                <td className="px-4 py-3">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {res.filename || res.table || "-"}
                </td>
                <td className="px-4 py-3">
                  {res.pii_type || res.label || res.inferred_label || "-"}
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
                  <td colSpan={4} className="px-6 py-4 text-xs">
                    <div className="bg-white rounded border p-3 shadow-sm max-w-4xl overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-words text-xs text-gray-800">
                        {JSON.stringify(
                          {
                            table: res.table,
                            column: res.column,
                            pii_type: res.pii_type,
                            value: res.value ? "REDACTED" : undefined,
                            ...(res.metadata || {}),
                          },
                          null,
                          2
                        )}
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
