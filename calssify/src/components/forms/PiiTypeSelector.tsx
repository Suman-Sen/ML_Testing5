// components/forms/PiiTypeSelector.tsx
import React from "react";

interface PiiTypeSelectorProps {
  selected: string[];
  setSelected: (selected: string[]) => void;
}

const PII_TYPES = [
  "pan", "email", "aadhaar", "phone", "passport", "ssn", "ifsc", "credit_card", "ip_address",
  "mac_address", "dob", "gender", "name", "address", "voter_id",
  "bank_account", "vehicle_reg", "employee_id", "medical_record", "insurance_policy"
];

const formatLabel = (type: string) =>
  type
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const PiiTypeSelector: React.FC<PiiTypeSelectorProps> = ({ selected, setSelected }) => {
  const handleToggle = (type: string) => {
    if (selected.includes(type)) {
      setSelected(selected.filter(t => t !== type));
    } else {
      setSelected([...selected, type]);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Select PII Types:</label>
      <div className="flex flex-wrap gap-2 text-sm">
        {PII_TYPES.map((type) => (
          <label key={type} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={selected.includes(type)}
              onChange={() => handleToggle(type)}
              className="accent-blue-600"
            />
            <span>{formatLabel(type)}</span>
          </label>
        ))}
      </div>
    </div>
  );
};


export default PiiTypeSelector;
