// components/inputs/DocumentPIIUpload.tsx

import React from "react";

interface DocumentPIIUploadProps {
  handleDocFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadDocumentPii: () => void;
  docPiiLoading: boolean;
  docPiiProgress: number;
  docFiles: File[];
}

const DocumentPIIUpload: React.FC<DocumentPIIUploadProps> = ({
  handleDocFileChange,
  uploadDocumentPii,
  docPiiLoading,
  docPiiProgress,
  docFiles,
}) => {
  return (
    <div className="mb-10">
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
          <div
            className="bg-purple-600 h-full transition-all duration-200"
            style={{ width: `${docPiiProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default DocumentPIIUpload;
