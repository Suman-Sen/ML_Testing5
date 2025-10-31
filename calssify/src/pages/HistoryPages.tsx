
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface BatchHistory {
  id: string;
  scanType: string;
  totalNumFiles: number;
  createdAt: string;
  summary: string;
}

const HistoryPage: React.FC = () => {
  const [batches, setBatches] = useState<BatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3000/batches")
      .then((response) => {
        // Add a summary field for display (could be improved with real data)
        const data = response.data.map((b: any) => ({
          ...b,
          summary: `ScanType: ${b.scanType}, Files: ${b.totalNumFiles}`,
        }));
        setBatches(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (axios.isAxiosError(err)) {
            setError(err.message || "Failed to fetch batch history");
        } else {
    setError("An unexpected error occurred");
  }
        setLoading(false);
      });
  }, []);

  const handleBatchClick = (id: string) => {
    navigate(`/batches/${id}`);
  };

  let content;
  if (loading) {
    content = <div className="flex items-center justify-center h-96 text-lg">Loading…</div>;
  } else if (error || batches.length === 0) {
    content = (
      <div className="flex items-center justify-center h-96">
        <span className="text-gray-500 text-xl font-semibold">No files scanned yet</span>
      </div>
    );
  } else {
    content = (
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Batch ID</th>
              <th className="p-3 text-left">Scan Type</th>
              <th className="p-3 text-left">Files</th>
              <th className="p-3 text-left">Created At</th>
              <th className="p-3 text-left">Summary</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr
                key={batch.id}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => handleBatchClick(batch.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleBatchClick(batch.id);
                }}
                aria-label={`View details for batch ${batch.id}`}
              >
                <td className="p-3 font-mono text-blue-700 underline">{batch.id}</td>
                <td className="p-3">{batch.scanType}</td>
                <td className="p-3">{batch.totalNumFiles}</td>
                <td className="p-3">{new Date(batch.createdAt).toLocaleString()}</td>
                <td className="p-3">{batch.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <h1 className="text-2xl font-semibold mb-4 text-center">Batch Scan History</h1>
      <div className="w-full max-w-xl">{content}</div>
    </div>
  );
};

export default HistoryPage;