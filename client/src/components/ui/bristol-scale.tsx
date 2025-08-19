interface BristolScaleProps {
  selectedType: number | null;
  onTypeSelect: (type: number) => void;
}

export default function BristolScale({ selectedType, onTypeSelect }: BristolScaleProps) {
  const bristolTypes = [
    { 
      type: 1, 
      name: "Type 1", 
      description: "Separate hard lumps",
      visual: "●●●●●",
      severity: "Severe constipation",
      color: "text-red-600"
    },
    { 
      type: 2, 
      name: "Type 2", 
      description: "Lumpy and sausage-like",
      visual: "●●●━━━",
      severity: "Mild constipation", 
      color: "text-orange-600"
    },
    { 
      type: 3, 
      name: "Type 3", 
      description: "Sausage with cracks",
      visual: "━╋━╋━",
      severity: "Normal", 
      color: "text-green-600"
    },
    { 
      type: 4, 
      name: "Type 4", 
      description: "Smooth, soft sausage",
      visual: "━━━━━",
      severity: "Normal", 
      color: "text-green-600"
    },
    { 
      type: 5, 
      name: "Type 5", 
      description: "Soft blobs with clear-cut edges",
      visual: "●○●○●",
      severity: "Lacking fiber", 
      color: "text-yellow-600"
    },
    { 
      type: 6, 
      name: "Type 6", 
      description: "Mushy with ragged edges",
      visual: "∼∼∼∼∼",
      severity: "Mild diarrhea", 
      color: "text-orange-600"
    },
    { 
      type: 7, 
      name: "Type 7", 
      description: "Entirely liquid",
      visual: "~~~~~",
      severity: "Severe diarrhea", 
      color: "text-red-600"
    },
  ];

  return (
    <div className="space-y-3">
      {bristolTypes.map(({ type, name, description, visual, severity, color }) => (
        <button
          key={type}
          type="button"
          onClick={() => onTypeSelect(type)}
          className={`w-full p-4 text-left border rounded-lg transition-colors ${
            selectedType === type
              ? "border-primary bg-primary/10 shadow-sm"
              : "border-gray-200 bg-white hover:border-primary hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-sm">
                {type}
              </div>
              <div>
                <p className="font-medium text-sm">{name}</p>
                <p className={`text-xs font-medium ${color}`}>{severity}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg mb-1 text-gray-400">{visual}</div>
            </div>
          </div>
          <p className="text-xs text-gray-600">{description}</p>
        </button>
      ))}
    </div>
  );
}
