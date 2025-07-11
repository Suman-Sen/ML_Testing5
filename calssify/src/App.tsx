import React, { useState } from "react";
import type { ChangeEvent } from "react";
import axios, { AxiosError } from "axios";
import NavBar from "./components/ui/NavBar";
import IQ from "/images/IQ.png";

interface Metadata {
  [key: string]: string | number | null | undefined;
}

interface ClassificationResult {
  filename: string;
  label?: string;
  inferred_label?: string;
  file: File;
  metadata?: Metadata;
  showMetadata?: boolean;
}

interface ServerResponse {
  results: Omit<ClassificationResult, "file" | "showMetadata">[];
}

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<"classify" | "metadata">("classify");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleScan = async (endpoint: "classify" | "metadata") => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    setMode(endpoint);
    setLoading(true);
    setProgress(10);

    const timer = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 10 : p));
    }, 200);

    try {
      const res = await axios.post<ServerResponse>(
        `http://localhost:5000/${endpoint}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total) {
              const percent = Math.round((e.loaded * 100) / e.total);
              setProgress(percent);
            }
          },
        }
      );

      if (!Array.isArray(res.data.results)) {
        throw new Error("Unexpected server response format");
      }

      const enriched: ClassificationResult[] = res.data.results.map((r) => ({
        ...r,
        file: files.find((f) => f.name === r.filename)!,
        showMetadata: false,
      }));

      setResults(enriched);
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response
          ? error.response.data?.error || "Server error"
          : (error as Error).message;
      alert("Error uploading files: " + message);
      console.error("Upload failed:", error);
    } finally {
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  const toggleMetadata = (index: number) => {
    setResults((prev) =>
      prev.map((res, i) => (i === index ? { ...res, showMetadata: !res.showMetadata } : res))
    );
  };

  return (
    <>
      <NavBar logoSrc={IQ} />
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">
            ID Card Classifier
          </h1>

          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <label htmlFor="file-upload" className="text-sm font-medium text-gray-700">
              Upload Images or PDFs
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleChange}
              className="block w-full md:w-auto border border-gray-300 rounded px-4 py-2 bg-white shadow-sm"
            />

            <button
              onClick={() => handleScan("classify")}
              className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
              disabled={loading || files.length === 0}
            >
              ML Scan
            </button>
            <button
              onClick={() => handleScan("metadata")}
              className="bg-purple-600 text-white font-semibold px-6 py-2 rounded hover:bg-purple-700 transition disabled:opacity-50"
              disabled={loading || files.length === 0}
            >
              Filename-based Scan
            </button>
          </div>

          {loading && (
            <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mb-6">
              <div
                className="bg-blue-600 h-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {results.length > 0 && (
            <div className="overflow-x-auto mt-6">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
                <thead className="bg-gray-200 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Sl. No</th>
                    <th className="px-4 py-2 text-left">Filename</th>
                    {mode === "metadata" && (
                      <th className="px-4 py-2 text-left">Filename-based Label</th>
                    )}
                    {mode === "classify" && (
                      <th className="px-4 py-2 text-left">ML Predicted Label</th>
                    )}
                    <th className="px-4 py-2 text-left">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, idx) => (
                    <React.Fragment key={res.filename + idx}>
                      <tr className="border-t bg-white hover:bg-gray-50 transition">
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{res.filename}</td>

                        {mode === "metadata" && (
                          <td className="px-4 py-3">{res.inferred_label || "-"}</td>
                        )}
                        {mode === "classify" && (
                          <td className="px-4 py-3">{res.label || "-"}</td>
                        )}

                        <td className="px-4 py-3 text-sm text-gray-700">
                          {res.metadata ? (
                            <button
                              onClick={() => toggleMetadata(idx)}
                              className="text-blue-600 underline text-sm"
                            >
                              {res.showMetadata ? "Hide Metadata" : "Show Metadata"}
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>

                      {res.showMetadata && res.metadata && (
                        <tr className="bg-gray-100 border-t">
                          <td colSpan={mode === "classify" ? 4 : 5} className="px-6 py-4 text-xs">
                            <div className="bg-white rounded border p-3 shadow-sm max-w-4xl overflow-x-auto">
                              <pre className="whitespace-pre-wrap break-words text-xs text-gray-800">
                                {JSON.stringify(res.metadata, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App;
