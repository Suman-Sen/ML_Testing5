import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

import NavBar from "./components/ui/NavBar";
import ModeSelector from "./components/ui/ModeSelector";
import ResultsTable from "./components/results/ResultsTable";
import ImageScanUpload from "./components/ui/ImageScanUpload";
import DbScanForm from "./components/DbScanForm";
import DbResultsTable, {
  type DbResultEntry,
} from "./components/results/DbResultsTable";
import DocumentUploader from "./components/forms/DocumentUploader";
import DocumentPiiResultsTable from "./components/results/DocumentPiiResultsTable";
import PiiTypeSelector from "./components/forms/PiiTypeSelector";
import { flattenScanResults } from "./utils/flattenScanResults";
import DbScanMetadata from "./components/results/DbScanMetadata";
import type {
  ClassificationResult,
  DocumentPiiResult,
  PayloadType,
} from "./utils/types";

const IQ = "/images/IQ.png";

const App: React.FC = () => {
  // Section selector
  const [currentTab, setCurrentTab] = useState<"image" | "db" | "document-pii">(
    "image"
  );
  const [selectedPiiTypes, setSelectedPiiTypes] = useState<string[]>([]);

  // Image Scan State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageResults, setImageResults] = useState<ClassificationResult[]>([]);
  const [imageProgress, setImageProgress] = useState<number>(0);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageMode, setImageMode] = useState<"classify" | "metadata">(
    "classify"
  );

  // DB Scan State
  const [dbConnString, setDbConnString] = useState<string>("");
  const [dbScanType, setDbScanType] = useState<
    "pii-meta" | "pii-full" | "pii-table"
  >("pii-full");
  const [tableName, setTableName] = useState<string>("");
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [dbResults, setDbResults] = useState<DbResultEntry[]>([]);
  const [dbResultsMetadata, setDbResultsMetadata] = useState<{
    totalTablesScanned: number;
    totalRowsScanned: number;
    totalPiiFound: number;
    piiTypeDistribution: Record<string, number>;
  } | null>(null);

  // Document PII Scan State
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [documentPiiResults, setDocumentPiiResults] = useState<
    DocumentPiiResult[]
  >([]);
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

  // Image Scan handlers
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

      setTimeout(async () => {
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append("images", file));

        try {
          await axios.post(
            `http://localhost:3000/image?id=${id}&type=${scanType}`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        } catch {
          setImageLoading(false);
          setImageProgress(0);
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        }
      }, 100);
    };

    socket.onmessage = (event) => {
      console.log("Message received from ws:", event.data);
      const data = JSON.parse(event.data);
      if (data.requestId !== id) return;
      if (data.done) {
        socket.close();
        return;
      }
      setImageResults((prev) => [
        ...prev,
        // TODO: set the r: proper type
        ...(data.batch || []).map((r: []) => ({ ...r, showMetadata: false })),
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
  };

  // DB SCAN

  const runDbScan = async () => {
    if (!dbConnString) return;
    setDbLoading(true);
    setDbResults([]);
    setDbResultsMetadata(null);

    const payload: PayloadType = {
      conn_string: dbConnString,
      scan_type: dbScanType,
      db_type: "postgres",
    };

    if (dbScanType === "pii-table" && tableName.trim()) {
      payload.table_name = tableName.toLowerCase();
    }

    if (selectedPiiTypes.length > 0) {
      payload.pii_types = selectedPiiTypes;
    }

    try {
      const res = await axios.post("http://localhost:3000/db-pii", payload, {
        headers: { "Content-Type": "application/json" },
      });

      const rawData = res.data?.data || res.data;
      const metadata = rawData.metadata;
      const piiData = rawData.results?.pii_data || {};

      setDbResultsMetadata(metadata);
      setDbResults(flattenScanResults(piiData));
      console.log("Raw DB Scan Response:", rawData);
    } catch (err) {
      console.error("DB scan failed:", err);
    } finally {
      setDbLoading(false);
    }
  };

  // Document PII Scan handlers
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

  // document uploader
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

      setTimeout(async () => {
        const formData = new FormData();
        docFiles.forEach((file) => formData.append("files", file));
        selectedPiiTypes.forEach((type) => formData.append("pii_types", type));

        try {
          await axios.post(
            `http://localhost:3000/document-pii?id=${id}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
        } catch {
          setDocPiiLoading(false);
          setDocPiiProgress(0);
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        }
      }, 100);
    };

    socket.onmessage = (event) => {
      console.log("Document PII WS message received:", event.data);
      const data = JSON.parse(event.data);
      if (data.requestId !== id) return;

      if (Array.isArray(data.batch)) {
        setDocumentPiiResults(
          // TODO: set the r: proper type
          data.batch.map((r: []) => ({ ...r, showMetadata: false }))
        );
        setDocPiiProgress((prev) => Math.min(prev + 15, 95));
      } else if (data.batch) {
        setDocumentPiiResults([{ ...data.batch, showMetadata: false }]);
        setDocPiiProgress((prev) => Math.min(prev + 15, 95));
      }

      if (data.error) {
        setDocumentPiiResults([
          {
            file_name: "Error",
            pii_found: false,
            error: data.error,
            showMetadata: false,
          },
        ]);
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
  };

  const toggleDbMetadata = (index: number) => {
    setDbResults((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, showMetadata: !r.showMetadata } : r
      )
    );
  };

  // Return your UI here (unchanged JSX; include NavBar, ModeSelector, sections)

  return (
    <>
      <NavBar logoSrc={IQ} />
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
          {/* <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">ID Scanner</h1> */}
          <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">
            {currentTab === "image" && "ID Scan"}
            {currentTab === "db" && "Database Scan"}
            {currentTab === "document-pii" && "Document Scan"}
          </h1>

          <div className="container mx-auto p-4">
            <ModeSelector
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
            />
          </div>
          {currentTab === "image" && (
            <section>
              <ImageScanUpload
                imageLoading={imageLoading}
                imageFiles={imageFiles}
                handleImageFileChange={handleImageFileChange}
                uploadImageScan={uploadImageScan}
              />
              {imageLoading && (
                <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mb-6">
                  <div
                    className={`bg-blue-600 h-full w-[${imageProgress}%] transition-all duration-200`}
                    // style={{ width: `${imageProgress}%` }}
                  />
                </div>
              )}
              {imageResults.length > 0 && (
                <ResultsTable
                  results={imageResults}
                  imageMode={imageMode}
                  onToggleMetadata={toggleImageMetadata}
                />
              )}
            </section>
          )}

          {currentTab === "db" && (
            <section>
              <DbScanForm
                dbConnString={dbConnString}
                dbScanType={dbScanType}
                tableName={tableName}
                dbLoading={dbLoading}
                setDbConnString={setDbConnString}
                setDbScanType={setDbScanType}
                setTableName={setTableName}
                runDbScan={runDbScan}
                selectedPiiTypes={selectedPiiTypes}
                setSelectedPiiTypes={setSelectedPiiTypes}
              />
              {dbLoading && (
                <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mb-6 mt-1">
                  <div
                    className="bg-blue-600 h-full w-[50%] transition-all duration-200"
                    // style={{ width: `50%` }}
                  />
                </div>
              )}
              {dbResults.length > 0 && (
                <div className="overflow-x-auto mt-6">
                  <h2 className="text-xl font-bold text-blue-800 mb-4">
                    Database PII Results
                  </h2>
                  {dbResultsMetadata && (
                    <DbScanMetadata metadata={dbResultsMetadata} />
                  )}
                  <DbResultsTable
                    results={dbResults}
                    onToggleMetadata={toggleDbMetadata}
                  />
                </div>
              )}
            </section>
          )}

          {currentTab === "document-pii" && (
            <section>
              <h2 className="text-xl font-bold text-blue-800 mb-4">
                Document PII Scan
              </h2>

              <PiiTypeSelector
                selected={selectedPiiTypes}
                setSelected={setSelectedPiiTypes}
              />

              <DocumentUploader
                docPiiLoading={docPiiLoading}
                docFiles={docFiles}
                docPiiProgress={docPiiProgress}
                handleDocFileChange={handleDocFileChange}
                uploadDocumentPii={uploadDocumentPii}
              />

              {docPiiLoading && (
                <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mb-6">
                  <div
                    className={`bg-purple-600 h-full w-[${docPiiProgress}%] transition-all duration-200`}
                    // style={{ width: `${docPiiProgress}%` }}
                  />
                </div>
              )}
              {documentPiiResults.length > 0 && (
                <DocumentPiiResultsTable
                  results={documentPiiResults}
                  loading={docPiiLoading}
                  onToggleMetadata={toggleDocPiiMetadata}
                />
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default App;
