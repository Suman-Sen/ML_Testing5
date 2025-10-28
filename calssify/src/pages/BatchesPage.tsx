import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Batch {
  id: string;
  scanType: string;
  totalNumFiles: number;
  createdAt: string;
}

const BatchesPage: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3000/batches")
      .then((response) => {
        setBatches(response.data);
      })
      .catch((error) => {
        console.error("Error fetching batches:", error);
      });
  }, []);

  const handleBatchClick = (id: string) => {
    navigate(`/batches/${id}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Batches</h1>
      <ul className="space-y-2">
        {batches.map((batch) => (
          <li
            key={batch.id}
            className="p-4 border rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => handleBatchClick(batch.id)}
          >
            <div>
              <strong>ID:</strong> {batch.id}
            </div>
            <div>
              <strong>Scan Type:</strong> {batch.scanType}
            </div>
            <div>
              <strong>Total Files:</strong> {batch.totalNumFiles}
            </div>
            <div>
              <strong>Created At:</strong>{" "}
              {new Date(batch.createdAt).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BatchesPage;
