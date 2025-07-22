import React from "react";

interface ModeSelectorProps {
  currentTab: string;
  setCurrentTab: (tab: "image" | "db" | "document-pii") => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentTab, setCurrentTab }) => {
  const tabs = [
    { id: "image", label: "Image Scan" },
    { id: "db", label: "DB Scan" },
    { id: "document-pii", label: "Document Scan" },
  ];

  return (
    <div className="flex justify-center gap-3 mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setCurrentTab(tab.id as "image" | "db" | "document-pii")}
          className={`px-4 py-2 rounded font-semibold ${
            currentTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ModeSelector;
