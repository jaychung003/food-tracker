interface BristolScaleProps {
  selectedType: number | null;
  onTypeSelect: (type: number) => void;
}

export default function BristolScale({ selectedType, onTypeSelect }: BristolScaleProps) {
  const bristolTypes = [
    { type: 1, name: "Type 1", description: "Hard lumps" },
    { type: 2, name: "Type 2", description: "Lumpy, sausage-like" },
    { type: 3, name: "Type 3", description: "Sausage w/ cracks" },
    { type: 4, name: "Type 4", description: "Smooth sausage" },
    { type: 5, name: "Type 5", description: "Soft blobs" },
    { type: 6, name: "Type 6", description: "Mushy" },
    { type: 7, name: "Type 7", description: "Liquid" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {bristolTypes.map(({ type, name, description }) => (
        <button
          key={type}
          type="button"
          onClick={() => onTypeSelect(type)}
          className={`p-3 text-left border rounded-lg transition-colors ${
            selectedType === type
              ? "border-primary bg-primary/5"
              : "border-gray-200 bg-white hover:border-primary"
          }`}
        >
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-gray-600">{description}</p>
        </button>
      ))}
    </div>
  );
}
