import React from "react";

interface ImageScanUploadProps {
  imageLoading: boolean;
  imageFiles: File[];
  handleImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadImageScan: (mode: "classify" | "metadata") => void;
}

const ImageScanUpload: React.FC<ImageScanUploadProps> = ({
  imageLoading,
  imageFiles,
  handleImageFileChange,
  uploadImageScan,
}) => {
  return (
    <>
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
        {/* <button
          onClick={() => uploadImageScan("metadata")}
          className="bg-purple-600 text-white font-semibold px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          disabled={imageLoading || imageFiles.length === 0}
        >
          Filename-based Scan
        </button> */}
      </div>
    </>
  );
};

export default ImageScanUpload;
