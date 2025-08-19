interface SymptomSelectorProps {
  selectedSymptoms: string[];
  onSymptomsChange: (symptoms: string[]) => void;
}

export default function SymptomSelector({ selectedSymptoms, onSymptomsChange }: SymptomSelectorProps) {
  const availableSymptoms = [
    "Bloating",
    "Gas",
    "Cramping",
    "Nausea",
    "Heartburn",
    "Fatigue",
    "Diarrhea",
    "Constipation",
    "Stomach Pain",
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
    
    if (isSelected) {
      // Color-code based on symptom severity/type
      if (['Cramping', 'Stomach Pain'].includes(symptom)) {
        return "bg-red-100 text-red-700 border-red-200";
      } else if (['Bloating', 'Nausea'].includes(symptom)) {
        return "bg-orange-100 text-orange-700 border-orange-200";
      } else {
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      }
    }
    
    return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200";
  };

  return (
    <div className="flex flex-wrap gap-2">
      {availableSymptoms.map((symptom) => (
        <button
          key={symptom}
          type="button"
          onClick={() => toggleSymptom(symptom)}
          className={`px-3 py-2 rounded-lg text-sm border transition-colors ${getSymptomStyle(symptom)}`}
        >
          {symptom}
        </button>
      ))}
    </div>
  );
}
