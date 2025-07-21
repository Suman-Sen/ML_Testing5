import React, { useState, useRef, Fragment, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import NavBar from "./components/ui/NavBar";
const IQ = "/images/IQ.png";

interface Metadata {
  [key: string]: string | number | null | undefined;
}
interface ClassificationResult {
  filename: string;
  label?: string;
  inferred_label?: string;
  metadata?: Metadata;
  pii_type?: string;
  table?: string;
  column?: string;
  value?: string | number | null;
  showMetadata?: boolean;
}
interface DocumentPiiResult {
  file_name: string;
  pii_found: boolean;
  locations?: Record<string, string[]>;
  pii_types?: Record<string, string[]>;
  [k: string]: any;
  showMetadata?: boolean;
}

type ScanTab = "image" | "db" | "document-pii";

const App: React.FC = () => {
  // Section selector
  const [currentTab, setCurrentTab] = useState<ScanTab>("image");

  //    Image Scan (ML/Filename) State 
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageResults, setImageResults] = useState<ClassificationResult[]>([]);
  const [imageProgress, setImageProgress] = useState<number>(0);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageMode, setImageMode] = useState<"classify" | "metadata">("classify");

  //    DB Scan State
  const [dbConnString, setDbConnString] = useState<string>("");
  const [dbScanType, setDbScanType] = useState<"pii-meta" | "pii-full" | "pii-table">("pii-full");
  const [tableName, setTableName] = useState<string>("");
  const [dbResults, setDbResults] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState<boolean>(false);

  //    Document PII Scan State
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [documentPiiResults, setDocumentPiiResults] = useState<DocumentPiiResult[]>([]);
  const [docPiiLoading, setDocPiiLoading] = useState(false);
  const [docPiiProgress, setDocPiiProgress] = useState(0);

  // WebSocket support for each tab
  const wsRef = useRef<WebSocket | null>(null);
  const requestId = useRef<string>(uuidv4());

  // Cleanup on tab switch
  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setImageResults([]);
    setImageFiles([]);
    setDbResults([]);
    setDocumentPiiResults([]);
    setDocFiles([]);
  }, [currentTab]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  //    Image Scan (ML/Filename)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const toggleImageMetadata = (index: number) => {
    setImageResults((prev) =>
      prev.map((res, i) =>
        i === index ? { ...res, showMetadata: !res.showMetadata } : res
      )
    );
  };

  const uploadImageScan = async (scanType: "classify" | "metadata") => {
    if (imageFiles.length === 0 || imageLoading) return;

    setImageLoading(true);
    setImageMode(scanType);
    setImageProgress(10);
    setImageResults([]);

    const id = uuidv4();
    requestId.current = id;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    const socket = new WebSocket("ws://localhost:3000");
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ id, type: scanType }));
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.requestId !== id) return;
      if (data.done) {
        socket.close();
        return;
      }
      setImageResults((prev) => [
        ...prev,
        ...(data.batch || []).map((r: any) => ({ ...r, showMetadata: false })),
      ]);
      setImageProgress((prev) => Math.min(prev + 15, 95));
    };
    socket.onerror = () => {
      setImageLoading(false);
      setImageProgress(0);
      socket.close();
    };
    socket.onclose = () => {
      setImageProgress(100);
      setTimeout(() => {
        setImageLoading(false);
        setImageProgress(0);
      }, 500);
    };

    const formData = new FormData();
    imageFiles.forEach((file) => formData.append("images", file));
    try {
      await fetch(`http://localhost:3000/upload?id=${id}&type=${scanType}`, {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      setImageLoading(false);
      setImageProgress(0);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
  };

  //                DB Scan
  const runDbScan = async () => {
    if (!dbConnString) return;
    setDbLoading(true);
    setDbResults([]);
    try {
      const res = await fetch("http://localhost:3000/db-pii", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conn_string: dbConnString,
          type: dbScanType,
          table: dbScanType === "pii-table" ? tableName : undefined,
        }),
      });
      const json = await res.json();
      setDbResults(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("DB scan failed:", err);
    } finally {
      setDbLoading(false);
    }
  };

  //      Document PII Scan 
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocFiles(Array.from(e.target.files));
    }
  };

  const toggleDocPiiMetadata = (index: number) => {
    setDocumentPiiResults((prev) =>
      prev.map((res, i) =>
        i === index ? { ...res, showMetadata: !res.showMetadata } : res
      )
    );
  };

  const uploadDocumentPii = async () => {
    if (docFiles.length === 0 || docPiiLoading) return;

    setDocPiiLoading(true);
    setDocPiiProgress(10);
    setDocumentPiiResults([]);

    const id = uuidv4();
    requestId.current = id;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    const socket = new WebSocket("ws://localhost:3000");
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ id, type: "document-pii" }));
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.requestId !== id) return;

      if (Array.isArray(data.results)) {
        setDocumentPiiResults(data.results.map((r: any) => ({ ...r, showMetadata: false })));
        setDocPiiProgress((prev) => Math.min(prev + 15, 95));
      } else if (data.results) {
        setDocumentPiiResults([{ ...data.results, showMetadata: false }]);
        setDocPiiProgress((prev) => Math.min(prev + 15, 95));
      }
      if (data.error) {
        setDocumentPiiResults([{ file_name: "Error", pii_found: false, error: data.error, showMetadata: false }]);
        setDocPiiLoading(false);
        setDocPiiProgress(0);
      }
      if (data.done) {
        socket.close();
        setDocPiiProgress(100);
      }
    };
    socket.onerror = () => {
      setDocPiiLoading(false);
      setDocPiiProgress(0);
      socket.close();
    };
    socket.onclose = () => {
      setTimeout(() => {
        setDocPiiLoading(false);
        setDocPiiProgress(0);
      }, 500);
    };

    const formData = new FormData();
    docFiles.forEach((file) => formData.append("files", file));
    try {
      await fetch(`http://localhost:3000/document-pii?id=${id}`, {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      setDocPiiLoading(false);
      setDocPiiProgress(0);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
  };

  //        UI SECTIONS
  return (
    <>
      <NavBar logoSrc={IQ} />
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">ID Scanner</h1>

          <div className="flex justify-center gap-3 mb-8">
            <button
              onClick={() => setCurrentTab("image")}
              className={`px-4 py-2 rounded font-semibold ${currentTab === "image" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              Image Scan
            </button>
            <button
              onClick={() => setCurrentTab("db")}
              className={`px-4 py-2 rounded font-semibold ${currentTab === "db" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              DB Scan
            </button>
            <button
              onClick={() => setCurrentTab("document-pii")}
              className={`px-4 py-2 rounded font-semibold ${currentTab === "document-pii" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              Document Scan
            </button>
          </div>

          {/*IMAGE SCAN*/}
          {currentTab === "image" && (
            <section>
              <h2 className="text-xl font-bold text-blue-800 mb-4">Image Scan</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <label htmlFor="file-upload-img" className="text-sm font-medium text-gray-700">
                  Upload Images
                </label>
                <input
                  id="file-upload-img"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleImageFileChange}
                  className="block w-full md:w-auto border border-gray-300 rounded px-4 py-2 bg-white shadow-sm"
                  title="Upload images or PDF files"
                  placeholder="Select images or PDFs"
                />
                <button
                  onClick={() => uploadImageScan("classify")}
                  className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  disabled={imageLoading || imageFiles.length === 0}
                >
                  ML Scan
                </button>
                <button
                  onClick={() => uploadImageScan("metadata")}
                  className="bg-purple-600 text-white font-semibold px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                  disabled={imageLoading || imageFiles.length === 0}
                >
                  Filename-based Scan
                </button>
              </div>
              {imageLoading && (
                <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mb-6">
                  <div className="bg-blue-600 h-full transition-all duration-200" style={{ width: `${imageProgress}%` }} />
                </div>
              )}
              {imageResults.length > 0 && (
                <div className="overflow-x-auto mt-6">
                  <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
                    <thead className="bg-gray-200 text-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left">Sl. No</th>
                        <th className="px-4 py-2 text-left">Source</th>
                        <th className="px-4 py-2 text-left">Label / PII Type</th>
                        <th className="px-4 py-2 text-left">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {imageResults.map((res, idx) => (
                        <Fragment key={`${res.filename}-${idx}`}>
                          <tr className="border-t bg-white hover:bg-gray-50 transition">
                            <td className="px-4 py-3">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {res.filename || res.table || "-"}
                            </td>
                            <td className="px-4 py-3">
                              {imageMode === "classify"
                                ? res.label || "-"
                                : res.inferred_label || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <button
                                onClick={() => toggleImageMetadata(idx)}
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
                                      res.metadata || {
                                        table: res.table,
                                        column: res.column,
                                        value: res.value,
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
              )}
            </section>
          )}

          {/*DB SCAN*/}
          {currentTab === "db" && (
            <section>
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
                  onChange={(e) => setDbScanType(e.target.value as typeof dbScanType)}
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
                      placeholder="e.g. users_basic"
                    />
                  </>
                )}
                <button
                  onClick={runDbScan}
                  className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  disabled={dbLoading || !dbConnString}
                >
                  Run DB Scan
                </button>
              </div>
              {dbLoading && (
                <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mb-6 mt-1">
                  <div className="bg-blue-600 h-full transition-all duration-200" style={{ width: `50%` }} />
                </div>
              )}
              {dbResults.length > 0 && (
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
                      {dbResults.map((res, idx) => (
                        <Fragment key={`db-${res.filename || res.table || idx}`}>
                          <tr className="border-t bg-white hover:bg-gray-50 transition">
                            <td className="px-4 py-3">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{res.filename || res.table || "-"}</td>
                            <td className="px-4 py-3">{res.pii_type || res.label || res.inferred_label || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <button
                                onClick={() =>
                                  setDbResults((prev) =>
                                    prev.map((r, i) =>
                                      i === idx
                                        ? { ...r, showMetadata: !r.showMetadata }
                                        : r
                                    )
                                  )
                                }
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
                                      res.metadata ||
                                        {
                                          table: res.table,
                                          column: res.column,
                                          value: res.value,
                                          pii_type: res.pii_type,
                                        },
                                      null,
                                      
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
              )}
            </section>
          )}

          {/*DOCUMENT PII SCAN*/}
          {currentTab === "document-pii" && (
            <section>
              <h2 className="text-xl font-bold text-blue-800 mb-4">Document PII Scan</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <label htmlFor="file-upload-doc" className="text-sm font-medium text-gray-700">
                  Upload Documents
                </label>
                <input
                  id="file-upload-doc"
                  type="file"
                  multiple
                  accept=".txt,.csv,.pdf,.doc,.docx,.json,.xml,.html"
                  onChange={handleDocFileChange}
                  className="block w-full md:w-auto border border-gray-300 rounded px-4 py-2 bg-white shadow-sm"
                  title="Upload documents/files"
                  placeholder="Select documents"
                />
                <button
                  onClick={uploadDocumentPii}
                  className="bg-blue-700 text-white font-semibold px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
                  disabled={docPiiLoading || docFiles.length === 0}
                >
                  Document PII Scan
                </button>
              </div>
              {docPiiLoading && (
                <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mb-6">
                  <div className="bg-purple-600 h-full transition-all duration-200" style={{ width: `${docPiiProgress}%` }} />
                </div>
              )}
              {documentPiiResults.length > 0 && (
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
                      {documentPiiResults.map((res: any, idx: number) => {
                        const piiTypeNames = res.pii_types
                          ? Object.keys(res.pii_types).filter((k) => res.pii_types[k]?.length)
                          : [];
                        return (
                          <Fragment key={(res.file_name || "docpii") + idx}>
                            <tr className="border-t bg-white hover:bg-gray-50 transition">
                              <td className="px-4 py-3">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{res.file_name || "-"}</td>
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
                                  onClick={() => toggleDocPiiMetadata(idx)}
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
              )}
              {!docPiiLoading && documentPiiResults.length === 0 && (
                <div className="text-gray-700 py-3">No results for Document PII scan.</div>
              )}
            </section>
          )}

        </div>
      </div>
    </>
  );
};

export default App;
