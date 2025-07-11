import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import NavBar from "./components/ui/NavBar";
import IQ from "/images/IQ.png";
import { v4 as uuidv4 } from "uuid";

interface Metadata {
  [key: string]: string | number | null | undefined;
}

interface ClassificationResult {
  filename: string;
  label?: string;
  inferred_label?: string;
  metadata?: Metadata;
  showMetadata?: boolean;
}

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<"classify" | "metadata">("classify");
  const wsRef = useRef<WebSocket | null>(null);
  const requestId = useRef<string>(uuidv4());

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const toggleMetadata = (index: number) => {
    setResults((prev) =>
      prev.map((res, i) => (i === index ? { ...res, showMetadata: !res.showMetadata } : res))
    );
  };

  const upload = async (scanType: "classify" | "metadata") => {
    if (files.length === 0) return;

    setLoading(true);
    setMode(scanType);
    setProgress(10);
    setResults([]);
    const id = uuidv4();
    requestId.current = id;

    // Set up WebSocket listener
    wsRef.current = new WebSocket("ws://localhost:5000");

    wsRef.current.onopen = () => {
      wsRef.current?.send(JSON.stringify({ id, type: scanType }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.requestId !== id) return;

      setResults((prev) => [
        ...prev,
        ...data.batch.map((r: any) => ({ ...r, showMetadata: false })),
      ]);

      setProgress((prev) => Math.min(prev + 15, 95));
    };

    wsRef.current.onerror = (e) => {
      console.error("WebSocket error:", e);
      alert("WebSocket error occurred.");
    };

    wsRef.current.onclose = () => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    };

    // Upload images
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    try {
      await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      alert("Upload failed.");
      console.error(err);
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <NavBar logoSrc={IQ} />
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">
            ID Card Classifier (Live Streaming)
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
              onChange={handleFileChange}
              className="block w-full md:w-auto border border-gray-300 rounded px-4 py-2 bg-white shadow-sm"
            />

            <button
              onClick={() => upload("classify")}
              className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
              disabled={loading || files.length === 0}
            >
              ML Scan
            </button>
            <button
              onClick={() => upload("metadata")}
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
