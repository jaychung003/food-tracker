interface SymptomSelectorProps {
  selectedSymptoms: string[];
  onSymptomsChange: (symptoms: string[]) => void;
}

export default function SymptomSelector({ selectedSymptoms, onSymptomsChange }: SymptomSelectorProps) {
  const availableSymptoms = [
    "Gas", 
    "Nausea",
    "Fatigue",
    "Constipation",
    "Urgency",
    "Blood", 
    "Pain",
  ];

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      onSymptomsChange(selectedSymptoms.filter(s => s !== symptom));
    } else {
      onSymptomsChange([...selectedSymptoms, symptom]);
    }
  };

  const getSymptomStyle = (symptom: string) => {
    const isSelected = selectedSymptoms.includes(symptom);
    const hasSeverityScale = ['Urgency', 'Blood', 'Pain'].includes(symptom);
    
    if (isSelected) {
      // Color-code based on symptom type
      if (hasSeverityScale) {
        return "bg-blue-100 text-blue-700 border-blue-200";
      } else if (['Nausea'].includes(symptom)) {
        return "bg-orange-100 text-orange-700 border-orange-200";
      } else {
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      }
    }
    
    return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200";
  };

  return (
    <div className="flex flex-wrap gap-2">
      {availableSymptoms.map((symptom) => {
        const hasSeverityScale = ['Urgency', 'Blood', 'Pain'].includes(symptom);
        return (
          <button
            key={symptom}
            type="button"
            onClick={() => toggleSymptom(symptom)}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${getSymptomStyle(symptom)} relative`}
          >
            {symptom}
            {hasSeverityScale && (
              <span className="ml-1 text-xs opacity-70">1-3</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
