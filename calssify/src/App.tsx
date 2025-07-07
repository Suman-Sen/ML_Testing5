import React, { useState} from "react";
import type { ChangeEvent } from "react";
import axios from "axios";

interface ClassificationResult {
  filename: string;
  label: string;
  file: File;
}

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await axios.post<{ results: { filename: string; label: string }[] }>(
        "http://localhost:5000/classify",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const enriched = res.data.results.map((r) => ({
        ...r,
        file: files.find((f) => f.name === r.filename)!,
      }));

      setResults(enriched);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">
          ID Card Classifier
        </h1>

        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleChange}
            className="block w-full md:w-auto border border-gray-300 rounded px-4 py-2 bg-white shadow-sm"
          />
          <button
            onClick={handleUpload}
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Upload & Classify
          </button>
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {results.map((res, idx) => (
              <div
                key={idx}
                className="bg-white border rounded-lg shadow hover:shadow-lg transition overflow-hidden"
              >
                <img
                  src={URL.createObjectURL(res.file)}
                  alt="ID"
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() =>
                    setEnlargedImage(URL.createObjectURL(res.file))
                  }
                />
                <div className="p-4">
                  <p className="text-sm text-gray-500 truncate">{res.filename}</p>
                  <p className="text-lg font-medium text-blue-700">{res.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enlarged Image Modal */}
        {enlargedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
            onClick={() => setEnlargedImage(null)}
          >
            <img
              src={enlargedImage}
              alt="Enlarged"
              className="max-h-[90%] max-w-[90%] border-4 border-white rounded-lg shadow-xl"
            />
            <button
              className="absolute top-6 right-6 text-white text-3xl font-bold"
              onClick={() => setEnlargedImage(null)}
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;