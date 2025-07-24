import React from "react";

interface Props {
  progress: number;
  color?: "blue" | "purple" | "green";
}

const ProgressBar: React.FC<Props> = ({ progress, color = "blue" }) => {
  return (
    <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mb-6">
      <div
        className={`bg-${color}-600 h-full transition-all duration-200`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
